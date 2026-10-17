/**
 * ==============================================================================
 * SERVIDOR — SICILIANO GRAMAS E PISOS
 * ==============================================================================
 * Hospedagem:      Render (plano Free)
 * Banco de dados:  Supabase (plano Free)
 * Monitoramento:   UptimeRobot (plano Free) chamando /health a cada 5 minutos
 *
 * O que este servidor faz:
 *  1. Entrega as páginas do site (index, produtos, orcamento, imagens, CSS, JS).
 *  2. GET  /health        -> diz se o site e o banco estão funcionando.
 *  3. POST /api/orcamento -> salva o pedido de orçamento no Supabase.
 *
 * Segurança:
 *  - Usa SOMENTE a chave "anon" do Supabase (lida de variável de ambiente).
 *  - A tabela tem RLS: visitantes podem apenas INSERIR, nunca ler dados.
 *  - Arquivos internos (server.js, schema.sql, package.json...) não são públicos.
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ------------------------------------------------------------------------------
// LOG ESTRUTURADO (JSON) — fácil de pesquisar no painel "Logs" do Render
// ------------------------------------------------------------------------------
function log(level, event, data = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...data });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

// ------------------------------------------------------------------------------
// CONEXÃO COM O SUPABASE
// ------------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false } // servidor não precisa guardar sessão
  });
  log('info', 'supabase_configurado');
} else {
  log('warn', 'supabase_nao_configurado', {
    detalhe: 'Defina SUPABASE_URL e SUPABASE_ANON_KEY. O site funciona, mas orçamentos não serão salvos.'
  });
}

/**
 * Executa uma operação no banco tentando novamente em caso de falha
 * temporária (ex.: banco "acordando" ou instabilidade de rede).
 * @param {Function} operacao - função assíncrona que retorna { error }
 * @param {number} tentativas - total de tentativas
 */
async function comRetry(operacao, tentativas = 3) {
  let ultimoErro = null;
  for (let i = 1; i <= tentativas; i++) {
    try {
      const resultado = await operacao();
      if (!resultado.error) return resultado;
      ultimoErro = resultado.error;
    } catch (err) {
      ultimoErro = err;
    }
    if (i < tentativas) {
      await new Promise((r) => setTimeout(r, 500 * i)); // espera 0,5s, 1s...
    }
  }
  return { error: ultimoErro };
}

// ------------------------------------------------------------------------------
// MIDDLEWARES
// ------------------------------------------------------------------------------
app.disable('x-powered-by');           // não revela a tecnologia usada
app.set('trust proxy', 1);             // necessário no Render para obter o IP real
app.use(express.json({ limit: '20kb' }));

// Cabeçalhos básicos de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Log de cada requisição (o /health só é registrado se der erro, para não poluir)
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    if (req.path === '/health' && res.statusCode < 400) return;
    log(res.statusCode >= 500 ? 'error' : 'info', 'http', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - inicio
    });
  });
  next();
});

// Bloqueia acesso público a arquivos internos do projeto
const ARQUIVOS_PRIVADOS = /^\/(server\.js|schema\.sql|package(-lock)?\.json|node_modules|\.git|\.env)/i;
app.use((req, res, next) => {
  if (ARQUIVOS_PRIVADOS.test(req.path)) return res.status(404).end();
  next();
});

// Arquivos do site (HTML, CSS, JS, imagens). Arquivos ocultos (.env) são ignorados.
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  extensions: ['html'],                 // permite /produtos e /orcamento sem ".html"
  maxAge: IS_PROD ? '7d' : 0,
  setHeaders: (res, filePath) => {
    // Páginas HTML sempre atualizadas após um novo deploy
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ------------------------------------------------------------------------------
// GET /health — verificação de saúde (usada pelo Render e pelo UptimeRobot)
//
// Chamada a cada 5 min pelo UptimeRobot, ela:
//  1. Mantém o Render acordado (ele dorme após 15 min sem visitas).
//  2. Faz uma consulta leve no Supabase, evitando a pausa após 7 dias sem uso.
//  3. Responde 503 se o banco falhar -> o UptimeRobot envia alerta por e-mail.
// ------------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!supabase) {
    return res.status(503).json({ status: 'error', db: 'not_configured' });
  }

  const { error } = await comRetry(() =>
    supabase.from('orcamentos').select('id', { head: true, count: 'exact' }).limit(1)
  );

  if (error) {
    log('error', 'health_db_falhou', { motivo: error.message || String(error) });
    return res.status(503).json({ status: 'error', db: 'error' });
  }

  return res.status(200).json({ status: 'ok', db: 'ok' });
});

