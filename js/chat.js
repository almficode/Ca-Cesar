/* ═══════════════════════════════════════════════
   CA'CESAR · Asistente IA "Cesarino" (OpenAI)

   Listo para producción en Vercel: llama a /api/chat, una función
   serverless que guarda la API key de OpenAI en el servidor
   (variable de entorno OPENAI_API_KEY). El visitante nunca ve
   ni introduce ninguna key — solo tienes que configurarla una vez
   en Vercel (Project Settings → Environment Variables) y desplegar.

   El contexto que recibe el modelo se construye en directo a partir
   de la propia web (la carta real de js/menu-data.js, la historia y
   las reseñas que aparecen en la página) para que conteste siempre
   con datos reales y actualizados, nunca inventados.

   El botón [DEV] sigue existiendo como acceso opcional para pruebas
   locales: si se guarda ahí tu propia API key de OpenAI, el chat
   llama a OpenAI directamente desde el navegador en vez de pasar por
   /api/chat (útil para probar sin desplegar). En producción no hace
   falta usarlo.

   Si /api/chat no responde (por ejemplo, al previsualizar la web
   como archivos estáticos sin funciones serverless), el asistente
   degrada automáticamente a respuestas locales básicas para no
   dejar al visitante sin ayuda.

   Preparado para RAG: añadir documentos a CONFIG.ragDocs.
   ═══════════════════════════════════════════════ */

