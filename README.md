# javascript-cheatsheet

Guía de resolución para los 4 exámenes prácticos de JavaScript Vanilla incluidos en este repo. Los cuatro (**Cafetería**, **Eventos**, **GameHub**, **Mascotas**) comparten la misma estructura de 5 issues generados automáticamente (Classmoji), así que en vez de repetir la teoría cuatro veces, esta guía la explica **una sola vez por issue** y después muestra cómo se resolvió (o se podría resolver mejor) en cada proyecto concreto.

Sirve para dos cosas:

1. **Repasar antes de un examen similar** — cada sección es la receta genérica + los errores típicos que ya aparecieron en las cuatro soluciones reales.
2. **Auditar lo ya resuelto** — cada sección incluye una tabla "estado observado" con detalles puntuales de `js/script.js` en cada carpeta que vale la pena revisar/mejorar.

## 🗂 Los cuatro proyectos

| Carpeta | Dominio | Entidad principal | Endpoint base | Grid | Modal | `localStorage` key |
|---|---|---|---|---|---|---|
| `examen-cafeteria` | Cafetería de especialidad | `productos` / `categorias` | `/api/productos`, `/api/categorias` | `#catalogoGrid` | `#modalDetalle` | `cafeteria_pedidos` |
| `examen-eventos` | Venta de entradas | `eventos` / `generos` | `/api/eventos`, `/api/generos` | `#eventosGrid` | `#modalCompra` | `eventos_compras` |
| `examen-gamehub` | Catálogo de videojuegos | `videojuegos` / `plataformas` | `/api/videojuegos`, `/api/plataformas` | `#catalogoGrid` | `#modalDetalle` | `gamehub_favoritos` |
| `examen-mascotas` | Adopción de mascotas | `animales` / `especies` | `/api/animales`, `/api/especies` | `#catalogoGrid` | `#modalDetalle` | `adopcion_solicitudes` |

Los cuatro traen su propio backend Express en `server/server.js` (puerto `3000`, CORS habilitado) y su propio `README.pdf`/`README.md` con la tabla de issues específica. Se levantan igual en todos:

```bash
cd examen-<nombre>
npm install
npm start          # levanta el server en :3000
# abrir index.html con Live Server
```

## 🤖 Cómo funcionan los issues automáticos

Cada repo tiene `.github/workflows/setup-issues.yml`: al hacer push a `main` (o disparar el workflow manualmente), un script de Python crea (si no existen ya, por título) 5 issues etiquetados `classroom-assignment`. Cada issue trae el checklist de qué debe cumplirse y un **commit sugerido** con `Closes #N` en el cuerpo.

> **Pro-tip:** el cierre automático de issues por commit solo funciona si el commit (o el mensaje del PR) contiene literalmente `Closes #N`, `Fixes #N` o `Resolves #N`, y el commit llega a la rama por defecto (`main`). Si armás el commit a mano, copiá el texto sugerido del issue tal cual — cambiar el número o la palabra clave rompe el auto-cierre.

Los 5 issues son siempre la misma progresión pedagógica:

1. Enlazar HTML/CSS/JS
2. Consumir la API con `fetch`/`async-await`
3. Renderizar catálogo + selects en el DOM
4. Filtrado, cálculo dinámico y modal
5. Persistencia en `localStorage`

A continuación, issue por issue.

---

## Issue 1 — Vincular `css/styles.css` y `js/script.js` en `index.html`

**Objetivo:** que el HTML cargue la hoja de estilos y el script antes de que el examen empiece a pedir DOM/fetch.

**Checklist del issue:**
- [ ] `<link rel="stylesheet" href="css/styles.css">` dentro de `<head>`.
- [ ] `<script src="js/script.js">` vinculado, como módulo o con `defer`.

