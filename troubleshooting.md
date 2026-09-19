# Troubleshooting — Mis errores comunes y cómo arreglarlos

Guía personal de los bugs que se repiten en mis exámenes de JS Vanilla + fetch + DOM + `localStorage`. No es teoría genérica: cada patrón salió de un bug real que cometí (la primera vez fue en `examen-inmobiliaria`), así que están ordenados por cómo se **sienten** cuando los pisás — el síntoma primero, la causa después.

Antes de pedir ayuda o rendirte con un bug nuevo, repasá esta lista. Casi siempre es una de estas.

---

## 1. `X.forEach is not a function` / `X.map is not a function`

**Síntoma:** un array que "debería" tener datos tira este error apenas lo recorrés.

**Causa de fondo:** llamé a una función `async` **sin `await`**. Una función `async` siempre devuelve una `Promise`, aunque adentro tenga `return arrayDeVerdad`. Sin `await`, la variable queda apuntando a la `Promise`, no al array — y las Promises no tienen `.forEach`.

```js
// mal
propiedades = obtenerPropiedades();

// bien (y la función que lo contiene tiene que ser async)
propiedades = await obtenerPropiedades();
```

**Chequeo rápido:** si una variable sale de una función `async`, ¿tiene `await` adelante? ¿La función que la contiene está marcada `async`?

---

## 2. "Filtro/ordeno y no pasa nada en pantalla" (pero el array sí cambió)

Dos causas distintas dan el mismo síntoma — revisá las dos.

**2a. Re-render sin limpiar antes.** Si tu función de renderizado hace `contenedor.appendChild(...)` sin vaciar el contenedor primero, cada re-render **acumula** en vez de reemplazar. Visualmente parece que "no filtra" (siguen apareciendo los viejos) o que hay duplicados.

```js
function renderizar() {
    contenedor.innerHTML = '';   // <- sin esto, se acumula
    datos.forEach(...)
}
```

**2b. Te olvidaste de llamar a la función de render.** Cambiaste el array (filtraste, ordenaste, togglaste un favorito) pero la función que hace el `if`/`else`/cálculo nunca llama a `renderizar...()` al final. El dato cambió en memoria, la pantalla no se enteró.

**Chequeo rápido:** cualquier función que modifica un array de estado (`propiedades`, `favoritos`, `movimientos`, etc.) debería terminar llamando a su función de render correspondiente — y cualquier función de render debería empezar vaciando su contenedor.

---

## 3. Un modal/dropdown/panel "no abre" aunque el contenido se generó bien

**Causa:** generé el HTML interno (`contenido.innerHTML = ...`) pero me olvidé de sacarle la clase que lo oculta (`hidden`, `display:none`, etc.) al contenedor visible. El contenido está ahí, listo, pero el elemento sigue tapado por CSS.

```js
async function abrirModal(id) {
    modal.classList.remove('hidden');   // <- esto es lo que "abre"
    const datos = await obtenerDatos(id);
    contenido.innerHTML = `...`;
}
```

**Chequeo rápido:** buscá en el CSS qué clase controla la visibilidad de ese elemento (`.hidden`, `.oculto`, `.active`...) y verificá que el JS explícitamente se la saque/agregue en los momentos correctos (abrir Y cerrar).

---

## 4. Un botón que se crea dinámicamente "no responde" al click

**Causa doble, casi siempre las dos juntas:**
- El selector CSS está mal escrito (`.btnFav` vs `.btn-fav`, mayúsculas, guion vs camelCase).
- Busqué los botones con `document.querySelectorAll('.clase')` **una sola vez, al cargar el script** — antes de que esos botones existan (se crean recién dentro de una función de render que corre después, y se recrean en cada re-render). Esa lista queda vieja y vacía para siempre; agregarle `.forEach(btn => btn.addEventListener(...))` no sirve si la lista está vacía o si se vuelven a crear los botones después.

**Fix — delegación de eventos:** en vez de buscar cada botón individual, enganchá **un solo listener en el contenedor padre** (que sí existe desde el arranque) y detectá el click con `closest()`:

```js
contenedor.addEventListener('click', (e) => {
    const boton = e.target.closest('.btn-fav');
    if (boton) {
        const id = boton.dataset.id;
        toggleFavorito(id);
    }
});
```

**Chequeo rápido:** si el elemento se crea dentro de un template literal / `innerHTML`, su listener casi seguro tiene que ir por delegación, no por `querySelectorAll` directo.

---

## 5. Comparación de IDs que da `false` cuando "debería" dar `true`

