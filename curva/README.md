# CURVA

Juego educativo de ciencia ficción para adolescentes sobre la gravedad, la ecuación de Einstein
y lo que la naturaleza **no** permite construir. Todo está en un solo archivo: `index.html`
(HTML5 + Canvas 2D + Web Audio + JavaScript vanilla, sin dependencias ni build).

> «Es solo matemática», te dijeron.

## Cómo correrlo

**Opción 1 — abrirlo directo.** Doble clic en `curva/index.html` (o arrastralo al navegador).
Funciona desde `file://`, no necesita servidor ni internet.

**Opción 2 — servidor local** (recomendado en celular o para compartir en la red):

```bash
cd curva
python3 -m http.server 8000      # o: npx serve .
# abrí http://localhost:8000
```

**Opción 3 — GitHub Pages.** Cuando esta carpeta esté en la rama que publica el sitio, el juego
queda en `https://diallop96.github.io/micro-noticias/curva/`.

El audio arranca con el primer toque o clic (así lo exigen los navegadores).

## Controles

| Acción | Desktop | Celular |
|---|---|---|
| Rayo tractor | Mantener apretado el mouse | Mantener el dedo |
| Llevar materia | Arrastrar hacia el centro | Arrastrar |
| Soltar | Soltar **dentro del anillo punteado** | Levantar el dedo dentro del anillo |
| Obedecer / Dudar (codec) | `Q` / `E` (o `1` / `2`) | Botones del codec |
| Pausa | `P` o `Esc` | Botón `II` |
| Silencio | `M` | Menú de pausa |

## Mecánicas

- **Rayo tractor:** agarrás materia y la llevás al núcleo. Soltarla fuera del anillo la pierde
  (y te cuesta un intento de realidad). Un toque muy corto se cancela sin castigo.
- **Combos:** 3 capturas seguidas = x2, 5 = x3. Si pasa demasiado tiempo sin capturar, el combo se cae.
- **Sobrecarga gravitacional:** cada captura llena la barra. Llena, se activan 5 segundos en los
  que un rayo sale del núcleo hacia tu puntero y absorbe **todo lo que toca**, a x5.
- **Partículas engaño:** brillan igual que la materia real, pero **no curvan el espacio**: no tienen
  anillo de lente, no hunden la grilla y su latido tartamudea. Tocarlas explota, resta masa y cuesta
  un intento. Desde el nivel 2 persiguen al rayo.
- **Potenciadores:** hexágonos que se instalan llevándolos al núcleo (anillo más grande, rayo más
  ancho, +50% de sobrecarga, +12 s). En el Acto III se revela lo que realmente son.
- **3 niveles:** la materia va más rápido, el anillo se achica y el tiempo baja (120 → 110 → 100 s).
  Si se acaba el tiempo perdés un intento y recibís 30 s extra.
- **Meta:** 10.000.000 kg. Al llegar empieza el Acto IV.
- **Ritmo:** el soundtrack es procedural y su BPM sube con la curvatura (84 → ~170 BPM).
- **Récord:** se guarda en `localStorage` (masa máxima, finales vistos, fragmentos y datos del archivo).

### Intentos de realidad

Tenés 3. Cuando los quemás todos entrás en **REALIDAD CERO** (la imagen se desatura, suena un
latido): el próximo error cierra el proyecto. Llegar a la meta en realidad cero te deja solo el Final A.

Cada *game over* muestra el codec final de Solano («Volvé cuando entiendas que la naturaleza no
negocia») y una **interferencia**: un dato real sobre por qué fallaste.

### Codec sin pausa

Las comunicaciones aparecen abajo a la izquierda como subtítulos **mientras seguís jugando**.
Si perdés un intento o un combo de 3 o más mientras alguien habla, el mensaje **se corta a la
mitad**. Las interceptaciones cortadas se retransmiten una vez más tarde.

Voz: por defecto usa la **voz sintética del navegador** (`speechSynthesis`) si hay una voz en
español instalada; si no, usa pitidos sintetizados tipo radio. Se cambia en el título o en pausa.

### Historia por comportamiento

- **Grabaciones:** las partículas «raras» (blanco-celeste, con destellos de color) liberan, al
  absorberlas con el rayo, un fragmento de audio del científico. Son 5.
- **Decisiones:** cada tanto Solano pide «un poco más de masa». Podés **obedecer** (+20% de
  sobrecarga) o **dudar** (−5 s). Si no respondés o se corta el mensaje, tu silencio cuenta como un sí.

## Estructura narrativa (spoilers)

<details>
<summary>Mostrar</summary>

