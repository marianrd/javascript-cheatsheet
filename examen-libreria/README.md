# 📚 Examen de práctica — Librería Página Suelta

Modelo de práctica generado a partir de los 4 exámenes resueltos del repo (`examen-cafeteria`, `examen-eventos`, `examen-gamehub`, `examen-mascotas`). Sigue la misma mecánica: HTML/CSS y backend ya están armados, y `js/script.js` está vacío para que lo resuelvas vos, como en el examen real.

**No incluye búsqueda por texto** (el examen real tampoco la pide) — solo filtro por categoría.

## 🚀 Cómo levantarlo

```bash
cd examen-libreria
npm install
npm start          # levanta el server en :3000
# abrir index.html con Live Server
```

## 🗂 Datos del proyecto

|                    |                                             |
| ------------------ | ------------------------------------------- |
| Entidad principal  | `libros`                                    |
| Entidad de filtro  | `categorias`                                |
| Endpoint base      | `/api/libros`, `/api/categorias`            |
| Grid               | `#catalogoGrid`                             |
| Filtro             | `#filtroCategoria`                          |
| Modal              | `#modalDetalle`                             |
| Formulario         | `#formPedido` (cantidad + cliente)          |
| Total dinámico     | `#precioTotalCalculado` = precio × cantidad |
| Historial          | `#pedidosLista`                             |
| Botón de limpiar   | `#btnLimpiarPedidos`                        |
| `localStorage` key | `libreria_pedidos`                          |

## ✅ Checklist — 5 issues

### Issue 1 — Vincular `css/styles.css` y `js/script.js` en `index.html`

- [ ] `<link rel="stylesheet" href="css/styles.css">` dentro de `<head>`.
- [ ] `<script src="js/script.js">` vinculado, como módulo (`type="module"`) o con `defer`.

### Issue 2 — Consumir la API con `fetch` + `async/await`

- [ ] Traer el catálogo completo desde `GET /api/libros`.
- [ ] Traer las categorías desde `GET /api/categorias`.
- [ ] Manejar errores con `try...catch`, devolviendo `[]` en vez de propagar el `Error`.

### Issue 3 — Renderizar catálogo y select de categorías en el DOM

- [ ] Pintar las tarjetas `.libro-card` en `#catalogoGrid` (ver plantilla comentada en `index.html`).
- [ ] Poblar las `<option>` de `#filtroCategoria` a partir de `categorias`.
- [ ] Guardar una copia "maestra" del catálogo (`todosLibros`) separada de la "de trabajo" (`libros`).

### Issue 4 — Filtrado y modal con cálculo dinámico

- [ ] Al cambiar `#filtroCategoria`, filtrar `todosLibros` por categoría y re-renderizar.
- [ ] Al hacer click en una tarjeta (`.btn-ordenar` o la tarjeta), abrir `#modalDetalle` con el detalle del libro (`GET /api/libros/:id`).
- [ ] Recalcular `#precioTotalCalculado` cada vez que cambia `#cantidadLibro` (evento `input`), y de nuevo al enviar `#formPedido`.
- [ ] Usar delegación de eventos: un solo listener en `#catalogoGrid`, no uno por tarjeta.

### Issue 5 — Persistir pedidos en `localStorage`

- [ ] Al enviar `#formPedido`, guardar `{ libroTitulo, cantidad, cliente, total, fecha }` en un array y persistirlo con `JSON.stringify` bajo la clave `libreria_pedidos`.
- [ ] Al cargar la página, leer `localStorage` con `JSON.parse` y listar los pedidos en `#pedidosLista`.
- [ ] `#btnLimpiarPedidos` debe vaciar el array y hacer `localStorage.removeItem('libreria_pedidos')`.

## 🧪 Antes de dar por terminado

```bash
npm run lint          # eslint (airbnb-base) + stylelint
npm run format:check  # prettier --check
```

Si te trabás en algún paso, `README.md` del repo raíz tiene la receta genérica y los errores típicos de cada issue (issue por issue, con ejemplos reales de los 4 exámenes ya resueltos).