// ------------------------------------------------------------------------------
// LIMITE SIMPLES DE ENVIOS (anti-spam): máx. 5 orçamentos por IP a cada 10 min
// ------------------------------------------------------------------------------
const JANELA_MS = 10 * 60 * 1000;
const MAX_ENVIOS = 5;
const enviosPorIp = new Map();

function excedeuLimite(ip) {
  const agora = Date.now();
  const lista = (enviosPorIp.get(ip) || []).filter((t) => agora - t < JANELA_MS);
  lista.push(agora);
  enviosPorIp.set(ip, lista);
  return lista.length > MAX_ENVIOS;
}
// Limpeza periódica da memória
setInterval(() => {
  const agora = Date.now();
  for (const [ip, lista] of enviosPorIp) {
    if (lista.every((t) => agora - t >= JANELA_MS)) enviosPorIp.delete(ip);
  }
}, JANELA_MS).unref();

// ------------------------------------------------------------------------------
// VALIDAÇÃO DOS DADOS DO FORMULÁRIO
// ------------------------------------------------------------------------------
/** Remove espaços extras e caracteres de controle; corta no tamanho máximo. */
function limparTexto(valor, max) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validarOrcamento(body) {
  const nome = limparTexto(body.nome, 100);
  const telefone = limparTexto(body.telefone, 20);
  const produto = limparTexto(body.produto, 150);
  const mensagem = typeof body.mensagem === 'string'
    ? body.mensagem.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, 1000)
    : '';
  const area = Number(body.area);
  const digitosTelefone = telefone.replace(/\D/g, '');

  if (nome.length < 3) return { erro: 'Informe seu nome completo.' };
  if (digitosTelefone.length < 10 || digitosTelefone.length > 13) return { erro: 'Informe um WhatsApp válido com DDD.' };
  if (!produto) return { erro: 'Selecione o tipo de revestimento.' };
  if (!Number.isFinite(area) || area <= 0 || area > 1000000) return { erro: 'Informe uma área válida em m².' };

  return { dados: { nome, telefone, produto, area, mensagem: mensagem || null } };
}

// ------------------------------------------------------------------------------
// POST /api/orcamento — salva o pedido de orçamento
// ------------------------------------------------------------------------------
app.post('/api/orcamento', async (req, res) => {
  if (excedeuLimite(req.ip)) {
    return res.status(429).json({ success: false, error: 'Muitos envios seguidos. Aguarde alguns minutos.' });
  }

  const { erro, dados } = validarOrcamento(req.body || {});
  if (erro) return res.status(400).json({ success: false, error: erro });

  if (!supabase) {
    log('warn', 'orcamento_nao_salvo', { motivo: 'supabase_nao_configurado' });
    return res.status(503).json({ success: false, error: 'Não foi possível registrar agora.' });
  }

  // Importante: NÃO usar .select() após o insert. Com RLS, o visitante
  // (chave anon) só tem permissão de INSERIR, não de LER.
  const { error } = await comRetry(() => supabase.from('orcamentos').insert([dados]));

  if (error) {
    log('error', 'orcamento_falhou', { motivo: error.message || String(error) });
    // Mensagem amigável, sem detalhes técnicos. O site abre o WhatsApp mesmo assim.
    return res.status(503).json({ success: false, error: 'Não foi possível registrar agora.' });
  }

  log('info', 'orcamento_salvo', { produto: dados.produto, area: dados.area });
  return res.status(201).json({ success: true });
});

// ------------------------------------------------------------------------------
// PÁGINA NÃO ENCONTRADA -> volta para a página inicial
// ------------------------------------------------------------------------------
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Rota não encontrada.' });
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Erros inesperados: registra no log e responde sem expor detalhes
app.use((err, req, res, next) => {
  log('error', 'erro_inesperado', { motivo: err.message, path: req.path });
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: 'Erro interno. Tente novamente.' });
});

process.on('unhandledRejection', (reason) => log('error', 'unhandled_rejection', { motivo: String(reason) }));

// ------------------------------------------------------------------------------
// INICIALIZAÇÃO E ENCERRAMENTO SEGURO
// ------------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  log('info', 'servidor_iniciado', { porta: PORT, url: `http://localhost:${PORT}` });
});

function encerrar(sinal) {
  log('info', 'servidor_encerrando', { sinal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