1. **Acto I — El encargo.** El Dr. Solano te contrata para «demostrar» que una cámara de gravedad
   es posible. Te da la ecuación de Einstein: «es solo matemática».
2. **Acto II — La grieta.** Un canal «enemigo» interceptado hace la cuenta que Solano no muestra:
   10⁷ kg a un metro dan 0,00007 g. El HUD deja ver, por instantes, otro nombre para el proyecto.
3. **Acto III — La verdad.** El HUD cambia: la masa pasa a llamarse «carga explosiva» y los
   potenciadores muestran su nombre real (carcasa, foco de implosión, detonador, temporizador).
   El «enemigo» era el Observatorio, que intentaba advertirte.
4. **Acto IV — La elección.**
   - **Final A (obedecer):** el agujero se abre… y es una trampa. *«No pudiste detenerlo. Nadie
     puede. La naturaleza ya lo decidió.»*
   - **Final B (sabotear):** requiere **las 5 grabaciones**, **haber dudado al menos 3 veces** y
     **llegar con al menos 1 intento de realidad**. Entonces se reproduce la grabación completa y
     aparece la opción de mantener apretado para cerrar el agujero. *«La verdad no se construye.
     Se descubre. Y a veces, se destruye.»*

Ambos finales cierran con: *«La cámara de gravedad de Dragon Ball es imposible no por falta de
tecnología, sino porque la naturaleza no lo permite. Entenderlo es más poderoso que imaginarlo.»*

</details>

## La física de verdad (lo que enseñan las interceptaciones)

| Dato | Valor |
|---|---|
| Constante de gravitación G | 6,674 × 10⁻¹¹ N·m²/kg² |
| Fuerza eléctrica vs. gravitatoria entre dos protones | ~10³⁶ veces |
| Aceleración de 10⁷ kg a 1 m | ≈ 6,7 × 10⁻⁴ m/s² ≈ 0,00007 g |
| Masa puntual para 100 g a 10 m | ≈ 1,5 × 10¹⁵ kg (más que el Everest) |
| Factor de acoplamiento 8πG/c⁴ | ≈ 2,1 × 10⁻⁴³ s²/(kg·m) |
| Radio de Schwarzschild de 10⁷ kg | ≈ 1,5 × 10⁻²⁰ m |
| Evaporación de Hawking de 10⁷ kg | del orden de un día |
| E = mc² para 10⁷ kg | ≈ 9 × 10²³ J (~1.500 años del consumo energético mundial) |
| Energía negativa | solo trazas (efecto Casimir), nunca en escala macroscópica |
| Principio de equivalencia | la única «gravedad artificial» en una sala es aceleración (centrífuga, cohete) |

Todas quedan guardadas en el **ARCHIVO** (pantalla de título) a medida que las escuchás completas.

## Detalles técnicos

- **Render:** Canvas 2D con escena fuera de pantalla + post-proceso: bloom (downsample con umbral
  suave), aberración cromática radial por canal, distorsión por franjas al absorber masa pesada o
  perder un intento, sacudida de cámara por *trauma*, lente gravitacional sobre el fondo y grilla
  del espacio-tiempo deformada por el núcleo y por cada masa real.
- **Capa CRT:** scanlines, grano animado y viñeta en CSS (cubren también el HUD).
- **Calidad adaptativa:** si el equipo no sostiene el framerate, baja resolución y efectos solo.
- **Audio:** todo sintetizado con Web Audio (sin archivos): secuenciador con lookahead, pad,
  bajo, arpegios, efectos y el «ring» del codec.
- **Responsive:** HUD con `clamp()` y *safe areas*; eventos `pointer` unificados para mouse y touch.
- **Modo de prueba:** abrir `index.html#debug` expone `window.CURVA` (estado y funciones) para testear.

## Probado

- **Chromium (motor de Chrome), automatizado con Playwright:** escritorio (1280×760 y 1366×768),
  celular vertical (390×844) y horizontal (844×390) con eventos táctiles. Se recorrieron: tutorial,
  combos, sobrecarga, señuelos, pérdida por soltar afuera, por tiempo, realidad cero, *game over*,
  reintento, los 3 niveles, grabaciones, preguntas del codec, pausa, archivo, Final A y Final B.
  **0 errores y 0 advertencias en consola.**
- **Firefox:** no se pudo correr en el entorno donde se generó el juego. El código usa solo APIs
  estándar soportadas por Firefox (Canvas 2D, Web Audio, Pointer Events, `speechSynthesis`,
  `localStorage`), pero conviene hacer una pasada manual.