**Pro-tips:**
- Si tu script usa `import`/`export`, tiene que ir con `type="module"` — los módulos son `defer` por naturaleza, así que no hace falta agregar `defer` además.
- Si no usás módulos, dos opciones válidas: `<script defer src="...">` en el `<head>`, o `<script src="...">` **al final del `<body>`**, justo antes de `</body>`. Lo que no funciona es un `<script>` sin `defer` puesto en el `<head>`: se ejecuta antes de que exista el DOM y todos los `document.getElementById(...)` devuelven `null`.
- Commit sugerido en los 4 exámenes: `feat(html): vincular css y script js al html` — cierra el issue #1.

**Estado observado en los 4 proyectos:**

| Proyecto | Estrategia usada |
|---|---|
| Cafetería | `<script type="module" src="js/script.js">` al final del `<body>` |
| Eventos | `<script type="module" src="./js/script.js">` al final del `<body>` |
| GameHub | `<script type="module" src="js/script.js">` al final del `<body>` |
| Mascotas | `<script src="js/script.js">` **sin** `type="module"` ni `defer`, pero ubicado al final del `<body>` |

Las cuatro son válidas (el script corre después de que el DOM ya existe), pero Mascotas es la única que no usa módulos ES — si en algún momento se necesita `import`/`export` ahí, hay que agregar `type="module"` primero.

---

## Issue 2 — Consumir la API con `fetch` + `async/await`

**Objetivo:** traer los datos del backend local antes de poder pintar nada.

**Checklist del issue:** pedir el recurso principal (productos/eventos/videojuegos/animales) y el recurso de filtro (categorías/géneros/plataformas/especies) por `fetch`, manejando errores con `try...catch`.

**Receta genérica:**

```js
async function obtenerRecurso() {
  try {
    const response = await fetch(`${API_URL}/api/recurso`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; // ⚠️ nunca devuelvas el objeto Error: rompe cualquier .forEach/.map posterior
  }
}
```

**Pro-tips:**
- `fetch` **no** rechaza la promesa por códigos 4xx/5xx, solo por errores de red. Si querés detectar un 404 real, tenés que chequear `response.ok` vos mismo.
- En el `catch`, devolvé un valor "seguro" para el tipo que espera el resto del código (`[]` para listas, `null` para un detalle). Devolver el propio `Error` — como aparece en un caso real abajo — hace que un `productos.forEach(...)` explote si el fetch falla.
- Si tenés que pedir dos endpoints al arrancar (recurso + catálogo de filtros), `Promise.all([obtenerA(), obtenerB()])` es más rápido que dos `await` secuenciales porque los dispara en paralelo.

**Estado observado en los 4 proyectos** (⚠️ = no cumple literalmente el checklist del issue):

| Proyecto | `try...catch` | Detalle |
|---|---|---|
| Cafetería | ✅ | Sí, pero en el `catch` hace `return error` — si el fetch falla, `todosProductos` termina siendo un objeto `Error`, no un arreglo, y el primer `.forEach` de `renderizarProductos()` tira `TypeError`. Mejor devolver `[]`. |
| Eventos | ⚠️ | Ninguna de las 4 funciones (`obtenerEventos`, `obtenerEventosPorGenero`, `obtenerEventosPorId`, `obtenerGeneros`) tiene `try/catch`, pese a que el issue lo pide explícitamente. Si el server no está levantado, la promesa rechaza sin manejar y corta `init()`. |
| GameHub | ⚠️ | Mismo caso: las 4 funciones de fetch van sin `try/catch`. |
| Mascotas | ⚠️ | Mismo caso: `obtenerMascotas`, `obtenerEspecies`, `obtenerMascotaPorId` sin `try/catch`. |

Si vas a reutilizar alguno de estos cuatro como base, vale la pena agregar el `try/catch` que falta antes de dar el issue por cerrado — el checklist del propio issue lo pide.

---

## Issue 3 — Renderizar catálogo y selects en el DOM

**Objetivo:** pintar las tarjetas del catálogo y poblar los `<select>` de filtros a partir de los datos ya obtenidos.

**Patrón usado en los 4 proyectos** (idéntico en su forma):

```js
function renderizarCatalogo() {
  contenedor.innerHTML = ''; // limpiar antes de repintar, si no se duplica
  items.forEach((item) => {
    const entry = document.createElement('div');
    entry.innerHTML = `<div class="item-card" data-id="${item.id}">...</div>`;
    contenedor.appendChild(entry);
  });
}
```

