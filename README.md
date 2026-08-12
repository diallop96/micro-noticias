# Micro Noticias

Portal de noticias sobre **productos importados y microeconomía**. Sitio público estático (para GitHub Pages) + panel de redacción privado que corre solo en tu computadora.

## Cómo está armado

```
index.html        → portada pública
nota.html          → vista de una nota
css/styles.css     → sistema de diseño (tema claro/oscuro)
js/site.js         → carga data/notes.json y arma la portada/nota
js/markdown.js     → conversor markdown → HTML seguro (sin inyección de HTML)
js/theme.js        → toggle de tema
data/notes.json    → base de datos del sitio: todas las notas (borrador y publicadas)
admin/              → panel de redacción (privado, ver abajo)
server/admin-server.js → servidor local que da vida al panel /admin
```

El sitio público (`index.html`, `nota.html`) es 100% estático: lee `data/notes.json`
y solo muestra las notas con `"status": "published"`. GitHub Pages no puede correr
backends, así que **no existe un login "real" en el sitio público** — sería una
falsa sensación de seguridad (cualquiera podría saltarlo mirando el código fuente).

## Cómo se publica una nota (el flujo de aprobación)

1. Corré el servidor local **una sola vez** desde esta carpeta:
   ```
   node server/admin-server.js
   ```
   La consola te va a mostrar un **PIN de 6 dígitos** (se genera solo la primera
   vez y se guarda en `server/config.json`, que nunca se sube a GitHub).

2. Abrí `http://127.0.0.1:4000/admin/` en el navegador e ingresá el PIN.

3. Escribí la nota, mirá la vista previa en vivo y elegí:
   - **Guardar borrador** → la nota queda guardada pero invisible en el sitio público.
   - **Aprobar y publicar** → recién ahí `status` pasa a `published` y aparece en la portada.

4. Para que el cambio se vea en la web pública de GitHub, subilo con git:
   ```
   git add data/notes.json
   git commit -m "Publicar nueva nota"
   git push
   ```
   GitHub Pages tarda ~1 minuto en actualizarse.

### Por qué esto es seguro de verdad

El servidor local:
- Solo escucha en `127.0.0.1` (nunca en `0.0.0.0`), así que **no es alcanzable
  desde otra computadora o desde internet**, aunque estés en la misma red wifi.
- Pide un PIN por sesión, con bloqueo temporal tras 5 intentos fallidos.

Pero el verdadero control de acceso a la publicación pública es tener permiso de
`git push` sobre este repositorio — eso es autenticación real de GitHub, no un
password embebido en JavaScript. Cualquiera que abra `admin/index.html` en la web
pública va a ver la pantalla de login, pero **no va a poder hacer nada** porque no
tiene el servidor local corriendo ni el PIN.

## Editar la nota modelo / agregar notas a mano

También podés editar `data/notes.json` directamente (respetando el formato) si
preferís no usar el panel. Cada nota tiene:

```json
{
  "id": "n-0001",
  "slug": "url-amigable-unica",
  "title": "...",
  "category": "Microeconomía | Comercio Exterior | Aranceles | Mercado Local | Análisis",
  "excerpt": "Bajada corta",
  "coverImage": "https://...",
  "author": "...",
  "readMinutes": 6,
  "status": "draft | published",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "publishedAt": "ISO 8601 o null",
  "body": "Markdown simple: ## títulos, **negrita**, *cursiva*, listas, > citas, [texto](url)"
}
```

## Desarrollo local del sitio público

No hace falta build ni dependencias. Para previsualizar el sitio público solo,
alcanza con abrir `index.html`, o mejor, levantar cualquier server estático
(por ejemplo `node server/admin-server.js`, que también sirve el sitio en `/`).

## Stack

HTML, CSS y JavaScript sin frameworks ni build step. El servidor de administración
usa únicamente módulos nativos de Node.js (sin `npm install`).
