import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

(function initLpLenis() {
  // Verificação de suporte e prefers-reduced-motion
  const prefersQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReduced = prefersQuery ? prefersQuery.matches : false;

  if (prefersReduced) {
    return;
  }

  // Inicializa o Lenis com parametrização refinada para rolagem suave, moderna e orgânica
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva exponencial de desaceleração suave
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
    syncTouch: false, // Mantém resposta tátil nativa ágil a 120Hz em dispositivos móveis
    autoResize: true
  });

  // Expõe a instância para acessibilidade e controles externos
  window.lenis = lenis;

  // Ciclo fluido de requestAnimationFrame
  let rafId;
  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Escuta alteração dinâmica de preferência de movimento reduzido no SO
  if (prefersQuery && prefersQuery.addEventListener) {
    prefersQuery.addEventListener('change', (e) => {
      if (e.matches) {
        if (rafId) cancelAnimationFrame(rafId);
        lenis.destroy();
      }
    });
  }

  // Tratamento suave de âncoras internas com compensação do header sticky
  function bindAnchors() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach((anchor) => {
      if (anchor.dataset.lenisBound) return;
      anchor.dataset.lenisBound = 'true';

      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        try {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const isMobile = window.innerWidth <= 1239;
            const headerOffset = isMobile ? -118 : -72;
            lenis.scrollTo(target, {
              offset: headerOffset,
              duration: 1.15
            });
            if (window.history && window.history.pushState) {
              window.history.pushState(null, '', href);
            }
          }
        } catch (_) {
          // Permite fallback nativo para seletores especiais
        }
      });
    });
  }

  // Previne interferência em elementos com scroll próprio (menus com scroll horizontal, carrosséis, dropdowns)
  function protectScrollContainers() {
    const containers = document.querySelectorAll('header nav, [style*="overflow-x: auto"], [style*="overflow: auto"], [style*="overflow-y: auto"], dialog, [role="dialog"]');
    containers.forEach((el) => {
      if (!el.hasAttribute('data-lenis-prevent')) {
        el.setAttribute('data-lenis-prevent', '');
      }
    });
  }

  // Se a URL já contiver um hash (ex: /#planos), posiciona suavemente com offset correto
  function handleInitialHash() {
    if (window.location.hash) {
      setTimeout(() => {
        try {
          const target = document.querySelector(window.location.hash);
          if (target) {
            const isMobile = window.innerWidth <= 1239;
            const headerOffset = isMobile ? -118 : -72;
            lenis.scrollTo(target, {
              offset: headerOffset,
              immediate: true
            });
          }
        } catch (_) {
          // Se o hash não for um seletor válido no DOM, ignora com segurança
        }
      }, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindAnchors();
      protectScrollContainers();
      handleInitialHash();
    });
  } else {
    bindAnchors();
    protectScrollContainers();
    handleInitialHash();
  }

  // Atualiza medições de layout quando recursos assíncronos finalizarem carregamento
  window.addEventListener('load', () => {
    lenis.resize();
    protectScrollContainers();
  });

  // Limpeza de ciclo de vida
  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (lenis) lenis.destroy();
  });
})();
