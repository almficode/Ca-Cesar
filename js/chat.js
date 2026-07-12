/* ═══════════════════════════════════════════════
   CA'CESAR · Asistente IA "Cesarino"
   API de Claude (Anthropic) con streaming directo desde el navegador.
   La API key se guarda en localStorage (⚙ en la cabecera del chat).
   Preparado para RAG: añadir documentos a CONFIG.ragDocs.
   ═══════════════════════════════════════════════ */

(() => {
  "use strict";

  const CONFIG = {
    apiKeyStorage: "cacesar_api_key",
    model: "claude-opus-4-8",
    maxTokens: 1024,
    // RAG: añadir aquí contenido de PDFs, catálogos, FAQs, etc.
    // Cada entrada se inyecta como contexto adicional del negocio.
    ragDocs: [],
  };

  const BUSINESS_CONTEXT = `
Eres "Cesarino", el asistente virtual de la Pizzería Ca'Cesar en San Bartolomé, Lanzarote.
Tu tono es cercano, amable y con algún toque italiano ocasional ("ciao", "perfetto"). Respondes SIEMPRE en el idioma del cliente (normalmente español). Respuestas breves y útiles.

DATOS DEL NEGOCIO:
- Dirección: Calle Timbayba 5B, 35550 San Bartolomé, Lanzarote (Islas Canarias).
- Teléfono (reservas y pedidos para llevar): +34 928 52 02 76.
- Horario: todos los días 12:30–16:00 y 19:00–23:00 (viernes y sábado hasta 23:30). MIÉRCOLES CERRADO.
- Instagram: @pizzeria_cacesar.
- Especialidad: pizza artesanal con masa de fermentación lenta (hasta 48h), ingredientes frescos, elaboración al momento. Tiramisú casero famoso. Lasaña casera muy valorada.
- Ideal para: familias, parejas, grupos de amigos, comida para llevar.
- Valores: calidad, elaboración artesanal, trato cercano, buena relación calidad-precio.

CARTA RESUMIDA (precios en euros):
Pizzas (8,50–11,90): Margherita 8,50 · Ca'Cesar (la de la casa: jamón, champiñones, huevo) 11,90 · Diavola 10,50 · Quattro Formaggi 11,00 · Prosciutto e Funghi 10,50 · Quattro Stagioni 11,50 · Barbacoa 11,90 · Vegetariana 10,00 · Tonno e Cipolla 10,50 · Calzone 11,50 · Carbonara 11,00 · Hawaiana 10,00.
Entrantes: pan de ajo 4,50 · bruschetta 5,50 · caprese 8,50 · césar 9,00 · mixta 7,00 · provolone 7,50.
Pastas: lasaña casera 9,90 · carbonara 9,00 · boloñesa 9,00 · arrabbiata 8,50 · tagliatelle 4 formaggi 9,50 · ravioli 9,90.
Carnes: entrecot 16,90 · solomillo de cerdo 13,90 · pechuga de pollo 10,90 · milanesa 11,50.
Postres: tiramisú casero 5,50 · panna cotta 4,90 · brownie 5,50 · helados 4,00.
Bebidas: agua, refrescos, cerveza, vinos, café.

REGLAS:
1. Si preguntan por reservar o pedir: da el teléfono +34 928 52 02 76 y anima a llamar.
2. Si preguntan por alérgenos: indica que hay opciones vegetarianas y adaptables, y que lo comenten al pedir para asesoramiento seguro. No inventes información de alérgenos.
3. Recomienda platos según lo que pida el cliente (familias → pizzas variadas y lasaña; parejas → especialidades + tiramisú).
4. Si no sabes algo, dilo con honestidad y remite al teléfono.
5. Objetivo: ayudar y acercar al cliente a reservar, pedir o visitarnos.
`.trim();

  const $ = s => document.querySelector(s);
  const form = $("#chatForm");
  const input = $("#chatInput");
  const messagesEl = $("#chatMessages");
  const typingEl = $("#chatTyping");
  const settingsBtn = $("#chatSettings");

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
      "Configura la API key de Anthropic para activar a Cesarino.\n(Se guarda solo en este navegador)",
      current ? "••••••••" + current.slice(-6) : ""
    );
    if (key === null) return;
    if (key.trim() && !key.startsWith("••")) {
      localStorage.setItem(CONFIG.apiKeyStorage, key.trim());
      addBubble("API key guardada ✓ — ¡Cesarino está listo! Pregúntame lo que quieras.", false);
    }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addBubble(text, true);
    history.push({ role: "user", content: text });

    const apiKey = getApiKey();
    if (!apiKey) {
      // Modo sin API key: respuestas locales básicas para no dejar al usuario sin ayuda
      const fallback = localAnswer(text);
      addBubble(fallback, false);
      history.push({ role: "assistant", content: fallback });
      saveHistory();
      return;
    }

    typingEl.hidden = false;
    const botBubble = addBubble("", false);

    try {
      // Contexto RAG opcional
      const ragBlock = CONFIG.ragDocs.length
        ? "\n\nDOCUMENTACIÓN ADICIONAL:\n" + CONFIG.ragDocs.join("\n---\n")
        : "";

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          // Necesario para llamadas directas desde navegador (CORS)
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: CONFIG.model,
          max_tokens: CONFIG.maxTokens,
          system: BUSINESS_CONTEXT + ragBlock,
          messages: history.slice(-12),
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error ${res.status}`);
      }

      // Streaming SSE: pintamos los tokens según llegan
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
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
              full += ev.delta.text;
              botBubble.textContent = full;
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
          } catch (_) { /* líneas parciales */ }
        }
      }

      history.push({ role: "assistant", content: full || "…" });
      saveHistory();
    } catch (err) {
      botBubble.textContent =
        "Ups, no he podido conectar 😅 " +
        (String(err.message).includes("401") || /key/i.test(err.message)
          ? "Revisa la API key en ⚙."
          : "Inténtalo de nuevo o llámanos al 928 52 02 76.");
      history.push({ role: "assistant", content: botBubble.textContent });
    } finally {
      typingEl.hidden = true;
    }
  });

  /* Respuestas locales cuando no hay API key configurada:
     cubren las preguntas más frecuentes del negocio. */
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
      return "Las pizzas van de 8,50 € (Margherita) a 11,90 € (Ca'Cesar o Barbacoa). Tienes la carta completa un poco más arriba en esta página 👆";
    return "¡Buena pregunta! Para eso lo mejor es llamarnos al 928 52 02 76 y te atendemos al momento. ¿Te ayudo con algo más? (horarios, carta, reservas…)";
  }
})();