**Causa:** `elemento.dataset.algo` **siempre devuelve un string**, aunque el atributo `data-id="3"` "parezca" un número. Si el dato original (el que viene del JSON/API) es numérico, `===` los compara estrictamente y `"3" === 3` da `false` siempre.

```js
const id = boton.dataset.id;               // "3" (string)
favoritos.some(fav => fav.id === id)        // false aunque exista
favoritos.some(fav => fav.id === Number(id)) // bien
```

**Chequeo rápido:** cuando compares un `id` que salió de `dataset` contra un `id` que salió de una API/JSON, convertí con `Number()` de un lado antes del `===`.

---

## 6. Lógica de "toggle" (agregar/sacar) que queda al revés

**Causa:** usar `.filter(...).length > 0` para preguntar "¿ya está?" es fácil de escribir con la condición invertida sin darte cuenta, porque `filter` te devuelve un array (que hay que interpretar), no un booleano directo.

```js
// confuso y fácil de invertir sin querer
if (favoritos.filter(fav => fav.id === id).length > 0) { ... }

// más claro: some() te da directamente sí/no
const yaEsta = favoritos.some(fav => fav.id === id);
if (yaEsta) {
    favoritos = favoritos.filter(fav => fav.id !== id); // sacar
} else {
    favoritos.push(item); // agregar
}
```

**Chequeo rápido:** para preguntas de sí/no sobre un array, usá `.some()` (¿hay alguno?) o `.every()` (¿todos cumplen?), no `.filter(...).length`. Reservá `.filter()` para cuando de verdad querés el subconjunto.

---

## 7. Una acción (togglear, eliminar, limpiar) "funciona" pero no sobrevive a un F5

**Causa:** la función cambia la variable en memoria y re-renderiza, pero se olvida de escribir en `localStorage`. Visualmente todo se ve bien hasta que recargás la página y vuelve el estado viejo.

**Chequeo rápido — toda función que modifica un estado que "debería" persistir** (favoritos, saldo, movimientos, carrito) tiene que terminar en algo como:
```js
localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
```
Si hay una función tipo `guardarX()` centralizada, cualquier función nueva que toque ese estado (agregar, sacar, limpiar, editar) tiene que llamarla — es fácil agregar una función nueva (ej. "eliminar desde la lista") y olvidarse de este paso porque "ya andaba" visualmente.

---

## 8. `localStorage` "no se limpia" o "no carga lo que guardé"

**Causa:** usé la clave de storage escrita a mano en más de un lugar, y en alguno la tipeé distinta (`'favoritos'` en un lado, `'app_favoritos'` en otro). Guardar y leer/borrar terminan operando sobre keys distintas sin ningún error visible.

**Fix:** definir la clave **una sola vez** como constante arriba del archivo y usar siempre esa constante, nunca un string suelto:
```js
const STORAGE_KEY = 'app_favoritos';
// guardar
localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
// leer
JSON.parse(localStorage.getItem(STORAGE_KEY));
// borrar
localStorage.removeItem(STORAGE_KEY);
```

---

## 9. Un array "maestro" se desordena o pierde datos solo

**Causa:** `arrayB = arrayA` no copia el array, copia la **referencia** — ambas variables apuntan al mismo array en memoria. Si después le aplicás un método que muta en el lugar (`sort()`, `reverse()`, `splice()`, `push()`, `pop()`) a cualquiera de las dos, se altera también la otra, aunque nunca la hayas tocado "directamente".

```js
todasPropiedades = propiedades;   // mismo array, no una copia
propiedades = propiedades.sort(...) // esto también reordena todasPropiedades
```

**Fix:** cuando necesites una copia independiente para no afectar el original, usá spread o `.slice()`:
```js
let copia = [...arrayOriginal];
```

**Chequeo rápido:** antes de usar `sort`, `reverse`, `splice`, `push` o `pop` sobre una variable, preguntate: ¿esta variable es una copia real, o solo un alias de otra que quiero conservar intacta?

---

## 10. Falta un caso "vacío" (sin resultados, sin favoritos, sin datos)

**Causa:** la función de render solo contempla el caso "hay elementos" (`forEach`). Si el array queda en `[]` (filtro sin coincidencias, lista recién vaciada), no se muestra nada — ni el catálogo ni un mensaje, lo cual confunde porque parece que la página está rota.