**Pro-tips:**
- Este patrón (crear un `<div>` "envoltorio" con `createElement` y meterle el HTML real adentro con `innerHTML`) funciona, pero deja un `<div>` extra en el DOM por cada tarjeta que no está en el diseño original. La alternativa más limpia es `contenedor.insertAdjacentHTML('beforeend', html)`, que inserta el HTML tal cual sin nodo contenedor de más. No es un bug — el CSS de las 4 apps no depende de que la tarjeta sea hija directa del grid — pero es la primera optimización que un revisor de código va a señalar.
- Poblar un `<select>` es siempre el mismo mini-patrón: por cada opción, `document.createElement('option')`, `entry.value = id`, `entry.textContent = nombre`, `select.appendChild(entry)`.
- Guardá siempre dos copias del arreglo: una "maestra" (`todosProductos`, `todosEventos`, `todasMascotas`) que nunca se toca, y otra "de trabajo" (`productos`, `eventos`, `mascotas`) que es la que filtrás y renderizás. Si filtrás directamente sobre el arreglo maestro, perdés los datos originales al primer filtro.
- Los templates HTML comentados dentro de `index.html` (buscá `<!-- ... -->` cerca de `.producto-card`, `.detail-header-info`, `.pedido-card`, etc.) son las clases CSS exactas que se esperan — copiarlos como template literal ahorra tener que adivinar nombres de clase.

**Estado observado:** las 4 soluciones siguen el mismo patrón `createElement('div') + innerHTML + appendChild`, incluida la app de Eventos, que en `renderizarHistorial()` usa en cambio `historialLista.innerHTML += ...` dentro del `forEach` — funciona, pero reconstruye todo el `innerHTML` del contenedor en cada iteración (más lento con listas largas que ir agregando nodos).

---

## Issue 4 — Filtrado, cálculo dinámico y modal

**Objetivo:** conectar los filtros/búsqueda, abrir el modal de detalle/compra y recalcular el precio total en tiempo real.

### Filtrado: dos estrategias válidas

| Estrategia | Dónde se usa | Cómo funciona |
|---|---|---|
| **Filtrar en el cliente** | Cafetería, Eventos, Mascotas | Se guarda el arreglo completo (`todosProductos`) y en cada evento (`change`/`input`) se hace `.filter()` sobre esa copia y se vuelve a renderizar. |
| **Re-consultar la API con query param** | GameHub | Al cambiar `#filtroPlataforma`, se llama de nuevo a `fetch(`/api/videojuegos?plataforma=${valor}`)` y se reemplaza `videojuegos` con la respuesta. |

Ambas son correctas; la de filtrar en cliente es más simple y no depende de que el backend soporte ese query param, pero requiere guardar la copia "maestra". La de re-fetch delega el trabajo al backend, a costa de un round-trip extra por cada cambio de filtro.

**Pro-tips de filtrado:**
- Búsqueda de texto: siempre comparar en minúsculas de los dos lados — `texto.toLowerCase().includes(query.toLowerCase())` — si no, `"Rock"` no matchea con `"rock"`.
- Si el valor del `<select>` es un slug (`"hip-hop-r-b"`) pero el dato viene con texto humano (`"Hip Hop / R&B"`), hay que normalizar antes de comparar. Eventos resuelve esto con `evento.genero.toLowerCase().replace(/[\s/]+/g, '-')` para generar el mismo slug que tienen las `<option>` — es un truco reutilizable cuando el filtro no viene con un `id` numérico limpio.
- Delegación de eventos: en vez de poner un listener por tarjeta (que hay que re-agregar cada vez que se repinta el grid), poné **un solo** listener en el contenedor y usá `e.target.closest('.btn-algo')` para identificar qué se clickeó. Los 4 proyectos usan este patrón en el grid y en el modal (`.cerrar-modal`).
- `dataset.id` **siempre es un string**, aunque el `id` original sea numérico. Si comparás `objeto.id === juego.id` después de leer `dataset.id`, comparás `number === string` y nunca da `true`. GameHub lo resuelve bien con `Number(juego.id)` antes de comparar en `buscarFavoritos`/`eliminarFavorito` — vale la pena repetir ese `Number(...)` en cualquier comparación que involucre un `data-id`.

