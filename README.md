# Siciliano Gramas e Pisos — Guia Completo (Deploy, Monitoramento e Manutenção)

Este guia explica, passo a passo e sem jargão, como colocar o site no ar **de graça** e mantê-lo funcionando.

---

## 1. Como o site funciona (visão geral)

| Peça | Para que serve | Custo |
|---|---|---|
| **GitHub** | Guarda o código do site. Toda alteração enviada para lá atualiza o site sozinha. | Grátis |
| **Render** | "Computador na internet" que mostra o site para os visitantes. | Grátis (plano Free) |
| **Supabase** | Banco de dados: guarda cada pedido de orçamento enviado pelo formulário. | Grátis (plano Free) |
| **UptimeRobot** | Visita o site a cada 5 minutos para mantê-lo acordado e te avisa por e-mail se ele cair. | Grátis |

**Caminho de um orçamento:** visitante preenche o formulário → o site salva no Supabase → abre o WhatsApp com a mensagem pronta.
Se o banco falhar por qualquer motivo, **o WhatsApp abre do mesmo jeito** — nenhum cliente é perdido.

### Arquivos do projeto

| Arquivo | O que é |
|---|---|
| `index.html`, `produtos.html`, `orcamento.html` | As 3 páginas do site |
| `style.css` / `script.js` | Visual e comportamento das páginas |
| `images/` | Fotos e logomarca |
| `server.js` | Servidor: entrega as páginas, rota `/health` e salva orçamentos |
| `schema.sql` | Comando para criar a tabela no Supabase |
| `render.yaml` | Configuração automática do Render |
| `.env.example` | Modelo das "senhas" (variáveis de ambiente) — sem valores reais |
| `package.json` | Lista de bibliotecas usadas (Express, Supabase, dotenv) |

---

## 2. Passo 1 — Criar o banco no Supabase (≈5 min)

1. Acesse **https://supabase.com** → **Start your project** → entre com sua conta do GitHub.
2. Clique em **New project**:
   - **Name:** `siciliano`
   - **Database Password:** crie uma senha forte e guarde-a.
   - **Region:** `South America (São Paulo)`
   - **Plan:** Free (US$ 0)
3. Aguarde ~2 minutos até o projeto ficar pronto.
4. No menu da esquerda, abra **SQL Editor** → **New query**.
5. Abra o arquivo [`schema.sql`](schema.sql), copie **todo** o conteúdo, cole no editor e clique em **Run**. Deve aparecer *"Success. No rows returned"*.
6. Vá em **Project Settings** (engrenagem) → **API** e copie:
   - **Project URL** → será o `SUPABASE_URL`
   - **anon public** (em *Project API keys*) → será o `SUPABASE_ANON_KEY`

> ⚠️ **Nunca** copie a chave **service_role**. Ela dá acesso total ao banco e não é usada neste projeto.

**O que é RLS?** É uma "trava" por linha da tabela. Configuramos para que o site possa **apenas adicionar** orçamentos — ninguém de fora consegue ler, alterar ou apagar os dados.

**Onde ver os orçamentos?** Supabase → **Table Editor** → tabela `orcamentos`. Você pode mudar a coluna `status` para `em_atendimento` ou `finalizado`.

---

## 3. Passo 2 — Enviar o código para o GitHub

O projeto já está ligado ao repositório `github.com/ferpa1914/siciliano-gramas-e-pisos`.
Para enviar alterações (no terminal, dentro da pasta do projeto):

```
git add .
git commit -m "Descreva a alteração"
git push origin main
```

> O arquivo `.env` (com chaves reais) **nunca** vai para o GitHub — ele está bloqueado no `.gitignore`.

---

## 4. Passo 3 — Publicar no Render (≈10 min)

1. Acesse **https://render.com** → **Get Started** → entre com o **GitHub**.
2. Clique em **New +** → **Blueprint**.
3. Escolha o repositório **siciliano-gramas-e-pisos** → **Connect**.
4. O Render lê o arquivo `render.yaml` e mostra o serviço **siciliano-gramas-e-pisos** no plano **Free**.
5. Ele pedirá dois valores — cole os que você copiou do Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Clique em **Apply** e aguarde de 3 a 5 minutos.
7. Quando aparecer **Live**, seu site estará em um endereço como
   `https://siciliano-gramas-e-pisos.onrender.com`

**Já ficou configurado automaticamente:**
- **Plano Free** (sem cobrança, não pede cartão).
- **Deploy automático:** cada `git push` na branch `main` atualiza o site sozinho.
- **Health check em `/health`:** o Render verifica se o site está saudável antes de trocar para uma nova versão. Se a nova versão tiver erro, a versão antiga continua no ar.

**Teste:** abra `https://SEU-SITE.onrender.com/health`. O correto é aparecer:
```json
{"status":"ok","db":"ok"}
```

<details>
<summary>Alternativa: criar manualmente (sem Blueprint)</summary>

New + → **Web Service** → escolha o repositório → preencha:
- Runtime: **Node** · Branch: **main**
- Build Command: `npm ci` · Start Command: `npm start`
- Instance Type: **Free**
- Environment: adicione `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `NODE_ENV=production`
- Advanced → Health Check Path: `/health`
</details>

---

## 5. Passo 4 — Monitoramento e alertas com UptimeRobot (≈5 min)

**Por que é essencial:** no plano grátis, o Render **"dorme" após 15 minutos sem visitas** (o primeiro visitante esperaria ~50 segundos) e o Supabase **pausa após 7 dias sem uso**. A rota `/health` resolve os dois: cada visita do UptimeRobot acorda o Render **e** faz uma consulta no banco.

1. Acesse **https://uptimerobot.com** → **Register for FREE**.
2. Clique em **+ New monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Site Siciliano`
   - **URL:** `https://SEU-SITE.onrender.com/health`
   - **Monitoring Interval:** `5 minutes`