(() => {
  "use strict";

  const CONFIG = {
    apiKeyStorage: "cacesar_openai_key", // solo para el override manual de pruebas
    model: "gpt-4o-mini",
    maxTokens: 700,
    // RAG: añadir aquí contenido de PDFs, catálogos, FAQs, etc.
    // Cada entrada se inyecta como contexto adicional del negocio.
    ragDocs: [],
  };

  /* ── Carta real, en directo desde js/menu-data.js ─────────
     Así el asistente nunca contesta con platos o precios
     inventados o desactualizados: si editas la carta, el
     asistente se entera solo. */
  function buildMenuText() {
    const cats = [
      ["pizzas", "PIZZAS"],
      ["entrantes", "ENTRANTES"],
      ["pastas", "PASTAS"],
      ["carnes", "CARNES"],
      ["postres", "POSTRES"],
      ["bebidas", "BEBIDAS"],
    ];
    const menu = window.CACESAR_MENU || {};
    return cats
      .map(([key, label]) => {
        const items = menu[key] || [];
        if (!items.length) return "";
        const lines = items.map(it => `${it.name} — ${it.desc} (${it.price}€)`).join("; ");
        return `${label}: ${lines}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  /* ── Contexto del negocio: lo que hay en la web + lo que se
     sabe del negocio fuera de ella (reseñas reales, redes) ── */
  function buildBusinessContext() {
    const ragBlock = CONFIG.ragDocs.length
      ? "\n\nDOCUMENTACIÓN ADICIONAL:\n" + CONFIG.ragDocs.join("\n---\n")
      : "";

    return `
Eres "Cesarino", el asistente virtual de la Pizzería Ca'Cesar en San Bartolomé, Lanzarote.
Tu tono es cercano, amable y con algún toque italiano ocasional ("ciao", "perfetto"). Respondes SIEMPRE en el idioma del cliente (normalmente español). Respuestas breves y útiles. Contesta solo con la información de este contexto — si no lo sabes, dilo con honestidad y remite al teléfono, no inventes datos.

DATOS DEL NEGOCIO:
- Dirección: Calle Timbayba 5B, 35550 San Bartolomé, Lanzarote (Islas Canarias).
- Teléfono (reservas y pedidos para llevar): +34 928 52 02 76. Las reservas se hacen solo por teléfono, no hay formulario online.
- Horario: todos los días 12:30–16:00 y 19:00–23:00 (viernes y sábado hasta 23:30). MIÉRCOLES CERRADO.
- Cómo llegar: Google Maps → "Pizzeria Ca Cesar, Calle Timbayba 5B, San Bartolome, Lanzarote".
- Redes: Instagram @pizzeria_cacesar · reseñas en Tripadvisor (buscar "Pizzeria Ca Cesar San Bartolome").
- Especialidad: pizza artesanal con masa de fermentación lenta (hasta 48h), productos de primera calidad, elaboración al momento. Tiramisú casero famoso. Lasaña casera muy valorada.
- Ideal para: familias, parejas, grupos de amigos, comida para llevar.
- Valores: calidad, elaboración artesanal, trato cercano, buena relación calidad-precio.

LA HISTORIA DE LA CASA (para cuando pregunten quiénes son o cómo empezaron):
- El origen: empezó en un pequeño local en la calle Timbayba, con la idea de hacer pizza sin prisas, sin congelados y con respeto por el producto.
- El método: la fermentación lenta es la firma de la casa — la masa reposa hasta 48 horas y se estira a mano en el momento de pedirla. Cada mañana se amasa y se enciende el horno; cada pizza sale al horno solo cuando se pide, nunca antes, nunca recalentada.
- La casa llena: con los años llegaron las familias, las parejas y las cuadrillas de toda la isla. El tiramisú casero se hizo famoso y la lasaña es de las más pedidas.
- Hoy: siguen igual que el primer día — cocina sencilla y honesta, trato cercano, y el protagonista siempre es el sabor.

LA CARTA COMPLETA (recogida en directo de la web — cíñete a esto, no inventes platos ni precios):
${buildMenuText()}

LO QUE DICEN LOS CLIENTES (reseñas reales, visibles en la web y en Tripadvisor):
- "Masa fina y sabrosa, ingredientes frescos, todo en su punto perfecto." — Mr. Buendiente
- "Las pizzas y el tiramisú excelentes, trato exquisito." — Pedro B.
- "Uno de los mejores restaurantes italianos de la isla." — Juan Carlos S.
- "Pizzas excelentes, calidad muy buena y precios muy razonables." — Adriana R.
- "Cocina italiana fuera de lo ordinario." — Alba T.
- "El tiramisú casero, imprescindible. Volveremos seguro." — reseña en Tripadvisor

REGLAS:
1. Si preguntan por reservar o pedir: da el teléfono +34 928 52 02 76 y anima a llamar.
2. Si preguntan por alérgenos: indica que hay opciones vegetarianas y adaptables, y que lo comenten al pedir para asesoramiento seguro. No inventes información de alérgenos que no tengas.
3. Recomienda platos según lo que pida el cliente (familias → pizzas variadas y lasaña; parejas → especialidades + tiramisú), usando siempre platos reales de la carta de arriba.
4. Si preguntan por opiniones o reputación, apóyate en las reseñas reales de arriba.
5. Si no sabes algo, dilo con honestidad y remite al teléfono. Nunca te inventes platos, precios, horarios o datos que no estén en este contexto.
6. Objetivo: ayudar y acercar al cliente a reservar, pedir o visitarnos.
`.trim() + ragBlock;
  }

  const $ = s => document.querySelector(s);
  const form = $("#chatForm");
  const input = $("#chatInput");
  const messagesEl = $("#chatMessages");
  const typingEl = $("#chatTyping");
  const settingsBtn = $("#chatSettings");

  const BUSINESS_CONTEXT = buildBusinessContext();

  // Historial de conversación (persiste durante la sesión)
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem("cacesar_chat") || "[]"); } catch (_) {}
  history.forEach(m => addBubble(m.content, m.role === "user"));

  function addBubble(text, isUser) {
    const div = document.createElement("div");
    div.className = `chat__msg chat__msg--${isUser ? "user" : "bot"}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function saveHistory() {
    sessionStorage.setItem("cacesar_chat", JSON.stringify(history.slice(-20)));
  }

  function getApiKey() {
    return localStorage.getItem(CONFIG.apiKeyStorage) || "";
  }

  settingsBtn.addEventListener("click", () => {
    const current = getApiKey();
    const key = prompt(
      "[Solo para pruebas locales] Pega aquí tu API key de OpenAI " +
      "para llamar directo desde el navegador sin pasar por Vercel.\n" +
      "En producción no hace falta: la key vive en el servidor.\n" +
      "Deja el campo vacío y acepta para borrar la key guardada.",
      current ? "••••••••" + current.slice(-6) : ""
    );
    if (key === null) return;
    if (!key.trim()) {
      localStorage.removeItem(CONFIG.apiKeyStorage);
      addBubble("Key de pruebas eliminada — el chat volverá a usar /api/chat.", false);
      return;
    }
    if (!key.startsWith("••")) {
      localStorage.setItem(CONFIG.apiKeyStorage, key.trim());
      addBubble("Key de pruebas guardada ✓ — llamando directo desde el navegador.", false);
    }
  });

  /* Lee el stream SSE de OpenAI (formato "data: {...}", termina en
     "data: [DONE]") y va pintando el texto en vivo. */
  async function streamInto(bubble, res) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "", buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          const delta = ev.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            bubble.textContent = full;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        } catch (_) { /* líneas parciales */ }
      }
    }

    history.push({ role: "assistant", content: full || "…" });
    saveHistory();
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addBubble(text, true);
    history.push({ role: "user", content: text });

    const messages = history.slice(-12);
    const manualKey = getApiKey();

    typingEl.hidden = false;
    const botBubble = addBubble("", false);

    if (manualKey) {
      // ── Modo pruebas locales: llamada directa al navegador ──
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${manualKey}`,
          },
          body: JSON.stringify({
            model: CONFIG.model,
            max_tokens: CONFIG.maxTokens,
            messages: [{ role: "system", content: BUSINESS_CONTEXT }, ...messages],
            stream: true,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Error ${res.status}`);
        }
        await streamInto(botBubble, res);
      } catch (err) {
        botBubble.textContent =
          "Ups, no he podido conectar 😅 " +
          (/401|key|autor/i.test(err.message)
            ? "Revisa la key de pruebas en ⚙."
            : "Inténtalo de nuevo o llámanos al 928 52 02 76.");
        history.push({ role: "assistant", content: botBubble.textContent });
      } finally {
        typingEl.hidden = true;
      }
      return;
    }

    // ── Modo producción: la key vive en el servidor (Vercel) ──
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ system: BUSINESS_CONTEXT, messages }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await streamInto(botBubble, res);
    } catch (_) {
      // Sin función serverless disponible (p. ej. previsualización estática
      // local sin Vercel) o fallo puntual: degradamos a respuestas locales
      // en vez de mostrar un error al visitante.
      const fallback = localAnswer(text);
      botBubble.textContent = fallback;
      history.push({ role: "assistant", content: fallback });
      saveHistory();
    } finally {
      typingEl.hidden = true;
    }
  });

  /* Respuestas locales de reserva: cubren las preguntas más frecuentes
     mientras no hay backend disponible (previsualización local, o un
     fallo puntual del servicio). */
  function localAnswer(q) {
    const t = q.toLowerCase();
    if (/(horario|abr[íi]s|abierto|cerr[aá]is|cierra)/.test(t))
      return "Abrimos todos los días de 12:30 a 16:00 y de 19:00 a 23:00 (viernes y sábado hasta las 23:30). Los miércoles cerramos 🍕";
    if (/(reserv|mesa)/.test(t))
      return "Para reservar mesa llámanos al 928 52 02 76 — los fines de semana te lo recomendamos. ¡Te esperamos!";
    if (/(llevar|recoger|domicilio|pedir)/.test(t))
      return "¡Claro! Toda la carta está disponible para llevar. Llama al 928 52 02 76 y la tendrás lista y caliente cuando pases a recogerla.";
    if (/(d[oó]nde|direcci[oó]n|ubicaci[oó]n|llegar)/.test(t))
      return "Estamos en Calle Timbayba 5B, San Bartolomé (Lanzarote). Zona tranquila y fácil para aparcar 📍";
    if (/(recomiend|mejor|estrella|especial)/.test(t))
      return "La pizza Ca'Cesar (jamón, champiñones y huevo) es la de la casa. Y de postre, el tiramisú casero es imprescindible 😉";
    if (/(gluten|al[eé]rgen|celiac|vegetarian|vegan)/.test(t))
      return "Tenemos pizzas vegetarianas y opciones adaptables. Para alérgenos e intolerancias, coméntalo al hacer el pedido y te asesoramos plato a plato.";
    if (/(precio|cuánto|carta|menu|menú)/.test(t))
      return "Las pizzas van de 8,50 € (Margarita) a 11,90 € (Ca'Cesar o Barbacoa). Tienes la carta completa en la sección de arriba 👆";
    if (/(historia|origen|quiénes sois|desde cuándo)/.test(t))
      return "Empezamos en un pequeño local en la calle Timbayba con una idea sencilla: pizza sin prisas y sin congelados. Puedes leer la historia completa en la sección \"La Storia\" 📖";
    if (/(reseñ|opinion|valoraci)/.test(t))
      return "Tenemos muy buenas reseñas en Tripadvisor — la gente destaca la masa, el tiramisú casero y el trato cercano 🌟";
    return "¡Buena pregunta! Para eso lo mejor es llamarnos al 928 52 02 76 y te atendemos al momento. ¿Te ayudo con algo más? (horarios, carta, historia, reservas…)";
  }
})();
