# Paso a paso

## 1. Vincular CSS y JS

Lo primero, siempre, es abrir el `index.html` y confirmar (o agregar si falta) los dos links en el lugar correcto: la hoja de estilos va dentro del `<head>`, y el script va justo antes de cerrar el `</body>` — nunca dentro del `<head>`, porque si el script se ejecuta antes de que el HTML termine de cargar, `document.querySelector` no va a encontrar nada todavía.

```js
<head>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  ...
  <script src="js/script.js"></script>
</body>
```

Este paso normalmente ya viene resuelto en el archivo de inicio, pero conviene confirmarlo antes de asumir que el resto va a funcionar.

## 2. La URL base de la API

Después abro el `js/script.js` y lo primero que escribo es la constante con la dirección del servidor, revisando siempre el `server.js` real para saber si el `/api` va incluido ahí o lo agrego después en cada fetch:

```js
const API_URL = 'http://localhost:3000';
```

## 3. Las funciones que traen los datos

Con la URL base lista, armo una función por cada endpoint que el README menciona con GET. Todas siguen exactamente la misma receta: son `async`, hacen `fetch`, esperan la respuesta con `await`, y devuelven el JSON. Si hay un endpoint para "todos" y otro para "uno por id" (que casi siempre existe, para el modal), armo las dos por separado. Y siempre las envuelvo en `try/catch`, devolviendo un array vacío `[]` cuando la función trae varios elementos, o `null` cuando trae uno solo — nunca dejo que el objeto de error se cuele como si fuera un dato real, porque eso rompe cualquier `forEach` o `.find()` que venga después.

```js
async function obtenerCatalogo() {
  try {
    const res = await fetch(`${API_URL}/api/loquesea`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerCatalogoPorId(id) {
  try {
    const res = await fetch(`${API_URL}/api/loquesea/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

Y repito el mismo molde para el segundo catálogo (plataformas, especies, categorías, lo que sea que use el `<select>` de filtro).

## 4. Las const del DOM, el estado global y la clave

Ahora recorro el `index.html` buscando cada `id` que voy a necesitar tocar, y declaro una constante por cada uno con `document.querySelector`. Justo después, declaro las variables que van a cambiar con el tiempo mientras la página está abierta — estas van con `let`, nunca con `const`, porque más adelante alguna función las va a reasignar:

```js
let catalogoCompleto = [];
let catalogoFiltrado = [];
let categorias = [];
let guardados = [];
let elementoActual = null;

const CLAVE = 'la-clave-exacta-que-dice-el-readme';
```

Ojo con esto: si declaro `catalogoFiltrado` con `const` porque en ese momento todavía no escribí la función que la reasigna, el linter capaz me la "arregla" solo a `const` — y ahí me tira error apenas escribo `catalogoFiltrado = algo` más adelante. Cuando eso pase, la vuelvo a poner en `let` a mano.

## 5. Renderizar los dos catálogos principales

Con las funciones de traer datos y las const del DOM listas, armo las dos funciones de renderizado más importantes, las que van a mostrar el catálogo completo apenas carga la página. Una recorre el array de items y arma una tarjeta por cada uno (ya sea con `createElement` elemento por elemento, o con un template literal armando el HTML de una, según qué tan compleja sea la tarjeta). La otra llena el `<select>` de filtro con una `<option>` por cada categoría.

```js
function renderizarItems(lista) {
  contenedorGrid.innerHTML = '';
  lista.forEach((item) => {
    const tarjeta = document.createElement('div');
    tarjeta.innerHTML = `...`; // el HTML de la tarjeta, con ${item.campo}
    contenedorGrid.appendChild(tarjeta);
  });
}

function renderizarCategorias(lista) {
  lista.forEach((categoria) => {
    const opcion = document.createElement('option');
    opcion.value = categoria.id;
    opcion.textContent = categoria.nombre;
    selectFiltro.appendChild(opcion);
  });
}
```

En este punto todavía no las llamo desde ningún lado — quedan armadas y listas para usarse más adelante.

## 6. Acá es donde se complica: la delegación de eventos para abrir el modal

