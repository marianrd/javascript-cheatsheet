const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'cafeteria_pedidos';

const filtroCategoria = document.getElementById('filtroCategoria');
const inputBusqueda = document.getElementById('inputBusqueda');
const catalogoGrid = document.getElementById('catalogoGrid');
const modalDetalle = document.getElementById('modalDetalle');
const detalleContent = document.getElementById('detalleContent');
const formPedido = document.getElementById('formPedido');
const cantidadProducto = document.getElementById('cantidadProducto');
const inputCliente = document.getElementById('inputCliente');
const inputNotas = document.getElementById('inputNotas');
const precioTotalCalculado = document.getElementById('precioTotalCalculado');
const pedidosLista = document.getElementById('pedidosLista');
const btnLimpiarPedidos = document.getElementById('btnLimpiarPedidos');
const btnCerrarModal = document.querySelectorAll('.cerrar-modal');

let productos = [];
let todosProductos = [];
let categorias = [];

let pedidos = [];
let productoActual = null;

async function obtenerProductos() {
  try {
    const response = await fetch(`${API_URL}/api/productos`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerProductoPorId(id) {
  try {
    const response = await fetch(`${API_URL}/api/productos/${id}`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function obtenerCategorias() {
  try {
    const response = await fetch(`${API_URL}/api/categorias`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function renderizarProductos() {
  catalogoGrid.innerHTML = '';
  productos.forEach((producto) => {
    const entry = document.createElement('div');
    entry.innerHTML = `
        <div class="producto-card" data-id="${producto.id}">
            <div class="card-image-wrap">
              <img src="${producto.imagen}" alt="${producto.nombre}" class="card-image" />
              <span class="card-cat-badge">${producto.categoriaNombre}</span>
              <span class="card-price-badge">$${producto.precioBase}</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">${producto.nombre}</h3>
              <p class="card-origin"><i class="fas fa-map-marker-alt"></i> ${producto.origenGrano}</p>
              <p class="card-description">${producto.descripcion}</p>
              <div class="card-tags">
                ${producto.notasCata.map((nota) => `<span class="tag">${nota}</span>`).join('')}
              </div>
              <button type="button" class="btn-primary btn-ordenar" data-id="${producto.id}">
                <i class="fas fa-mug-hot"></i> Ordenar Producto
              </button>
            </div>
          </div>
        `;
    catalogoGrid.append(entry);
  });
}

function renderizarCategorias() {
  categorias.forEach((categoria) => {
    const entry = document.createElement('option');
    entry.value = categoria.id;
    entry.textContent = categoria.nombre;
    filtroCategoria.appendChild(entry);
  });
}

async function abrirModal(id) {
  modalDetalle.classList.remove('hidden');
  const producto = await obtenerProductoPorId(id);
  if (!producto) {
    detalleContent.innerHTML = '<p>No se pudo cargar el producto. Intentá nuevamente.</p>';
    return;
  }
  productoActual = producto;
  cantidadProducto.value = 1;
  detalleContent.innerHTML = `
      <div class="detail-header-info" data-id="${producto.id}" data-precio-base="${producto.precioBase}">
              <img src="${producto.imagen}" alt="${producto.nombre}" class="detail-img" />
              <div>
                <span class="card-cat-badge">${producto.categoriaNombre}</span>
                <h3 class="card-title">${producto.nombre}</h3>
                <p class="card-origin"><i class="fas fa-map-marker-alt"></i> ${producto.origenGrano}</p>
                <div class="detail-meta-grid">
                  <div class="detail-meta-item"><strong>Precio base:</strong> $${producto.precioBase}</div>
                  <div class="detail-meta-item"><strong>Intensidad:</strong> ${producto.intensidad}/5</div>
                  <div class="detail-meta-item"><strong>Preparación:</strong> ${producto.tiempoPreparacionMin} min</div>
                  <div class="detail-meta-item"><strong>Alérgenos:</strong> ${producto.alergenos.length ? producto.alergenos.join(', ') : 'Ninguno'}</div>
                </div>
              </div>
            </div>
            <p class="card-description">${producto.descripcion}</p>
            <div class="card-tags">
              ${producto.notasCata.map((nota) => `<span class="tag">${nota}</span>`).join('')}
            </div>
    `;
  const precio = producto.precioBase;
  const unidades = Number(cantidadProducto.value);
  const precioTotal = precio * unidades;
  precioTotalCalculado.textContent = `$${precioTotal}`;
}

function aplicarFiltros() {
  const categoria = filtroCategoria.value;
  const query = inputBusqueda.value.toLowerCase();

  productos = todosProductos.filter((producto) => {
    const coincideCategoria = !categoria || producto.categoria === categoria;
    const coincideBusqueda = producto.nombre.toLowerCase().includes(query);
    return coincideCategoria && coincideBusqueda;
  });

  if (!categoria && !query) {
    productos = todosProductos;
  }

  renderizarProductos();
}

filtroCategoria.addEventListener('change', aplicarFiltros);
inputBusqueda.addEventListener('input', aplicarFiltros);

catalogoGrid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-ordenar');
  if (!btn) return;

  const productoId = btn.dataset.id;
  await abrirModal(productoId);
});

formPedido.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!productoActual) return;

  const nombreCliente = inputCliente.value;
  const notasEspeciales = inputNotas.value;
  const unidades = Number(cantidadProducto.value);
  const precioTotal = productoActual.precioBase * unidades;

  const pedido = {
    id: productoActual.id,
    productoNombre: productoActual.nombre,
    cliente: nombreCliente,
    cantidad: unidades,
    notas: notasEspeciales,
    total: precioTotal,
    fecha: new Date().toLocaleDateString(),
  };

  pedidos.push(pedido);
  guardarPedidos();
  modalDetalle.classList.add('hidden');
  formPedido.reset();
  productoActual = null;
  renderizarHistorial();
});

cantidadProducto.addEventListener('input', () => {
  if (!productoActual) return;
  const precio = productoActual.precioBase;
  const unidades = Number(cantidadProducto.value);
  const precioTotal = precio * unidades;
  precioTotalCalculado.textContent = `$${precioTotal}`;
});

function guardarPedidos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

function cargarPedidos() {
  if (localStorage.getItem(STORAGE_KEY)) {
    pedidos = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } else {
    pedidos = [];
  }
}

function limpiarPedidos() {
  if (localStorage.getItem(STORAGE_KEY)) {
    localStorage.removeItem(STORAGE_KEY);
  }
  pedidos = [];
  renderizarHistorial();
}

function renderizarHistorial() {
  pedidosLista.innerHTML = '';
  pedidos.forEach((pedido) => {
    const entry = document.createElement('div');
    entry.innerHTML = `
      <div class="pedido-card">
            <div class="pedido-info">
              <h4>${pedido.productoNombre} x${pedido.cantidad}</h4>
              <p>
                ${pedido.cliente} · ${new Date(pedido.fecha).toLocaleString()}
                ${pedido.notas ? `· ${pedido.notas}` : ''}
              </p>
            </div>
            <div class="pedido-total">$${pedido.total}</div>
          </div>`;
    pedidosLista.appendChild(entry);
  });
}

btnCerrarModal.forEach((btnCerrar) => {
  btnCerrar.addEventListener('click', () => {
    modalDetalle.classList.add('hidden');
  });
});

btnLimpiarPedidos.addEventListener('click', () => {
  limpiarPedidos();
});

async function init() {
  todosProductos = await obtenerProductos();
  productos = todosProductos;
  categorias = await obtenerCategorias();
  renderizarCategorias();
  renderizarProductos();
  cargarPedidos();
  renderizarHistorial();
}

init();
