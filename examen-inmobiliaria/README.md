# 🏠 Examen de práctica — Inmobiliaria Vivienda Ideal

Modelo de práctica generado a partir de los 4 exámenes resueltos del repo (`examen-cafeteria`, `examen-eventos`, `examen-gamehub`, `examen-mascotas`). Sigue la misma mecánica: HTML/CSS y backend ya están armados, y `js/script.js` está vacío para que lo resuelvas vos, como en el examen real.

**No incluye búsqueda por texto** (el examen real tampoco la pide) — solo filtro por tipo y orden por precio, más un toggle de favoritos (sin formulario), como en `examen-gamehub`.

## 🚀 Cómo levantarlo

```bash
cd examen-inmobiliaria
npm install
npm start          # levanta el server en :3000
# abrir index.html con Live Server
```

## 🗂 Datos del proyecto

|                    |                                                |
| ------------------ | ---------------------------------------------- |
| Entidad principal  | `propiedades`                                  |
| Entidad de filtro  | `tipos`                                        |
| Endpoint base      | `/api/propiedades`, `/api/tipos`               |
| Grid               | `#catalogoGrid`                                |
| Filtro             | `#filtroTipo` + `#ordenarPrecio`               |
| Modal              | `#modalDetalle` (solo detalle, sin formulario) |
| Toggle de favorito | botón `.btn-fav` en cada tarjeta               |
| Historial          | `#favoritosLista`                              |
| Botón de limpiar   | `#btnLimpiarFavoritos`                         |
| `localStorage` key | `inmobiliaria_favoritos`                       |

## ✅ Checklist — 5 issues

### Issue 1 — Vincular `css/styles.css` y `js/script.js` en `index.html`

- [ ] `<link rel="stylesheet" href="css/styles.css">` dentro de `<head>`.
- [ ] `<script src="js/script.js">` vinculado, como módulo (`type="module"`) o con `defer`.

### Issue 2 — Consumir la API con `fetch` + `async/await`

- [ ] Traer el catálogo completo desde `GET /api/propiedades`.
- [ ] Traer los tipos desde `GET /api/tipos`.
- [ ] Manejar errores con `try...catch`, devolviendo `[]` en vez de propagar el `Error`.

### Issue 3 — Renderizar catálogo y select de tipos en el DOM

- [ ] Pintar las tarjetas `.propiedad-card` en `#catalogoGrid` (ver plantilla comentada en `index.html`).
- [ ] Poblar las `<option>` de `#filtroTipo` a partir de `tipos`.
- [ ] Guardar una copia "maestra" del catálogo (`todasPropiedades`) separada de la "de trabajo" (`propiedades`).

### Issue 4 — Filtrado, orden y modal de detalle

- [ ] Al cambiar `#filtroTipo` u `#ordenarPrecio`, recalcular `propiedades` sobre `todasPropiedades` y re-renderizar (cuidado con no perder un filtro al aplicar el otro).
- [ ] Al hacer click en una tarjeta (pero no en `.btn-fav`), abrir `#modalDetalle` con el detalle (`GET /api/propiedades/:id`).
- [ ] Al hacer click en `.btn-fav`, togglear el favorito sin abrir el modal.
- [ ] Usar delegación de eventos: un solo listener en `#catalogoGrid`, no uno por tarjeta. Ojo con `dataset.id`: siempre es string, convertilo con `Number(...)` antes de comparar contra un `id` numérico.

### Issue 5 — Persistir favoritos en `localStorage`

- [ ] Al click en `.btn-fav`, agregar o quitar la propiedad del array `favoritos` (toggle) y persistirlo con `JSON.stringify` bajo la clave `inmobiliaria_favoritos`.
- [ ] Al cargar la página, leer `localStorage` con `JSON.parse` y listar los favoritos en `#favoritosLista`, marcando como activas (`.active`) las tarjetas correspondientes.
- [ ] `#btnLimpiarFavoritos` debe vaciar el array y hacer `localStorage.removeItem('inmobiliaria_favoritos')`.

## 🧪 Antes de dar por terminado

```bash
npm run lint          # eslint (airbnb-base) + stylelint
npm run format:check  # prettier --check
```

Si te trabás en algún paso, `README.md` del repo raíz tiene la receta genérica y los errores típicos de cada issue (issue por issue, con ejemplos reales de los 4 exámenes ya resueltos, incluido el patrón de favoritos con toggle en `examen-gamehub`).
