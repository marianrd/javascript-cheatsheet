# Troubleshooting — Errores encontrados y cómo se arreglaron

Este documento registra los bugs reales que aparecieron mientras se desarrollaba `js/script.js` en este examen, su causa y la corrección aplicada. Sirve como guía para no repetir los mismos errores en los próximos parciales.

## 1. `propiedades.forEach is not a function`

**Causa:** en `init()` se llamaba a `obtenerPropiedades()` (una función `async`) sin `await`:
```js
propiedades = obtenerPropiedades(); // devuelve una Promise, no un array
```
Una función `async` siempre devuelve una `Promise`, aunque internamente haga `return`. Sin `await`, `propiedades` quedaba como una `Promise`, y las Promises no tienen `.forEach`.

**Fix:** agregar `await` antes de la llamada, dentro de una función `async`.
```js
propiedades = await obtenerPropiedades();
```

## 2. El filtro de tipo no filtraba visualmente

**Causa:** `renderizarPropiedades()` hacía `catalogoGrid.appendChild(entry)` por cada propiedad, pero nunca vaciaba `catalogoGrid` antes de volver a renderizar. Cada re-render **acumulaba** tarjetas en vez de reemplazarlas.

**Fix:** agregar `catalogoGrid.innerHTML = '';` al principio de la función, antes del `forEach`.

## 3. Ordenar por precio no actualizaba la pantalla

**Causa:** `aplicarFiltros()` ordenaba el array `propiedades` correctamente, pero no volvía a llamar a `renderizarPropiedades()` al final de la función.

**Fix:** agregar `renderizarPropiedades();` como última línea de `aplicarFiltros()`, y engancharle el listener `change` al `<select id="ordenarPrecio">` (no solo al de tipo).

## 4. El modal de detalle no se abría

**Causa:** `abrirModal()` armaba el HTML del detalle (`detalleContent.innerHTML = ...`) pero nunca le sacaba la clase `hidden` al contenedor `#modalDetalle`, que es la clase que lo oculta en el CSS (`.modal.hidden`).

**Fix:** agregar `modalDetalle.classList.remove('hidden')` en `abrirModal()`, y un listener sobre los botones `.cerrar-modal` que haga `modalDetalle.classList.add('hidden')` para cerrarlo.

## 5. Los botones de favorito (⭐) no respondían al click

**Causa doble:**
- El selector no coincidía con la clase real del botón: se buscaba `.btnFav` pero el botón tiene `class="btn-fav"`.
- Aunque el nombre estuviera bien, `document.querySelectorAll('.btn-fav')` se ejecutaba **una sola vez al cargar el script**, cuando el catálogo todavía estaba vacío (las tarjetas se crean después, dentro de `renderizarPropiedades()`, y se recrean en cada filtro/orden). La lista de botones quedaba "vieja" y vacía para siempre.

**Fix:** eliminar la búsqueda estática y usar **delegación de eventos** sobre un contenedor que sí existe desde el principio (`catalogoGrid`), detectando el click con `e.target.closest('.btn-fav')`. El mismo patrón se usó para abrir el modal al hacer click en una tarjeta.

## 6. Togglear favorito duplicaba en vez de sacar (y viceversa)

**Causa:** la condición estaba invertida:
```js
if (favoritos.filter(fav => fav.id === id).length > 0) {
  favoritos.push(propiedad);   // si YA está, lo agrega de nuevo
} else {
  favoritos = favoritos.filter(fav => fav.id !== id); // si NO está, lo "saca"
}
```

**Fix:** usar `Array.prototype.some()` para preguntar sí/no si ya es favorito, y dar vuelta la lógica:
```js
const yaEsFavorito = favoritos.some(fav => fav.id === Number(id));
if (yaEsFavorito) {
  favoritos = favoritos.filter(fav => fav.id !== Number(id)); // sacar
} else {
  favoritos.push(propiedad); // agregar
}
```

## 7. Comparación de IDs que nunca daba `true`

**Causa:** `id` viene de `dataset.id`, que **siempre** es un string (`"3"`), pero el `id` de las propiedades en `server/data/inmobiliaria.json` es un número (`3`). Con `===` (comparación estricta), `"3" === 3` es `false` siempre.

**Fix:** convertir el string a número con `Number(id)` antes de comparar.

## 8. La lista de favoritos guardados se duplicaba

**Causa:** `renderizarGuardadas()` no vaciaba `favoritosLista` antes de volver a renderizar (mismo bug que el punto 2, pero en la sección de favoritos).

**Fix:** agregar `favoritosLista.innerHTML = '';` al principio de la función.

## 9. La estrella no se pintaba al marcar favorito