Como las tarjetas se crean recién cuando corre `renderizarItems`, no puedo ponerles un `addEventListener` directo en el momento de crearlas de forma prolija — mejor pongo un solo listener en el contenedor grande (el grid), que ya existe desde que carga la página, y desde ahí reviso en qué parte específica se hizo click.

Si dentro de la tarjeta hay más de un elemento clickeable (por ejemplo, un botón de favorito adentro de la tarjeta, y la tarjeta entera también abre el modal), tengo que revisar primero el elemento más específico — si coincide, actúo y corto con `return` para no seguir de largo. Recién si no era ese, reviso el contenedor general:

```js
contenedorGrid.addEventListener('click', async (e) => {
  const botonEspecial = e.target.closest('.clase-del-boton-especial');
  if (botonEspecial) {
    hacerAlgoConEseBoton(botonEspecial.dataset.id);
    return;
  }

  const tarjeta = e.target.closest('.clase-de-la-tarjeta');
  if (tarjeta) {
    await abrirModal(tarjeta.dataset.id);
  }
});
```

Y la función que abre el modal en sí, que pide el detalle completo por id, lo guarda en la variable de "elemento actual", pinta el contenido dentro del modal, y le saca la clase que lo tiene oculto:

```js
async function abrirModal(id) {
  modal.classList.remove('hidden');
  const item = await obtenerCatalogoPorId(id);
  if (!item) {
    contenedorDetalle.innerHTML = '<p>No se pudo cargar.</p>';
    return;
  }
  elementoActual = item;
  contenedorDetalle.innerHTML = `...`; // el detalle completo, con ${item.campo}
}
```

## 7. El filtro

Armo una función que lee lo que el usuario eligió en el `<select>`, y con eso filtra el array completo (nunca el ya filtrado de antes, siempre parto del array original guardado sin tocar), y vuelve a renderizar:

```js
function aplicarFiltros() {
  const valorElegido = selectFiltro.value;

  catalogoFiltrado = catalogoCompleto.filter((item) => {
    return !valorElegido || item.campo === valorElegido;
  });

  renderizarItems(catalogoFiltrado);
}

selectFiltro.addEventListener('change', aplicarFiltros);
```

## 8. El ordenamiento, si el README lo pide

No todos los exámenes lo tienen (Mascotas no lo tenía, GameHub sí). Si aparece, es una función parecida al filtro, pero usando `.sort()`, que compara de a 2 elementos y devuelve negativo/positivo/cero para decidir el orden:

```js
function ordenarItems() {
  const orden = selectOrden.value;

  if (orden === 'asc') {
    catalogoFiltrado.sort((a, b) => a.campoNumerico - b.campoNumerico);
  } else if (orden === 'desc') {
    catalogoFiltrado.sort((a, b) => b.campoNumerico - a.campoNumerico);
  }

  renderizarItems(catalogoFiltrado);
}

selectOrden.addEventListener('change', ordenarItems);
```

## 9. Las funciones de localStorage

Tres funciones chicas y siempre iguales: una que lee lo guardado (o devuelve vacío si nunca se guardó nada), una que guarda el array actual, y una que borra todo y limpia la variable:

```js
function cargarGuardados() {
  const dato = localStorage.getItem(CLAVE);
  guardados = dato ? JSON.parse(dato) : [];
}

function guardarEnStorage() {
  localStorage.setItem(CLAVE, JSON.stringify(guardados));
}

function limpiarGuardados() {
  localStorage.removeItem(CLAVE);
  guardados = [];
  renderizarHistorial();
}
```

## 10. La acción principal que agrega algo a esa lista

Acá se separan dos caminos, según lo que pida el examen. Si hay un formulario donde el usuario completa datos (como en Mascotas), armo el `submit`, que arranca siempre con `preventDefault`, arma el objeto con exactamente los campos que pide el README, lo agrega al array, guarda, cierra el modal y resetea el form:

```js
formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!elementoActual) return;

  const nuevoRegistro = {
    id: elementoActual.id,
    campoA: elementoActual.algo,
    campoB: inputAlgo.value,
    fecha: new Date().toLocaleDateString(),
  };

  guardados.push(nuevoRegistro);
  guardarEnStorage();
  modal.classList.add('hidden');
  formulario.reset();
  elementoActual = null;
  renderizarHistorial();
});
```

