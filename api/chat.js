// ═══════════════════════════════════════════════════════════
// CA'CESAR · Función serverless de Vercel para Cesarino
//
// Vive en el servidor: la API key de Anthropic NUNCA llega al
// navegador del visitante. El único paso pendiente en Vercel es
// configurar la variable de entorno ANTHROPIC_API_KEY (ver README).
//
// Ruta pública: POST /api/chat  →  { system, messages }
// Devuelve el stream SSE de Claude tal cual, listo para que
// js/chat.js lo lea con el mismo parser de siempre.
// ═══════════════════════════════════════════════════════════

export const config = { runtime: "edge" };

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_TOKENS = 1024;
const MAX_HISTORY = 12;

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Visible en los logs de la función en Vercel para que el dueño del
    // sitio detecte enseguida que falta configurar la variable de entorno.
    console.error("[cesarino] Falta ANTHROPIC_API_KEY en las variables de entorno de Vercel.");
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

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: typeof system === "string" ? system.slice(0, 8000) : undefined,
        messages: messages.slice(-MAX_HISTORY),
        stream: true,
      }),
    });
  } catch (err) {
    console.error("[cesarino] Error conectando con Anthropic:", err);
    return json({ error: "No se pudo conectar con Anthropic" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("[cesarino] Anthropic respondió", upstream.status, detail.slice(0, 500));
    return json({ error: `Anthropic devolvió un error (${upstream.status})` }, upstream.status || 502);
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
