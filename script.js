/**
 * Siciliano Revestimentos - Scripts e Efeitos Premium (Edição 2026)
 * Lógica Front-end de Movimento Awwwards, GSAP, Lenis e Cursor Magnético
 */

// Configuração Geral (Número do WhatsApp comercial ativo)
const WHATSAPP_CONFIG = {
  recipientNumber: "5567993340565",
  companyName: "Siciliano Grama Sintética"
};

document.addEventListener("DOMContentLoaded", () => {
  // Inicializações do Design System & Scroll
  initLenisScroll();
  initCustomCursor();
  initMagneticEffect();
  initHeroParallax();
  initSpotlightEffect();
  
  // Inicializações de Animações GSAP
  initGSAPReveal();
  
  // Inicializações Nativas Funcionais (Mantidas & Refinadas)
  initHeaderScroll();
  initMobileMenu();
  initPhoneMask();
  initFormSubmit();
  initFAQAccordion();
  initScrollSpy();
  initProductFilters();
  initMobileFilterDropdown();
  initProductSliders();
});

/* ==========================================================================
   1. LENIS SMOOTH SCROLL (ROLAGEM SUAVE DE ALTA PERFORMANCE)
   ========================================================================== */
let lenisInstance;

function initLenisScroll() {
  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo ease-out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 1.5,
    infinite: false,
  });

  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Sincroniza o ScrollTrigger do GSAP com a rolagem suave do Lenis
  lenisInstance.on('scroll', ScrollTrigger.update);
}

/* ==========================================================================
   2. CURSOR CUSTOMIZADO MAGNÉTICO E REATIVO
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById("custom-cursor");
  if (!cursor) return;

  let mouseX = 0, mouseY = 0;
  let posX = 0, posY = 0;

  // Atualiza coordenadas no mousemove
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Efeito de interpolação (lerp) com ticker do GSAP para suavidade impecável
  gsap.ticker.add(() => {
    posX += (mouseX - posX) * 0.15;
    posY += (mouseY - posY) * 0.15;
    gsap.set(cursor, { css: { left: posX, top: posY } });
  });

  // Altera escala ao passar por elementos clicáveis/interativos
  const hoverElements = document.querySelectorAll("a, button, .tab-btn, .faq-question, .product-card, .magnet-target");
  hoverElements.forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}

/* ==========================================================================
   3. BOTÕES MAGNÉTICOS (FÍSICA DE ATRAÇÃO DO CURSOR)
   ========================================================================== */