**Fix:** chequear el largo antes de iterar:
```js
function renderizar() {
    contenedor.innerHTML = '';
    if (datos.length === 0) {
        contenedor.innerHTML = '<p class="empty-state">No hay resultados.</p>';
        return;
    }
    datos.forEach(...)
}
```

**Chequeo rápido:** ¿el HTML/CSS ya tiene una clase tipo `.empty-state` preparada y sin usar? Suele ser una pista de que el enunciado espera este caso.

---

## 11. Una función de "guardar" con condiciones que no deberían estar ahí

**Síntoma:** guardás algo, después lo vaciás/eliminás, y `localStorage` se queda con datos viejos que ya no existen en memoria.

**Causa:** la función de guardado tiene un `if` de más, tipo `if (datos.length > 0) { localStorage.setItem(...) }`. La intención parece razonable ("no guardar si no hay nada"), pero en realidad hace lo contrario de lo que se necesita: si el array pasa a estar vacío, esa condición impide que `localStorage` se actualice para reflejar el vacío.

```js
// mal: no persiste cuando el array queda en []
function guardar() {
    if (datos.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    }
}

// bien: siempre refleja el estado actual, sea cual sea
function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
}
```

**Chequeo rápido:** una función que persiste estado no debería tener lógica condicional sobre *cuándo* guardar — solo debería reflejar fielmente lo que hay en memoria en ese momento. `JSON.stringify([])` es válido y es exactamente lo que querés guardar cuando el array está vacío.

---

## 12. Pedir por `fetch` un dato que ya tenés

**Síntoma:** cada vez que el usuario interactúa con algo (tipea una cantidad, confirma un formulario), el Network tab muestra un request nuevo pidiendo el mismo recurso que ya se había pedido segundos antes.

**Causa:** en vez de guardar el resultado de un `fetch` anterior en una variable, se lo vuelve a pedir a la API cada vez que se lo necesita — por ejemplo, volver a hacer `obtenerLibroPorId(id)` dentro del cálculo del total Y de nuevo dentro del `submit`, cuando ese mismo libro ya se había traído al abrir el modal.

```js
// mal: refetchea el mismo libro en cada evento
async function calcularPrecio() {
    const libro = await obtenerLibroPorId(idAbierto);
    total.textContent = `$${libro.precio * cantidad.value}`;
}

// bien: se guarda una vez, al abrir, y se reutiliza
let itemActual = null;

async function abrirModal(id) {
    itemActual = await obtenerLibroPorId(id);
    // ...
}

function calcularPrecio() {
    total.textContent = `$${itemActual.precio * cantidad.value}`;
}
```

**Chequeo rápido:** si dos funciones distintas necesitan el mismo dato que viene de un `fetch`, guardalo en una variable a nivel de módulo cuando lo obtengas la primera vez, y que las demás lean esa variable en vez de volver a pedirlo. Reservá el `fetch` repetido para cuando el dato realmente puede haber cambiado en el servidor.

---

## Nota personal — repetir errores ya documentados

Varios de los bugs de arriba (el alias de array del punto 9, la condición de más del punto 11, los empty states del punto 10) **ya estaban escritos en este mismo documento** cuando los volví a cometer en el examen siguiente. Tenerlos documentados no alcanza si no los reviso activamente antes de decir "terminé" — por eso el checklist de abajo está pensado para repasarse **a propósito**, línea por línea, contra el código real, no de memoria.

---

## Checklist rápido antes de decir "está terminado"

- [ ] ¿Toda función `async` que llamo tiene `await` delante?
- [ ] ¿Toda función de render vacía su contenedor (`innerHTML = ''`) antes de repoblarlo?
- [ ] ¿Toda función que cambia estado termina llamando a la función de render correspondiente?
- [ ] ¿Los botones creados dinámicamente usan delegación de eventos, no `querySelectorAll` estático?
- [ ] ¿Comparo `dataset.id` (string) contra ids numéricos sin convertir con `Number()`?
- [ ] ¿Toda función que modifica estado persistente también escribe en `localStorage`, usando siempre la misma constante de clave?
- [ ] ¿Alguna variable es sin querer un alias de otra (`b = a`) que después mutás con `sort`/`push`/`splice`?
- [ ] ¿Contemplé el caso de lista vacía en cada render?
- [ ] ¿Alguna función de guardado tiene un `if` que le impide persistir cuando el estado queda vacío?
- [ ] ¿Estoy re-pidiendo por `fetch` un dato que ya obtuve antes y podría guardar en una variable?
- [ ] ¿Corrí `npm run lint` **y** `npm run format:check` (no solo uno de los dos)?
