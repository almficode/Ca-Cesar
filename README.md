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
js/main.js          → animaciones, hero de vídeo, scroll, reloj
js/menu-data.js     → LA CARTA: editar aquí platos y precios
js/chat.js          → asistente IA "Cesarino" (API de Claude)
```

## Secciones (index.html)

Preloader % · **Hero con VÍDEO real del local** (`video/horno.mp4`, letterbox de cine con timecode REC del metraje, y **transición iris** de salida: el círculo se cierra sobre el vídeo descubriendo la capa crema "Benvenuti"; el centro del iris sigue al ratón) · Le Pizze (4 favoritas + **botón gigante "VER CARTA COMPLETA" → carta.html**) · Il Metodo (línea de tiempo que se dibuja con el scroll) · **La Storia**: cinta de fotogramas en movimiento + índice de capítulos en la paleta clara de la web (filas clicables → historia.html) · **Sección Cesarino IA** (explicación + botón que abre el asistente) · Reseñas (paleta clara, marquesinas en movimiento con estrellas) · Reservas (**solo botones de llamada**) · Footer oscuro.

**Cesarino** además es un botón flotante con texto circular girando (abajo dcha.) que abre el overlay a pantalla completa con chips de sugerencias y el chat (API key vía [API]; sin key responde en local).

**Vídeo del hero**: `video/horno.mp4` (vídeo real del local, 1920x1080, ~7s, H.264/AAC). El poster (`video/horno-poster.png`) se generó automáticamente del primer fotograma con QuickLook. Para cambiarlo, sustituye ambos archivos manteniendo los mismos nombres, o edita las rutas en `#heroVideo` dentro de `index.html`.

## Pendiente (assets reales)

Las imágenes actuales son **placeholders de Unsplash** marcados con comentarios `<!-- PLACEHOLDER -->` en `index.html`. Sustituir por:
- Fotos reales de las pizzas (sección Le Pizze y hero)
- Fotos del local y el equipo (La Storia)
- Fotos de Instagram (@pizzeria_cacesar) para la galería
- Frames del vídeo del proceso para la sección Il Metodo (la estructura ya acepta N frames en `.metodo__frame`)

## Asistente IA

- Pulsar ⚙ en la cabecera del chat para guardar la API key de Anthropic (se almacena solo en el navegador del visitante).
- Sin API key funciona en modo local: responde horarios, reservas, carta, alérgenos y dirección.
- Modelo y contexto del negocio configurables al inicio de `js/chat.js` (`CONFIG` y `BUSINESS_CONTEXT`).
- Preparado para RAG: añadir textos de PDFs/catálogos en `CONFIG.ragDocs`.

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