Si en cambio es una acción de un solo click sin formulario (como marcar favorito en GameHub), armo un `toggle`, que revisa si ya estaba guardado con `.some()`, y según eso lo saca con `.filter()` o lo agrega con `.push()`:

```js
function toggleGuardado(id) {
  const yaEstaba = guardados.some((g) => g.id === id);

  if (yaEstaba) {
    guardados = guardados.filter((g) => g.id !== id);
  } else {
    const item = catalogoCompleto.find((i) => i.id === id);
    guardados.push({ id: item.id, nombre: item.nombre });
  }

  guardarEnStorage();
  renderizarItems(catalogoFiltrado);
  renderizarHistorial();
}
```

## 11. Renderizar la lista de guardados

Mismo molde de siempre: vacío el contenedor, recorro el array, y por cada uno creo un elemento con los datos que pide mostrar el README.

```js
function renderizarHistorial() {
  listaGuardados.innerHTML = '';
  guardados.forEach((g) => {
    const entry = document.createElement('div');
    entry.innerHTML = `...`;
    listaGuardados.appendChild(entry);
  });
}
```

## 12. Cerrar el modal y el botón de limpiar

El cierre de modal es genérico, se copia prácticamente igual en cualquier examen que tenga la clase `.cerrar-modal`:

```js
document.querySelectorAll('.cerrar-modal').forEach((boton) => {
  boton.addEventListener('click', () => {
    boton.closest('.modal').classList.add('hidden');
  });
});

btnLimpiar.addEventListener('click', limpiarGuardados);
```

## 13. Por último, la función que junta todo al arrancar

Acá es donde el orden en que llamo a cada cosa sí importa de verdad, aunque las funciones ya estén todas escritas de antes. Primero cargo lo guardado en `localStorage` (porque el renderizado de las tarjetas puede necesitar saber si algo ya está marcado como favorito, por ejemplo). Después pido los datos a la API con `await`. Recién con todo eso disponible, renderizo las tarjetas y las categorías. Y al final, renderizo también la lista de guardados.

```js
async function iniciar() {
  cargarGuardados();

  catalogoCompleto = await obtenerCatalogo();
  catalogoFiltrado = catalogoCompleto;
  categorias = await obtenerCategorias();

  renderizarItems(catalogoFiltrado);
  renderizarCategorias(categorias);
  renderizarHistorial();
}

iniciar();
```

Ese es el recorrido completo, de punta a punta, tal como lo aplicamos hoy tanto en Mascotas como en GameHub — el orden que vos mismo propusiste estaba bien pensado, la única corrección real es la del paso 13: `cargarGuardados()` va antes de renderizar, no al final.

### 2. "¿El ordenamiento de GameHub me sirve para otras cosas, cambiando las variables?"

Sí, exactamente — es una comparación genérica, y el molde se reusa siempre igual, solo cambiando qué campo comparás:

```js
array.sort((a, b) => a.CAMPO - b.CAMPO); // ascendente
array.sort((a, b) => b.CAMPO - a.CAMPO); // descendente
```

Esto funciona para cualquier campo numérico que tenga el objeto — no solo calificación. Por ejemplo, si otro examen te pide ordenar por precio, por año, por edad, por cantidad de stock — es literalmente el mismo molde, cambiando a.calificacion por a.precio, a.año, a.edad, lo que sea.

Un detalle extra, que puede aparecer: si en vez de un número tuvieras que ordenar por texto (por ejemplo, alfabéticamente por nombre), la resta (a.campo - b.campo) no funciona con strings — ahí se usa .localeCompare() en su lugar:

```js
array.sort((a, b) => a.nombre.localeCompare(b.nombre)); // alfabético A→Z
array.sort((a, b) => b.nombre.localeCompare(a.nombre)); // alfabético Z→A
```

Pero mientras el campo sea numérico (calificación, precio, edad, año, cantidad), tu molde de la resta sirve tal cual, sin cambiar nada más que el nombre del campo.