### Cálculo dinámico del total

Fórmula en las 4 apps: `total = precioUnitario * cantidad`, recalculado en el evento `input`/`change` del campo de cantidad y otra vez al confirmar el formulario.

**Pro-tip:** los valores de `<input>` son siempre strings. `precio * cantidadInput.value` funciona igual porque `*` fuerza la coerción numérica automáticamente, pero es frágil: si en algún momento se concatena en vez de multiplicar (`+`), el resultado sale mal (`"10" + 2` → `"102"`, no `12`). Es buena costumbre envolver con `Number(...)` o `parseFloat(...)` apenas se lee el input, así el resto del código no depende de la coerción implícita.

**Estado observado — cosas puntuales para revisar:**

| Proyecto | Detalle |
|---|---|
| Cafetería | El listener de `input` en `#cantidadProducto` vuelve a hacer `await obtenerProductoPorId(productoSeleccionado)` (un fetch nuevo) en **cada tecla** para recalcular el total. Al producto ya se lo trajo `abrirModal()`; conviene guardarlo en una variable (`productoSeleccionado` como objeto, no solo el `id`) y reusarlo, en vez de repetir el fetch. |
| GameHub | El `<select>` de orden (`#ordenarCalificacion`) ordena con un comparador manual de 6 líneas por dirección; se puede simplificar a `videojuegos.sort((a, b) => (asc ? a.calificacion - b.calificacion : b.calificacion - a.calificacion))`. |
| Mascotas | Declara `const btnAdoptar = document.querySelectorAll('.btn-adoptar')` pero después nunca se usa (la apertura del modal se resuelve por delegación en `catalogoGrid`) — variable muerta, candidato a que ESLint (`no-unused-vars`, configurado como `warn`) se queje. |

---

## Issue 5 — Persistir en `localStorage`

**Objetivo:** guardar el pedido/compra/favorito/solicitud, recuperarlo al recargar la página y poder vaciarlo.

**Receta genérica:**

```js
const STORAGE_KEY = 'mi_clave';

function guardar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function cargar() {
  const raw = localStorage.getItem(STORAGE_KEY);
  lista = raw ? JSON.parse(raw) : [];
}

function limpiar() {
  localStorage.removeItem(STORAGE_KEY); // equivalente a localStorage.clear() si es la única key que usás
  lista = [];
  renderizar();
}
```

**Pro-tips:**
- `localStorage` solo guarda strings — `JSON.stringify` al guardar, `JSON.parse` al leer, siempre. Guardar un objeto sin `stringify` termina persistiendo el literal `"[object Object]"`.
- El patrón `raw ? JSON.parse(raw) : []` (usado tal cual en Mascotas) es el más corto para "si no hay nada guardado, arrancá con arreglo vacío" — evita el `if/else` de 4 líneas que aparece en Cafetería/GameHub.
- Definí la clave como una constante (`STORAGE_KEY`) una sola vez arriba del archivo y reusala en `guardar`/`cargar`/`limpiar`. GameHub es el único de los 4 que no lo hace: escribe el string literal `'gamehub_favoritos'` suelto en `guardarFavoritos`, `cargarFavoritos` y `limpiarFavoritos` — si algún día cambia la clave hay que tocar 3 lugares en vez de 1.
- Ojo con guardar **solo cuando el arreglo tiene elementos** (`if (pedidos.length > 0) localStorage.setItem(...)`, presente en Cafetería y Mascotas). Mientras la única forma de vaciar la lista sea `limpiarPedidos()` (que llama a `removeItem` directamente) no pasa nada, pero es un patrón frágil: si en el futuro se agrega, por ejemplo, "eliminar un pedido individual" y esa función queda en 0 elementos, el `if` de `guardarPedidos()` nunca vuelve a escribir el `localStorage` vacío y queda desincronizado con el arreglo en memoria. Más seguro: guardar siempre, sin el `if`.

