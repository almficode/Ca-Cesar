/* ═══════════════════════════════════════════════
   CA'CESAR · Motor de interacción
   Hero tipo vídeo (scrub), preloader %, springs,
   entradas laterales, cortinillas, línea del método,
   marquesinas de reseñas y Cesarino flotante.
   Vanilla JS, sin dependencias.
   ═══════════════════════════════════════════════ */

(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // la secuencia del hero debe empezar siempre desde arriba
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  /* ── 1. Preloader: contador 00% → 100% sobre negro ──── */
  const loader = $("#loader");
  const loaderCount = $("#loaderCount");
  const finishLoad = () => {
    loader.classList.add("is-done");
    document.body.classList.add("is-loaded");
    setTimeout(() => loader.remove(), 800);
  };
  if (reducedMotion) {
    finishLoad();
  } else {
    let p = 0;
    const tick = () => {
      p = Math.min(p + Math.random() * 7 + 2, 100);
      loaderCount.textContent = String(Math.floor(p)).padStart(2, "0") + "%";
      if (p < 100) setTimeout(tick, 55);
      else setTimeout(finishLoad, 350);
    };
    tick();
  }

  /* ── 2. Entradas laterales: asignar lados alternos ────── */
  $$(".work").forEach((w, i) => {
    const media = $(".work__media", w);
    const info = $(".work__info", w);
    media.setAttribute("data-reveal", "");
    media.setAttribute("data-side", i % 2 ? "right" : "left");
    info.setAttribute("data-reveal", "");
    info.setAttribute("data-side", i % 2 ? "left" : "right");
    info.style.transitionDelay = "0.1s";
  });
  $$(".faq__item").forEach(r => r.setAttribute("data-side", "left"));
  $$(".method__step").forEach((s, i) => {
    s.style.transitionDelay = `${i * 0.12}s`;
  });

  /* ── 3. Títulos de sección: letras que suben una a una ─ */
  $$("[data-reveal-letters]").forEach(el => {
    const wrapLetters = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...child.textContent].forEach(ch => {
            const s = document.createElement("span");
            s.className = "L";
            s.textContent = ch === " " ? " " : ch;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) wrapLetters(child);
      });
    };
    wrapLetters(el);
    $$(".L", el).forEach((l, i) => l.style.setProperty("--i", i));
  });

  /* ── 4. Texto rellenable: dividir en palabras ─────────── */
  $$("[data-fill]").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
  });

  /* ── 5. Observers de aparición ────────────────────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal], [data-reveal-letters], [data-clip]").forEach(el => io.observe(el));

  /* ── 6. Hero: vídeo del horno + transición iris ──────────
     El vídeo se reproduce en bucle; al hacer scroll, un iris
     circular de cine se cierra sobre él descubriendo la capa
     "Benvenuti", con timecode REC real del metraje. */
  const hero = $("#hero");
  const heroVidwrap = $("#heroVidwrap");
  const heroVideo = $("#heroVideo");
  const heroContent = $(".hero__content");
  const heroAfterScript = $("#heroAfterScript");
  const heroAfterSub = $("#heroAfterSub");
  const heroTC = $("#heroTC");
  const heroBars = $$(".hero__bar");
  const heroHud = $(".hero__hud");
  const heroScrollHint = $(".hero__scroll");
  const nav = $("#nav");
  const menu = $("#menu");
  let irisX = 50, irisY = 50; // el centro del iris sigue al ratón

  const updateHero = () => {
    if (!hero) return;
    const total = hero.offsetHeight - innerHeight;
    const p = clamp(scrollY / Math.max(total, 1), 0, 1);

    // fase A (0 → 0.4): el vídeo manda; el título se va desvaneciendo
    if (heroContent && !reducedMotion) {
      const fade = clamp((p - 0.1) / 0.22, 0, 1);
      heroContent.style.opacity = (1 - fade).toFixed(3);
      heroContent.style.transform = `translateY(${(-46 * fade).toFixed(1)}px)`;
      heroContent.style.pointerEvents = fade > 0.6 ? "none" : "";
    }

    // fase B (0.4 → 1): el iris se cierra sobre el vídeo
    const phase = clamp((p - 0.4) / 0.55, 0, 1);
    if (heroVidwrap && !reducedMotion) {
      const ease = 1 - Math.pow(1 - phase, 2.2); // salida acelerada
      const radius = (1 - ease) * 141;
      heroVidwrap.style.clipPath =
        `circle(${radius.toFixed(2)}% at ${irisX.toFixed(1)}% ${irisY.toFixed(1)}%)`;
      heroVideo.style.transform =
        `scale(${(1.05 + ease * 0.22).toFixed(4)}) rotate(${(ease * -3).toFixed(2)}deg)`;
    }

    // la capa "Benvenuti" entra a la vez que el iris se cierra
    if (heroAfterScript) {
      const oa = clamp((phase - 0.18) / 0.4, 0, 1);
      heroAfterScript.style.opacity = oa.toFixed(3);
      heroAfterScript.style.transform =
        `scale(${(0.8 + oa * 0.2).toFixed(3)}) rotate(${((1 - oa) * -4).toFixed(2)}deg)`;
      heroAfterSub.style.opacity = clamp((phase - 0.5) / 0.3, 0, 1).toFixed(3);
      heroAfterSub.style.transform = `translateY(${((1 - phase) * 20).toFixed(1)}px)`;
    }

    // el letterbox, el HUD y el hint se retiran durante la transición
    const uiFade = (1 - clamp(phase / 0.5, 0, 1)).toFixed(3);
    heroBars.forEach(b => b.style.opacity = uiFade);
    if (heroHud) heroHud.style.opacity = uiFade;
    if (heroScrollHint) heroScrollHint.style.opacity = uiFade;

    // nav en claro solo mientras manda el vídeo oscuro
    nav.classList.toggle("nav--light",
      p < 0.52 && !menu.classList.contains("is-open"));
  };

  // arranque resistente del vídeo: algunos navegadores bloquean el
  // autoplay hasta la primera interacción — se reintenta entonces
  if (heroVideo && !reducedMotion) {
    const kickVideo = () => { if (heroVideo.paused) heroVideo.play().catch(() => {}); };
    kickVideo();
    addEventListener("scroll", kickVideo, { once: true, passive: true });
    addEventListener("pointerdown", kickVideo, { once: true });
  }

  // timecode REC con el tiempo real del metraje
  // (si el navegador retiene el vídeo, corre con reloj propio)
  if (heroVideo && heroTC && !reducedMotion) {
    const t0 = performance.now();
    setInterval(() => {
      const t = heroVideo.currentTime > 0.2
        ? heroVideo.currentTime
        : ((performance.now() - t0) / 1000) % 60;
      const mm = String(Math.floor(t / 60)).padStart(2, "0");
      const ss = String(Math.floor(t) % 60).padStart(2, "0");
      const ff = String(Math.floor((t * 24) % 24)).padStart(2, "0");
      heroTC.textContent = `00:${mm}:${ss}:${ff}`;
    }, 90);
  }

  // el centro del iris y el vídeo siguen suavemente al ratón
  if (heroVidwrap && matchMedia("(hover: hover)").matches && !reducedMotion) {
    let tx = 50, ty = 50, rafOn = false;
    const lerpLoop = () => {
      irisX += (tx - irisX) * 0.05;
      irisY += (ty - irisY) * 0.05;
      updateHero();
      if (Math.abs(tx - irisX) > 0.05 || Math.abs(ty - irisY) > 0.05) requestAnimationFrame(lerpLoop);
      else rafOn = false;
    };
    $(".hero__sticky").addEventListener("mousemove", e => {
      tx = 50 + (e.clientX / innerWidth - 0.5) * 10;
      ty = 50 + (e.clientY / innerHeight - 0.5) * 8;
      if (!rafOn) { rafOn = true; requestAnimationFrame(lerpLoop); }
    });
  }

  /* ── 7. Bucle de scroll ───────────────────────────────── */
  const fillEls = $$("[data-fill]");
  const workImgs = $$(".work__media img");
  const parallaxEls = $$("[data-parallax]");
  const methodFlow = $(".method__flow");
  const methodLine = $("#methodLine");
  const progress = $("#progress");

  const onScroll = () => {
    const y = scrollY;

    if (progress) {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${(y / Math.max(h, 1)) * 100}%`;
    }

    if (!reducedMotion) updateHero();

    // texto que pasa de gris claro a tinta
    fillEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      const start = innerHeight * 0.85;
      const end = innerHeight * 0.35;
      const pw = clamp((start - r.top) / (start - end), 0, 1);
      const words = el.children;
      const n = Math.round(pw * words.length);
      for (let i = 0; i < words.length; i++) {
        words[i].classList.toggle("on", i < n);
      }
    });

    if (!reducedMotion) {
      // parallax en las fotos de Le Pizze
      workImgs.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const offset = ((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -5;
        img.style.setProperty("--py", `${offset.toFixed(2)}%`);
      });

      // parallax genérico (teaser de La Storia)
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const off = ((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -100 * parseFloat(el.dataset.parallax);
        const img = el.querySelector("img");
        if (img) img.style.translate = `0 ${off.toFixed(1)}px`;
      });

      // la línea del método se dibuja al recorrer la sección
      if (methodFlow && methodLine) {
        const r = methodFlow.getBoundingClientRect();
        const pl = clamp((innerHeight * 0.85 - r.top) / (innerHeight * 0.55), 0, 1);
        methodLine.style.width = `${(pl * 100).toFixed(1)}%`;
      }
    }
  };

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ── 8. Menú overlay ──────────────────────────────────── */
  const burger = $("#navBurger");
  const toggleMenu = open => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) nav.classList.remove("nav--light");
    else updateHero();
    $$(".menu__links a").forEach((a, i) =>
      a.style.transitionDelay = open ? `${0.25 + i * 0.06}s` : "0s");
  };
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));
  $$(".menu a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));

  /* ── 9. La Carta: grupos numerados plegables ──────────── */
  const list = $("#cartaList");
  if (list && window.CACESAR_MENU) {
    const cats = [
      ["pizzas", "PIZZAS"], ["entrantes", "ENTRANTES"], ["pastas", "PASTAS"],
      ["carnes", "CARNES"], ["postres", "POSTRES"], ["bebidas", "BEBIDAS"],
    ];
    list.innerHTML = cats.map(([key, label], i) => `
      <div class="svc-group" data-reveal data-side="${i % 2 ? "right" : "left"}">
        <button type="button" class="svc-group__head" aria-expanded="false">
          <span class="svc-group__num">00${i + 1}</span>
          <span class="svc-group__name">${label}</span>
          <span class="svc-group__toggle">+</span>
        </button>
        <div class="svc-group__items">
          ${window.CACESAR_MENU[key].map(it => `
            <div class="svc-item">
              <span class="svc-item__name">${it.name.toUpperCase()}</span>
              <span class="svc-item__desc">${it.desc.toUpperCase()}</span>
              <span class="svc-item__price">${it.price}€</span>
            </div>`).join("")}
        </div>
      </div>`).join("");

    $$(".svc-group", list).forEach(g => io.observe(g));
    $$(".svc-group__head", list).forEach(head => {
      head.addEventListener("click", () => {
        const group = head.parentElement;
        const items = group.querySelector(".svc-group__items");
        const open = group.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open);
        items.style.maxHeight = open ? items.scrollHeight + "px" : "0px";
      });
    });
    const first = $(".svc-group__head", list);
    if (first) first.click();
  }

  /* ── 10. Pistas duplicadas para bucle infinito (reseñas +
     cinta de fotogramas de La Storia) ────────────────────── */
  $$(".reviews__track, .filmstrip__track").forEach(track => {
    track.innerHTML += track.innerHTML;
  });

  /* ── 11. Cesarino: botón flotante + overlay ───────────── */
  const fab = $("#chatOpen");
  const cesarino = $("#cesarino");
  const chatClose = $("#chatClose");
  const chatInput = $("#chatInput");
  const chatForm = $("#chatForm");
  const toggleCesarino = open => {
    cesarino.classList.toggle("is-open", open);
    cesarino.setAttribute("aria-hidden", !open);
    fab.classList.toggle("is-hidden", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) setTimeout(() => chatInput.focus(), 500);
  };
  fab.addEventListener("click", () => toggleCesarino(true));
  $("#aiOpen")?.addEventListener("click", () => toggleCesarino(true));
  chatClose.addEventListener("click", () => toggleCesarino(false));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && cesarino.classList.contains("is-open")) toggleCesarino(false);
  });
  // los mensajes ocultan la intro gigante
  new MutationObserver(() => {
    cesarino.classList.toggle("has-msgs", $("#chatMessages").children.length > 0);
  }).observe($("#chatMessages"), { childList: true });
  // sugerencias de un toque
  $$("#cesarinoChips button").forEach(chip => {
    chip.addEventListener("click", () => {
      chatInput.value = chip.textContent.trim();
      chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
    });
  });

  /* ── 12. Reloj local + estado abierto/cerrado ─────────── */
  const clockEls = [$("#heroClock"), $("#footClock")].filter(Boolean);
  const statusEl = $("#heroStatus");
  const updateClock = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Atlantic/Canary" }));
    const hhmm = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    clockEls.forEach(el => el.textContent = hhmm);
    if (!statusEl) return;
    const day = now.getDay(); // 3 = miércoles
    const mins = now.getHours() * 60 + now.getMinutes();
    const isFriSat = day === 5 || day === 6;
    const lunch = mins >= 750 && mins < 960;
    const dinner = mins >= 1140 && mins < (isFriSat ? 1410 : 1380);
    const open = day !== 3 && (lunch || dinner);
    statusEl.textContent = open ? "[ABIERTO AHORA]"
      : day === 3 ? "[HOY CERRADO — MIÉRCOLES]" : "[CERRADO — ABRIMOS 12:30 / 19:00]";
  };
  updateClock();
  setInterval(updateClock, 30000);

  /* ── 13. Banner de cookies ────────────────────────────── */
  const banner = $("#cookiesBanner");
  let cookiePref = null;
  try { cookiePref = localStorage.getItem("cacesar_cookies"); } catch (_) {}
  if (!cookiePref && banner) banner.hidden = false;
  const setCookiePref = v => {
    try { localStorage.setItem("cacesar_cookies", v); } catch (_) {}
    banner.hidden = true;
  };
  $("#cookiesAccept")?.addEventListener("click", () => setCookiePref("accepted"));
  $("#cookiesReject")?.addEventListener("click", () => setCookiePref("rejected"));

  /* ── 14. Año del footer ───────────────────────────────── */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
