/* ============================================================
   交互：滚动渐入 / 导航状态 / 评价轮播 / 移动端菜单
   ============================================================ */

// ---------- 滚动渐入 ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- 导航：滚动背景 + 首屏浅色模式 ----------
const nav = document.getElementById("nav");
const hero = document.querySelector(".hero");

function syncNav() {
  const scrolled = window.scrollY > 40;
  nav.classList.toggle("scrolled", scrolled);
  // 首屏未滚动时使用浅色文字
  const heroBottom = hero.offsetTop + hero.offsetHeight;
  nav.classList.toggle("on-hero", !scrolled && window.scrollY < heroBottom - 80);
}
syncNav();
window.addEventListener("scroll", syncNav, { passive: true });

// ---------- 移动端菜单 ----------
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => nav.classList.toggle("menu-open"));
document.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("menu-open"))
);

// ---------- 时间线：可拖拽轨道 + 聚焦 ----------
(function initTimeline() {
  const rail = document.getElementById("timeline");
  if (!rail) return;
  const wrap = rail.closest(".timeline-wrap");
  const nodes = Array.from(rail.querySelectorAll(".tl-node"));

  let raf = 0;

  function paint() {
    raf = 0;
    const max = rail.scrollWidth - rail.clientWidth;
    const x = rail.scrollLeft;

    // 两侧渐隐
    wrap.classList.toggle("can-left", x > 6);
    wrap.classList.toggle("can-right", x < max - 6);

    // 离轨道中心最近的节点高亮
    const center = x + rail.clientWidth / 2;
    let best = null, bestDist = Infinity;
    nodes.forEach((n) => {
      const c = n.offsetLeft + n.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = n; }
    });
    nodes.forEach((n) => n.classList.toggle("is-focus", n === best));
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(paint);
  }

  rail.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  // 鼠标拖拽（触控板/手机原生滑动交由浏览器）
  let down = false, startX = 0, startLeft = 0, moved = 0;

  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = true; moved = 0;
    startX = e.clientX;
    startLeft = rail.scrollLeft;
    rail.classList.add("dragging");
    rail.setPointerCapture(e.pointerId);
  });

  rail.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    rail.scrollLeft = startLeft - dx;
    e.preventDefault();
  });

  function endDrag() {
    if (!down) return;
    down = false;
    rail.classList.remove("dragging");
    // 松手后吸附到最近的节点
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best = null, bestDist = Infinity;
    nodes.forEach((n) => {
      const c = n.offsetLeft + n.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = n; }
    });
    if (best && moved > 6) {
      const target = best.offsetLeft + best.offsetWidth / 2 - rail.clientWidth / 2;
      rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }

  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);
  rail.addEventListener("pointerleave", endDrag);

  // 键盘左右键
  rail.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = nodes.findIndex((n) => n.classList.contains("is-focus"));
    const next = Math.max(0, Math.min(nodes.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)));
    const target = nodes[next].offsetLeft + nodes[next].offsetWidth / 2 - rail.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  });

  paint();
})();

// ---------- 评价轮播 ----------
const quotes = [
  {
    text: "保持好奇，持续创作，不断成为更好的自己。",
    name: "第一条",
    role: "写给自己，2026",
    avatar: "J",
  },
  {
    text: "留白——留给下一个值得写下来的念头。",
    name: "第二条",
    role: "待补充",
    avatar: "J",
  },
  {
    text: "还有一条，等它发生。",
    name: "第三条",
    role: "预留",
    avatar: "J",
  },
];

const quoteCard = document.getElementById("quoteCard");
const quoteText = document.getElementById("quoteText");
const quoteName = document.getElementById("quoteName");
const quoteRole = document.getElementById("quoteRole");
const quoteAvatar = document.getElementById("quoteAvatar");
const dotsWrap = document.getElementById("quoteDots");
let current = 0;
let timer = null;

quotes.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.className = "q-dot" + (i === 0 ? " active" : "");
  dot.setAttribute("aria-label", "第 " + (i + 1) + " 条评价");
  dot.addEventListener("click", () => goTo(i));
  dotsWrap.appendChild(dot);
});
const dots = dotsWrap.querySelectorAll(".q-dot");

function render(i) {
  const q = quotes[i];
  quoteText.textContent = q.text;
  quoteName.textContent = q.name;
  quoteRole.textContent = q.role;
  quoteAvatar.textContent = q.avatar;
  dots.forEach((d, j) => d.classList.toggle("active", j === i));
}

function goTo(i) {
  current = (i + quotes.length) % quotes.length;
  quoteCard.classList.add("fading");
  setTimeout(() => {
    render(current);
    quoteCard.classList.remove("fading");
  }, 380);
  restart();
}

function restart() {
  clearInterval(timer);
  timer = setInterval(() => goTo(current + 1), 7000);
}

document.getElementById("prevQuote").addEventListener("click", () => goTo(current - 1));
document.getElementById("nextQuote").addEventListener("click", () => goTo(current + 1));
restart();

// ---------- 项目弹窗 ----------
(function initModal() {
  const modal = document.getElementById("devModal");
  const trigger = document.getElementById("devRow");
  if (!modal || !trigger) return;

  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => modal.classList.add("open"));
    modal.querySelector(".modal-close").focus();
  }

  function close() {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      modal.hidden = true;
      if (lastFocus) lastFocus.focus();
    }, 380);
  }

  trigger.addEventListener("click", open);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });

  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();

// ---------- 作品集涂鸦：按时间切换昼夜（18 点后 / 6 点前为夜晚） ----------
(function initArtSky() {
  const art = document.querySelector(".services-art");
  if (!art) return;
  const h = new Date().getHours();
  if (h >= 18 || h < 6) art.classList.add("night");
})();

// ---------- 兴趣卡翻面 ----------
document.querySelectorAll("[data-flip]").forEach((card) => {
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.classList.toggle("flipped");
    }
  });
});