function initMagneticEffect() {
  const magnets = document.querySelectorAll(".magnet-target");
  
  magnets.forEach(magnet => {
    magnet.addEventListener("mousemove", (e) => {
      const rect = magnet.getBoundingClientRect();
      // Posição relativa do mouse ao centro do elemento
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Move o botão ligeiramente na direção do mouse
      gsap.to(magnet, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    
    magnet.addEventListener("mouseleave", () => {
      // Retorna o botão à posição inicial com efeito elástico premium
      gsap.to(magnet, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    });
  });
}

/* ==========================================================================
   4. HERO PARALLAX & ROTATION DEPTH (EFEITO 3D DO MOUSE)
   ========================================================================== */
function initHeroParallax() {
  const hero = document.getElementById("hero");
  const parallaxBg = document.getElementById("hero-parallax-bg");
  const floatingCards = document.querySelectorAll(".floating-glass-card");
  
  if (!hero) return;

  hero.addEventListener("mousemove", (e) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Fatores de movimento entre -1 e 1 baseados no centro da tela
    const moveX = (e.clientX - width / 2) / (width / 2);
    const moveY = (e.clientY - height / 2) / (height / 2);

    // Movimento suave da imagem de fundo
    if (parallaxBg) {
      gsap.to(parallaxBg, {
        x: moveX * 20,
        y: moveY * 20,
        duration: 0.8,
        ease: "power2.out"
      });
    }

    // Rotação tridimensional e deslocamento dos cards flutuantes
    floatingCards.forEach((card, idx) => {
      const factor = (idx + 1) * 15;
      gsap.to(card, {
        x: moveX * factor,
        y: moveY * factor,
        rotationY: moveX * 12,
        rotationX: -moveY * 12,
        transformPerspective: 700,
        duration: 0.6,
        ease: "power1.out"
      });
    });
  });
}

/* ==========================================================================
   5. RASTREAMENTO DE LUZ (SPOTLIGHT / LANTERNA)
   ========================================================================== */
function initSpotlightEffect() {
  const spotlightTargets = document.querySelectorAll(".product-card, .form-card");
  
  spotlightTargets.forEach(target => {
    target.addEventListener("mousemove", (e) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Repassa coordenadas X/Y como variáveis CSS
      target.style.setProperty("--mouse-x", `${x}px`);
      target.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

/* ==========================================================================
   6. ANIMAÇÕES DE REVELAÇÃO DO GSAP (REVEAL ON SCROLL)
   ========================================================================== */
function initGSAPReveal() {
  // Configurações iniciais do GSAP
  gsap.registerPlugin(ScrollTrigger);

  // Animação de entrada do Hero (Carregamento da página)
  const heroTL = gsap.timeline();
  
  heroTL.from(".hero-subtitle", {
    opacity: 0,
    y: -20,
    duration: 0.8,
    ease: "power4.out"
  })
  .from(".hero-headline", {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: "power4.out"
  }, "-=0.6")
  .from(".hero-description", {
    opacity: 0,
    y: 20,
    duration: 1,
    ease: "power4.out"
  }, "-=0.7")
  .from(".hero-actions", {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: "power4.out"
  }, "-=0.8")
  .from(".hero-badges", {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: "power4.out"
  }, "-=0.8")
  .from(".floating-glass-card", {
    opacity: 0,
    scale: 0.8,
    stagger: 0.2,
    duration: 1,
    ease: "back.out(1.7)"
  }, "-=0.6");

  // Animação do Stats Bar (Stagger)
  gsap.from(".stats-bar .stat-item", {
    scrollTrigger: {
      trigger: ".stats-bar",
      start: "top 85%"
    },
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 0.8,
    ease: "power3.out"
  });

  // Animação das seções de produtos (Catálogo Editorial)
  gsap.from(".products-grid .product-card", {
    scrollTrigger: {
      trigger: ".products-grid",
      start: "top 85%"
    },
    opacity: 0,
    y: 40,
    stagger: 0.2,
    duration: 1,
    ease: "power4.out"
  });

  // Animação do Diferenciais (Cards de Benefício)
  gsap.from(".why-us-grid .why-card", {
    scrollTrigger: {
      trigger: ".why-us-grid",
      start: "top 90%",
      toggleActions: "play none none none",
      once: true
    },
    opacity: 0,
    y: 35,
    stagger: 0.15,
    duration: 0.8,
    ease: "power3.out",
    clearProps: "opacity,transform"
  });

  // Animação de Formulário de Contato e Info
  gsap.from(".contact-info > *", {
    scrollTrigger: {
      trigger: ".contact-section",
      start: "top 80%"
    },
    opacity: 0,
    x: -30,
    stagger: 0.15,
    duration: 0.8,
    ease: "power3.out"
  });

  gsap.from(".form-card", {
    scrollTrigger: {
      trigger: ".contact-section",
      start: "top 80%"
    },
    opacity: 0,
    x: 30,
    duration: 1,
    ease: "power3.out"
  });
}

/* ==========================================================================
   7. LÓGICAS DE CONTROLE E RESPONSIVIDADE NATIVAS (REFINADAS)
   ========================================================================== */

// Efeito de blur/sombra no header ao rolar a página
function initHeaderScroll() {
  const header = document.getElementById("main-header");
  if (!header) return;

  const checkScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  checkScroll();
  window.addEventListener("scroll", checkScroll);
}

// Menu Mobile e Drawer
function initMobileMenu() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const navLinks = document.getElementById("navigation-menu");
  const links = document.querySelectorAll("#navigation-menu a");

  if (!menuToggle || !navLinks) return;

  const toggleMenu = () => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    
    if (navLinks.classList.contains("active")) {
      // Animação de entrada dos links com GSAP no Mobile
      gsap.fromTo(links, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power2.out", delay: 0.1 }
      );
    }
  };

  const closeMenu = () => {
    menuToggle.classList.remove("active");
    navLinks.classList.remove("active");
  };

  menuToggle.addEventListener("click", toggleMenu);

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      closeMenu();
      
      // Suporta scroll suave manual se o Lenis for interrompido
      const targetId = link.getAttribute("href");
      if (targetId.startsWith("#")) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement && lenisInstance) {
          lenisInstance.scrollTo(targetElement);
        }
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      closeMenu();
    }
  });
}

// Máscara dinâmica de telefone no WhatsApp Input
function initPhoneMask() {
  const phoneInput = document.getElementById("phone");
  if (!phoneInput) return;

  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length > 10) {
      e.target.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    } else if (value.length > 6) {
      e.target.value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
    } else if (value.length > 2) {
      e.target.value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else if (value.length > 0) {
      e.target.value = `(${value}`;
    } else {
      e.target.value = "";
    }
  });
}