**Estado observado (claves y contenedores):**

| Proyecto | Clave `localStorage` | Se guarda al... | Se lista en |
|---|---|---|---|
| Cafetería | `cafeteria_pedidos` | enviar `#formPedido` | `#pedidosLista` |
| Eventos | `eventos_compras` | enviar `#formCompra` | `#historialLista` |
| GameHub | `gamehub_favoritos` | click en `.btn-fav` (toggle agregar/quitar) | `#favoritosLista` |
| Mascotas | `adopcion_solicitudes` | enviar `#formAdopcion` | `#solicitudesLista` |

GameHub es el único caso donde persistir no es "guardar un formulario", sino un **toggle** (favorito/no favorito) — el patrón interesante ahí es `agregarFavorito(id)` que busca si ya existe (`buscarFavoritos`) y decide entre `push` o delegar en `eliminarFavorito`, todo en una sola función que atiende el mismo botón para ambos casos.

---

## 🧪 Verificación antes de entregar

Los 4 proyectos traen los mismos scripts de `npm` (ver `package.json` de cada carpeta):

```bash
npm test              # corre todos los checks del examen (scripts/classroom-check.sh)
npm run test:link     # solo issue 1
npm run test:fetch    # solo issue 2
npm run test:render   # solo issue 3
npm run test:events   # solo issue 4
npm run test:storage  # solo issue 5

npm run lint          # eslint (airbnb-base) + stylelint
npm run format:check  # prettier --check
```

Corré `npm run test:<issue>` después de cada entrega, no solo `npm test` al final — así identificás en qué issue puntual falló algo antes de hacer el commit con `Closes #N`.

## ✅ Reglas de estilo a tener presentes (ESLint `airbnb-base` + Prettier)

Las 4 apps comparten `.eslintrc.json` (`airbnb-base` + `prettier`) y `.prettierrc.js` (comillas simples, `printWidth: 100`, punto y coma obligatorio, coma final en objetos/arrays). Cosas de ese preset que aparecen resueltas (o rotas) en el código real:

- **`no-nested-ternary`**: un ternario dentro de otro tira error. Eventos lo necesita para 3 estados de disponibilidad (agotado / últimas entradas / disponible) y lo resuelve con `// eslint-disable-next-line no-nested-ternary` — válido como escape puntual, pero si se repite muy seguido es señal de que conviene una función auxiliar (`function estadoDisponibilidad(tickets) { ... }`) en vez de deshabilitar la regla.
- **`prefer-const`** (acá configurada como `warn`, no error): declarar con `let` una variable que nunca se reasigna genera warning. Revisar declaraciones de arreglos que se leen pero nunca mutan.
- **`no-unused-vars`** (`warn`): variables del DOM declaradas "por las dudas" y nunca usadas (como el `btnAdoptar` de Mascotas mencionado arriba) van a aparecer acá.

## 🔍 Referencia rápida cruzada

| | Cafetería | Eventos | GameHub | Mascotas |
|---|---|---|---|---|
| Filtro principal | `#filtroCategoria` (categoría) | `#filtroGenero` (género) | `#filtroPlataforma` (plataforma, vía re-fetch) | `#filtroEspecie` (especie) |
| Búsqueda de texto | `#inputBusqueda` (nombre) | `#inputBusqueda` (nombre + artista) | — (no tiene input de búsqueda) | — (no tiene input de búsqueda) |
| Cantidad / unidades | `#cantidadProducto` | `#cantidadEntradas` | — (no aplica) | — (no aplica) |
| Total dinámico | `#precioTotalCalculado` | `#totalPagar` | — (no aplica) | — (no aplica) |
| Formulario final | `#formPedido` | `#formCompra` | — (toggle de favorito, sin form) | `#formAdopcion` |
| Botón de limpiar | `#btnLimpiarPedidos` | `#btnLimpiarHistorial` | `#btnLimpiarFavoritos` | `#btnLimpiarSolicitudes` |