**Causa:** `toggleFavorito()` guardaba el cambio (`guardarFavoritos()`, que solo re-renderiza la lista de guardados) pero nunca llamaba a `renderizarPropiedades()`. El catálogo, que es donde se decide si el botón se pinta (`esFavorito`), nunca se volvía a dibujar.

**Fix:** agregar `renderizarPropiedades();` al final de `toggleFavorito()` (y de `limpiarFavoritos()` y `eliminarFavorito()`, por el mismo motivo).

## 10. "Limpiar todo" no limpiaba el localStorage

**Causa:** las claves no coincidían entre funciones:
- `guardarFavoritos()` / `cargarFavoritos()` usaban el string literal `'favoritos'`.
- `limpiarFavoritos()` hacía `localStorage.removeItem(STORAGE_KEY)`, donde `STORAGE_KEY = 'inmobiliaria_favoritos'`.

Como son dos claves distintas, "Limpiar" borraba una clave que nunca se usó para guardar nada.

**Fix:** unificar todo para que use siempre la constante `STORAGE_KEY`, nunca strings sueltos escritos a mano.

## 11. Vaciar los favoritos hasta 0 no actualizaba el localStorage

**Causa:** `guardarFavoritos()` tenía una condición `if (favoritos.length > 0)` antes de guardar. Si sacabas tu último favorito, el array quedaba en `[]` pero nunca se pisaba el localStorage, así que el favorito viejo seguía ahí guardado.

**Fix:** sacar la condición y guardar siempre, sin importar el largo del array.

## 12. Eliminar un favorito desde la lista no se guardaba

**Causa:** `eliminarFavorito()` (el botón de basurita en "Mis Propiedades Guardadas") actualizaba la variable `favoritos` en memoria y re-renderizaba, pero nunca llamaba a `guardarFavoritos()` ni tocaba el localStorage. Al recargar la página, el favorito eliminado volvía a aparecer.

**Fix:** llamar a `guardarFavoritos()` dentro de `eliminarFavorito()`.

## 13. `sort()` mutaba el catálogo "maestro" (`todasPropiedades`)

**Causa:** en `init()`, `todasPropiedades = propiedades` no crea una copia, ambas variables apuntan **al mismo array**. `Array.prototype.sort()` ordena el array *en el lugar* (in place). Entonces, cuando no había filtro activo, `propiedades` y `todasPropiedades` eran el mismo array, y ordenar por precio reordenaba también el catálogo "original" para siempre — incluso si después elegías "Sin ordenar" de nuevo.

**Fix:** en `aplicarFiltros()`, trabajar siempre sobre una copia nueva con el operador spread:
```js
let resultado = [...todasPropiedades];
```
Regla general: cuando necesites una copia independiente de un array para no afectar el original, usá `[...array]` (o `array.slice()`), nunca una asignación directa (`=`), porque esa solo copia la referencia.

## 14. Faltaban los mensajes de "no hay resultados"

**Causa:** el HTML (comentarios en `index.html`) y el CSS (`.empty-state`) ya estaban preparados para mostrar un mensaje cuando el catálogo filtrado queda vacío o cuando no hay favoritos guardados, pero `script.js` nunca lo implementaba.

**Fix:** en `renderizarPropiedades()` y `renderizarGuardadas()`, si el array está vacío, mostrar `<p class="empty-state">...</p>` en vez de intentar iterar un array vacío.

---

## Patrones para recordar

- **Función `async` sin `await`** → te da una `Promise`, no el valor. Si necesitás el valor, `await` (y la función que lo contiene también tiene que ser `async`).
- **Re-render sin limpiar antes** → los elementos se acumulan en vez de reemplazarse. Siempre `contenedor.innerHTML = ''` antes de volver a llenarlo.
- **Botones creados dinámicamente** → nunca los busques con `querySelectorAll` una sola vez al principio del script. Usá **delegación de eventos**: un listener en el contenedor padre (que sí existe desde el arranque) + `e.target.closest('.clase')`.
- **Comparar IDs** → `dataset.id` siempre es string. Si el dato original es numérico, convertí con `Number()` antes de comparar con `===`.
- **Copiar arrays** → `variable = otroArray` copia la referencia, no el contenido. Para una copia real, `[...otroArray]` o `.slice()`. Importa especialmente antes de usar métodos que mutan en el lugar (`sort`, `reverse`, `splice`, `push`, `pop`).
- **Cambiar estado (favoritos, saldo, etc.) sin volver a renderizar** → el dato cambia en memoria pero la pantalla no se entera. Cada función que modifica estado debería terminar llamando a la función de render correspondiente.
- **Claves de `localStorage`** → definilas una sola vez como constante (`STORAGE_KEY`) y usá siempre esa constante, nunca un string escrito a mano en cada lugar — así no se desincronizan.
