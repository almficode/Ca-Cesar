# Web Pizzería Ca'Cesar

Web one-page premium para Pizzería Ca'Cesar (San Bartolomé, Lanzarote), réplica fiel del sistema de diseño y los comportamientos de la plantilla de referencia (ERIC COLE): fondo blanco, texto #242424, gris #9E9E9E, líneas #E0E0E0; tipografías **Geist + Geist Mono + Inspiration** (script en letras sueltas de los títulos); preloader negro con contador %; springs de entrada; texto que se rellena de color con el scroll; tarjetas tipo navegador con puntitos; listas numeradas 001-00N en mono; formulario de subrayados; overlay de grano. Implementación 100% original en HTML/CSS/JS sin dependencias.

## Estructura

```
index.html          → página principal
carta.html          → LA CARTA completa (página propia, en español)
historia.html       → LA STORIA (página propia editorial)
aviso-legal.html    → aviso legal
privacidad.html     → política de privacidad
cookies.html        → política de cookies
css/styles.css      → sistema de diseño completo
js/main.js          → animaciones, hero de vídeo, scroll, reloj, banner de cookies
js/menu-data.js     → LA CARTA: editar aquí platos y precios
js/chat.js          → asistente IA "Cesarino" (llama a /api/chat)
api/chat.js         → función serverless de Vercel: guarda la API key en el servidor
.env.example        → variables de entorno que hay que configurar en Vercel
```

## Secciones (index.html)

Preloader % · **Hero con VÍDEO real del local** (`video/horno.mp4`, letterbox de cine con timecode REC del metraje, y **transición iris** de salida: el círculo se cierra sobre el vídeo descubriendo la capa crema "Benvenuti"; el centro del iris sigue al ratón) · Le Pizze (4 favoritas + **botón gigante "VER CARTA COMPLETA" → carta.html**) · Il Metodo (línea de tiempo que se dibuja con el scroll) · **La Storia**: cinta de fotogramas en movimiento + índice de capítulos en la paleta clara de la web (filas clicables → historia.html) · **Sección Cesarino IA** (explicación + botón que abre el asistente) · Reseñas (paleta clara, marquesinas en movimiento con estrellas) · Reservas (**solo botones de llamada**) · Footer oscuro.

**Cesarino** además es un botón flotante con texto circular girando (abajo dcha.) que abre el overlay a pantalla completa con chips de sugerencias y el chat.

**Banner de cookies**: ya no aparece al cargar la página — se muestra justo al terminar de ver el hero (cuando el iris se cierra del todo y aparece "Benvenuti"), para no tapar la experiencia inicial.

**Vídeo del hero**: `video/horno.mp4` (vídeo real del local, 1920x1080, ~7s, H.264/AAC). El poster (`video/horno-poster.png`) se generó automáticamente del primer fotograma con QuickLook. Para cambiarlo, sustituye ambos archivos manteniendo los mismos nombres, o edita las rutas en `#heroVideo` dentro de `index.html`.

## Pendiente (assets reales)

Las imágenes actuales son **placeholders de Unsplash** marcados con comentarios `<!-- PLACEHOLDER -->` en `index.html`. Sustituir por:
- Fotos reales de las pizzas (sección Le Pizze y hero)
- Fotos del local y el equipo (La Storia)
- Fotos de Instagram (@pizzeria_cacesar) para la galería
- Frames del vídeo del proceso para la sección Il Metodo (la estructura ya acepta N frames en `.metodo__frame`)

## Asistente IA — despliegue en Vercel (OpenAI)

El asistente usa la **API de OpenAI** y la key vive **solo en el servidor** (variable de entorno), nunca en el navegador del visitante. Para activarlo del todo en Vercel:

1. Sube este proyecto a un repositorio y despliégalo en Vercel (o arrastra la carpeta con `vercel deploy` / el import de GitHub — no hace falta build ni framework, Vercel detecta `index.html` y la carpeta `api/` automáticamente).
2. En el proyecto de Vercel, ve a **Settings → Environment Variables** y añade:
   - `OPENAI_API_KEY` = tu clave de [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - *(opcional)* `OPENAI_MODEL` si quieres usar otro modelo distinto de `gpt-4o-mini` (por ejemplo `gpt-4o` para más calidad)
3. Vuelve a desplegar (o simplemente espera a que Vercel aplique las variables en el siguiente deploy).

Con eso, **todos los visitantes** ya pueden hablar con Cesarino sin configurar nada — la función `api/chat.js` recibe la pregunta, añade la key desde el servidor y devuelve la respuesta de OpenAI en streaming.

**De dónde saca el conocimiento el asistente:**
- **La carta completa** se genera en directo desde `js/menu-data.js` en cada carga de la web — si añades o cambias un plato ahí, el asistente lo sabe automáticamente, sin tocar nada más.
- **La historia de la casa** y **reseñas reales** (Tripadvisor) están incluidas como contexto fijo en `js/chat.js` (`buildBusinessContext()`), igual que aparecen en la web.
- Datos de contacto, horario y redes, también ahí mismo.
- Preparado para RAG: añadir textos de PDFs/catálogos adicionales en `CONFIG.ragDocs` dentro de `js/chat.js`.
- El asistente tiene instrucción explícita de no inventarse platos, precios ni datos que no estén en ese contexto.

**Detalles técnicos:**
- `api/chat.js` es una Vercel Edge Function (`export const config = { runtime: "edge" }`) que reenvía el stream SSE de OpenAI tal cual — no necesita `package.json` ni dependencias.
- Si `api/chat.js` no responde (por ejemplo, al previsualizar la web como archivos estáticos sin funciones serverless, como en este entorno de desarrollo local), el chat degrada automáticamente a respuestas locales básicas — el visitante nunca ve un error.
- El botón **[DEV]** en la cabecera del chat es un atajo opcional solo para pruebas locales: permite pegar tu propia API key de OpenAI y llamar directo desde el navegador sin pasar por Vercel. En producción no hace falta tocarlo.

## Vista previa local

```bash
python3 -m http.server 8890
# → http://localhost:8890
```

Nota: el panel de preview de Claude Code sirve la copia espejo `/tmp/cacesar_site`
(su sandbox no puede leer ~/Desktop). Tras editar, sincronizar con:

```bash
rsync -a --delete "/Users/adrianalmeida/Desktop/Ca Cesar/" /tmp/cacesar_site/
```

## Datos del negocio

- Calle Timbayba 5B, 35550 San Bartolomé, Lanzarote
- +34 928 52 02 76
- 12:30–16:00 · 19:00–23:00 (V/S hasta 23:30) · miércoles cerrado
- Instagram: @pizzeria_cacesar