// Validador de Orçamento e Redirecionador para WhatsApp
function initFormSubmit() {
  const form = document.getElementById("whatsapp-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const productSelect = document.getElementById("product");
    const areaInput = document.getElementById("area");
    const messageInput = document.getElementById("message");

    let isValid = true;
    const inputs = [nameInput, phoneInput, productSelect, areaInput];
    
    inputs.forEach(input => {
      input.classList.remove("error");
      input.style.borderColor = "";
      input.style.boxShadow = "";
    });

    if (nameInput.value.trim().length < 3) {
      nameInput.classList.add("error");
      highlightError(nameInput);
      isValid = false;
    }

    const rawPhone = phoneInput.value.replace(/\D/g, "");
    if (rawPhone.length < 10) {
      phoneInput.classList.add("error");
      highlightError(phoneInput);
      isValid = false;
    }

    if (productSelect.value === "") {
      productSelect.classList.add("error");
      highlightError(productSelect);
      isValid = false;
    }

    if (areaInput.value.trim() === "" || parseFloat(areaInput.value) <= 0) {
      areaInput.classList.add("error");
      highlightError(areaInput);
      isValid = false;
    }

    if (!isValid) {
      alert("Por favor, preencha todos os campos obrigatórios marcados em vermelho corretamente.");
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const product = productSelect.options[productSelect.selectedIndex].text;
    const area = areaInput.value.trim();
    const customMessage = messageInput.value.trim();

    let messageText = `Olá! Gostaria de um orçamento para meu projeto.\n\n`;
    messageText += `*DADOS DO ORÇAMENTO*:\n`;
    messageText += `👤 *Nome:* ${name}\n`;
    messageText += `📞 *WhatsApp:* ${phone}\n`;
    messageText += `📐 *Área Estimada:* ${area} m²\n`;
    messageText += `📦 *Produto de Interesse:* ${product}\n`;
    
    if (customMessage) {
      messageText += `\n💬 *Mensagem/Detalhes:* ${customMessage}\n`;
    }
    
    messageText += `\nEnviado através do site da ${WHATSAPP_CONFIG.companyName}.`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_CONFIG.recipientNumber}&text=${encodedMessage}`;
    
    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Redirecionando... 🚀";
    submitBtn.style.backgroundColor = "#68A53E";
    submitBtn.style.color = "#FFFFFF";
    submitBtn.disabled = true;

    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
      
      submitBtn.innerHTML = originalText;
      submitBtn.style.backgroundColor = "";
      submitBtn.style.color = "";
      submitBtn.disabled = false;
      
      form.reset();
    }, 1000);
  });
}

function highlightError(inputElement) {
  inputElement.style.borderColor = "#EF4444";
  inputElement.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.15)";
  
  inputElement.addEventListener("focus", function resetStyle() {
    inputElement.style.borderColor = "";
    inputElement.style.boxShadow = "";
    inputElement.removeEventListener("focus", resetStyle);
  });
}

// FAQ Accordion (Acordeão suave)
function initFAQAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const questionButton = item.querySelector(".faq-question");
    
    questionButton.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      faqItems.forEach(otherItem => {
        otherItem.classList.remove("active");
      });

      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

// ScrollSpy (Destaque dinâmico dos links ativos do menu)
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id], hero[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let currentSectionId = "";
    const scrollPosition = window.scrollY + 180;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSectionId = section.getAttribute("id");
      }
    });

    if (currentSectionId) {
      const hasMatchingLink = Array.from(navLinks).some(link => link.getAttribute("href") === `#${currentSectionId}`);
      if (hasMatchingLink) {
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active");
          }
        });
      }
    }
  });
}

