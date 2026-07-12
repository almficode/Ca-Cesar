// ═══════════════════════════════════════════════════════════
// CA'CESAR · Función serverless de Vercel para Cesarino (OpenAI)
//
// Vive en el servidor: la API key de OpenAI NUNCA llega al
// navegador del visitante. El único paso pendiente en Vercel es
// configurar la variable de entorno OPENAI_API_KEY (ver README).
//
// Ruta pública: POST /api/chat  →  { system, messages }
// Devuelve el stream SSE de OpenAI tal cual, listo para que
// js/chat.js lo lea con su parser.
// ═══════════════════════════════════════════════════════════

export const config = { runtime: "edge" };

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_TOKENS = 700;
const MAX_HISTORY = 12;

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Visible en los logs de la función en Vercel para que el dueño del
    // sitio detecte enseguida que falta configurar la variable de entorno.
    console.error("[cesarino] Falta OPENAI_API_KEY en las variables de entorno de Vercel.");
    return json({ error: "Asistente no configurado todavía." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { system, messages } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Faltan mensajes" }, 400);
  }

  // OpenAI usa el propio array de mensajes para el system prompt
  // (role: "system"), a diferencia de Anthropic que lo separa aparte.
  const openaiMessages = [
    ...(typeof system === "string" && system.trim()
      ? [{ role: "system", content: system.slice(0, 12000) }]
      : []),
    ...messages.slice(-MAX_HISTORY).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m?.content ?? "").slice(0, 4000),
    })),
  ];

  let upstream;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: openaiMessages,
        stream: true,
      }),
    });
  } catch (err) {
    console.error("[cesarino] Error conectando con OpenAI:", err);
    return json({ error: "No se pudo conectar con OpenAI" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("[cesarino] OpenAI respondió", upstream.status, detail.slice(0, 500));
    return json({ error: `OpenAI devolvió un error (${upstream.status})` }, upstream.status || 502);
  }

  // Reenviamos el stream SSE tal cual — js/chat.js ya sabe leerlo.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
