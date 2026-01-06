// ===== Helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

// ===== Toast
function toast(title, msg) {
  const el = $("#toast");
  $("#toastTitle").textContent = title;
  $("#toastMsg").textContent = msg;
  el.hidden = false;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.hidden = true), 220);
  }, 2400);
}

// ===== Theme
const THEME_KEY = "kalshi_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("#themeLabel").textContent = theme === "light" ? "Claro" : "Escuro";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
    return;
  }
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark");
}

$("#themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ===== Mobile menu
const burger = $("#burger");
const mobileMenu = $("#mobileMenu");

burger.addEventListener("click", () => {
  const expanded = burger.getAttribute("aria-expanded") === "true";
  burger.setAttribute("aria-expanded", String(!expanded));
  mobileMenu.hidden = expanded;
});

$$(".mobile__link").forEach(a => {
  a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  }
});

// ===== Scroll progress
const fill = $("#scrollbarFill");
window.addEventListener("scroll", () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  fill.style.width = `${pct}%`;
});

// ===== Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

$$(".reveal").forEach(el => io.observe(el));

// ===== Market mock
const MARKET_DATA = [
  { tag: "Economia", q: "A inflação anual ficará acima de 3,0%?", p: 0.62 },
  { tag: "Esportes", q: "O Time A vence o próximo jogo?", p: 0.54 },
  { tag: "Clima", q: "Vai chover amanhã na cidade X?", p: 0.41 },
  { tag: "Política", q: "Um projeto será aprovado até o fim do mês?", p: 0.33 },
  { tag: "Tech", q: "Uma big tech lançará um produto novo este trimestre?", p: 0.48 },
  { tag: "Economia", q: "A taxa de juros cairá na próxima reunião?", p: 0.57 }
];

// ===== Auth modal
let authModal, closeAuth;

function goToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Abre o modal SOMENTE quando o usuário clicar em YES/NO.
 */
function requireAuth() {
  if (!authModal) return;
  authModal.hidden = false;
}

/**
 * CANCELAR:
 * - fecha o modal
 * - volta para a página principal (topo)
 * - limpa qualquer hash (#login / #_toggle_signup etc.)
 */
function closeAuthModalAndBackToTop() {
  if (authModal) authModal.hidden = true;

  // volta pro topo e "pagina principal"
  goToTop();

  // garante que a URL não fique presa em #login, #_toggle_signup etc.
  // (isso evita que pareça que não voltou pro início)
  try {
    history.replaceState(null, "", "#top");
  } catch (e) {
    // fallback bem simples
    location.hash = "top";
  }
}

// ===== Render markets
function renderMarkets(list) {
  const wrap = $("#markets");
  wrap.innerHTML = "";

  list.slice(0, 5).forEach((m) => {
    const pct = Math.round(clamp(m.p, 0.01, 0.99) * 100);
    const el = document.createElement("div");
    el.className = "market";
    el.tabIndex = 0;

    el.innerHTML = `
      <div class="market__top">
        <div class="market__q">${m.q}</div>
        <div class="market__tag">${m.tag}</div>
      </div>
      <div class="market__bar"><span style="width:${pct}%"></span></div>
      <div class="market__actions">
        <div class="odds">${pct}% Yes • ${100 - pct}% No</div>
        <div class="pair">
          <button type="button">Yes</button>
          <button type="button">No</button>
        </div>
      </div>
    `;

    wrap.appendChild(el);
  });

  // ✅ AQUI É A REGRA DE OURO:
  // Login só é pedido quando clicar em YES/NO (negociar)
  $$(".pair button", wrap).forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      requireAuth();
    });
  });
}

// ===== Shuffle
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

$("#shuffleBtn").addEventListener("click", () => {
  renderMarkets(shuffle(MARKET_DATA));
  toast("Atualizado", "Mercados misturados.");
});

// ===== Waitlist
$("#waitlistForm").addEventListener("submit", ev => {
  ev.preventDefault();
  const name = $("#name").value.trim();
  const email = $("#email").value.trim();

  if (!name || !email) {
    toast("Ops", "Preencha nome e e-mail.");
    return;
  }

  toast("Boa!", `Você entrou na lista, ${name}. (demo)`);
  ev.target.reset();
});

// ===== Init
document.addEventListener("DOMContentLoaded", () => {
  authModal = document.getElementById("authModal");
  closeAuth = document.getElementById("closeAuth");

  // ✅ CANCELAR: fecha modal e volta pra página principal SEMPRE
  if (closeAuth) {
    closeAuth.addEventListener("click", (ev) => {
      ev.preventDefault();
      closeAuthModalAndBackToTop();
    });
  }

  // (opcional, mas bom) clicou fora do card = CANCELAR
  if (authModal) {
    authModal.addEventListener("click", (ev) => {
      if (ev.target === authModal) closeAuthModalAndBackToTop();
    });
  }

  // (opcional, mas bom) ESC = CANCELAR
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && authModal && !authModal.hidden) {
      closeAuthModalAndBackToTop();
    }
  });

  initTheme();
  renderMarkets(MARKET_DATA);

  // splash (mantido)
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.style.display = "none", 2000);
  }

  // PWA (mantido)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  $("#year").textContent = new Date().getFullYear();
});