3. Em **Alert contacts**, marque seu e-mail (já vem cadastrado).
4. *(Opcional, recomendado)* Alertas no celular: instale o app **UptimeRobot** (Android/iOS) para receber notificações push, ou em **My Settings → Alert Contacts** adicione o **Telegram** (grátis).
5. Clique em **Create Monitor**.

**Quando você recebe alerta:**
- Site fora do ar, ou
- Banco com problema (a rota `/health` responde erro **503**).

### Logs (registro de erros)
Render → seu serviço → **Logs**. Cada evento aparece em uma linha com nome claro. Pesquise por:
- `orcamento_salvo` → orçamento gravado com sucesso
- `orcamento_falhou` → falha ao gravar no banco
- `health_db_falhou` → banco inacessível
- `"level":"error"` → todos os erros

> 💡 Opcional: o **Sentry** (plano grátis, 5 mil erros/mês) pode ser adicionado no futuro para capturar erros com mais detalhes. Para um site deste porte, os logs do Render + UptimeRobot já são suficientes.

---

## 6. Checklist final — teste em produção

Marque cada item após publicar:

- [ ] `https://SEU-SITE.onrender.com` abre a página inicial com a logomarca no topo
- [ ] Páginas **Produtos** e **Orçamento** abrem pelo menu (computador e celular)
- [ ] Filtros de categoria em Produtos funcionam
- [ ] `/health` mostra `{"status":"ok","db":"ok"}`
- [ ] Enviar um orçamento de teste abre o WhatsApp com a mensagem preenchida
- [ ] O orçamento de teste aparece no Supabase → Table Editor → `orcamentos`
- [ ] Render → Logs mostra `orcamento_salvo`
- [ ] UptimeRobot mostra o monitor **Up** (verde)
- [ ] `https://SEU-SITE.onrender.com/server.js` mostra página inicial/erro (arquivos internos protegidos)
- [ ] Botão verde flutuante do WhatsApp aparece no canto inferior direito

---

## 7. Limitações do plano gratuito (o que você precisa saber)

| Serviço | Limite | Impacto para você |
|---|---|---|
| Render Free | Dorme após 15 min sem visitas | **Resolvido** pelo UptimeRobot (ping a cada 5 min) |
| Render Free | 750 horas/mês de funcionamento | Um único site ligado 24h usa ~744h → cabe. **Não crie um 2º serviço Free** na mesma conta, senão as horas acabam antes do fim do mês. |
| Render Free | 100 GB/mês de tráfego | Suficiente para milhares de visitas |
| Render Free | Pode reiniciar ocasionalmente | O site volta sozinho em segundos |
| Supabase Free | Pausa após 7 dias sem uso | **Resolvido** pelo `/health` (consulta o banco a cada 5 min) |
| Supabase Free | 500 MB de banco | Cabem centenas de milhares de orçamentos |
| Supabase Free | Máximo 2 projetos ativos | Use apenas 1 para este site |
| UptimeRobot Free | 50 monitores, intervalo mínimo 5 min | Suficiente |
| Domínio próprio | `.com.br` **não é grátis** (~R$ 40/ano no registro.br) | Opcional. O Render aceita domínio próprio sem custo extra. |

> Nenhum dos serviços acima pede cartão de crédito no plano Free. Se algum dia algum deles pedir, **não cadastre** sem antes verificar — pode ser upgrade pago.

---

## 8. Como atualizar o site depois

**Trocar textos, fotos ou preços:**
1. Edite o arquivo (ex.: `produtos.html`) ou coloque a nova foto em `images/`.
2. No terminal da pasta do projeto:
   ```
   git add .
   git commit -m "Atualiza fotos de produtos"
   git push origin main
   ```
3. Em 2–4 minutos o Render publica a nova versão sozinho (acompanhe em Render → **Events**).

**Testar no seu computador antes de publicar (opcional):**
1. Copie `.env.example` para `.env` e preencha com as chaves do Supabase.
2. Rode `npm install` (só na primeira vez) e depois `npm start`.
3. Abra `http://localhost:3000`.

> No Windows, se aparecer erro de "execução de scripts desabilitada", use `npm.cmd install` e `npm.cmd start`.

**Trocar o número do WhatsApp:** em `script.js`, procure `recipientNumber`, e nos arquivos `.html` procure `5567993340565`.

---

## 9. Se algo der errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| E-mail do UptimeRobot "Down" | Render reiniciando ou deploy com erro | Veja Render → Logs. Geralmente volta sozinho em 1–2 min. |
| `/health` mostra `"db":"error"` | Supabase pausado ou chave errada | Supabase → se aparecer "Paused", clique **Restore**. Confira as variáveis no Render → Environment. |
| `/health` mostra `"db":"not_configured"` | Variáveis não cadastradas no Render | Render → Environment → adicione `SUPABASE_URL` e `SUPABASE_ANON_KEY` → **Save** (o site reinicia). |
| Orçamento abre WhatsApp mas não aparece no banco | Banco fora ou tabela não criada | Rode novamente o `schema.sql` no SQL Editor. |
| Deploy falhou no Render | Erro no código enviado | Render → Events → clique no deploy com erro e leia o log. A versão anterior continua no ar. |