// Filtragem de Produtos por Categorias
function initProductFilters() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const productCards = document.querySelectorAll(".product-card");

  if (tabButtons.length === 0) return;

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const tabValue = button.getAttribute("data-tab");

      productCards.forEach(card => {
        const categories = card.getAttribute("data-categories").split(" ");
        if (tabValue === "todas" || categories.includes(tabValue)) {
          card.style.display = "flex";
          // Use requestAnimationFrame to batch opacity/scale reflows efficiently
          requestAnimationFrame(() => {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          });
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          // Set display: none after fade-out transition
          setTimeout(() => {
            if (card.style.opacity === "0") {
              card.style.display = "none";
            }
          }, 200);
        }
      });
      
      // Refresh ScrollTrigger once after a single deferred timeout
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    });
  });
}

// Carrossel interno dos cards de produtos
function initProductSliders() {
  const sliders = document.querySelectorAll(".slider-container");
  
  sliders.forEach(slider => {
    const images = slider.querySelectorAll(".slider-slides img");
    const prevBtn = slider.querySelector(".prev-btn");
    const nextBtn = slider.querySelector(".next-btn");
    
    if (images.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      return;
    }
    
    images[0].classList.add("active");
    
    let currentIndex = 0;
    
    const showImage = (index) => {
      images.forEach((img, i) => {
        if (i === index) {
          img.classList.add("active");
        } else {
          img.classList.remove("active");
        }
      });
    };
    
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    });
    
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    });
  });
}

// Menu Dropdown de Filtro no Mobile (Topo Direito)
function initMobileFilterDropdown() {
  const triggerBtn = document.getElementById("mobile-filter-btn");
  const filterMenu = document.getElementById("mobile-filter-menu");
  const dropdownItems = document.querySelectorAll(".mobile-filter-item");
  const desktopTabs = document.querySelectorAll(".product-tabs .tab-btn");

  if (!triggerBtn || !filterMenu) return;

  // Abre/fecha o menu dropdown
  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = filterMenu.classList.toggle("open");
    triggerBtn.setAttribute("aria-expanded", isOpen);
  });

  // Fecha o menu quando clica fora dele
  document.addEventListener("click", () => {
    filterMenu.classList.remove("open");
    triggerBtn.setAttribute("aria-expanded", "false");
  });

  // Vincula a seleção do menu móvel ao clique das abas de desktop ocultas
  dropdownItems.forEach(item => {
    item.addEventListener("click", () => {
      const val = item.getAttribute("data-value");
      
      dropdownItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Atualiza o texto do botão com o filtro selecionado
      const selectedText = item.textContent;
      triggerBtn.querySelector("span").textContent = `Filtrar: ${selectedText}`;

      // Simula o clique na aba oculta correspondente
      desktopTabs.forEach(tab => {
        if (tab.getAttribute("data-tab") === val) {
          tab.click();
        }
      });

      filterMenu.classList.remove("open");
      triggerBtn.setAttribute("aria-expanded", "false");
    });
  });
}

