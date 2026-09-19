const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'libreria_pedidos';

let libros = [];
let todosLibros = [];
let categorias = [];
let pedidos = [];

let libroActual = null;

const filtroCategoria = document.getElementById('filtroCategoria');
const catalogoGrid = document.getElementById('catalogoGrid');
const modalDetalle = document.getElementById('modalDetalle');
const detalleContent = document.getElementById('detalleContent');
const formPedido = document.getElementById('formPedido');
const precioTotalCalculado = document.getElementById('precioTotalCalculado');
const pedidosLista = document.getElementById('pedidosLista');
const btnLimpiarPedidos = document.getElementById('btnLimpiarPedidos');
const cerrarModal = document.querySelectorAll('.cerrar-modal');
const cantidadLibro = document.getElementById('cantidadLibro');
const inputCliente = document.getElementById('inputCliente');

async function obtenerLibros() {
  try {
    const res = await fetch(`${API_URL}/api/libros`);
    return res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function obtenerLibroPorId(id) {
  try {
    const res = await fetch(`${API_URL}/api/libros/${id}`);
    return res.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function obtenerCategorias() {
  try {
    const res = await fetch(`${API_URL}/api/categorias`);
    return res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

function renderizarLibros() {
  catalogoGrid.innerHTML = '';
  if (libros.length === 0) {
    catalogoGrid.innerHTML = '<p class="empty-state">No se encontraron libros.</p>';
    return;
  }
  libros.forEach((libro) => {
    const claseCategoria = libro.categoriaNombre;
    const entry = document.createElement('div');
    entry.innerHTML = `
        <div class="libro-card" data-id="${libro.id}">
            <div class="card-image-wrap">
              <img src="${libro.imagen}" alt="${libro.titulo}" class="card-image" />
              <span class="card-cat-badge cat-${claseCategoria}">${libro.categoriaNombre}</span>
              <span class="card-price-badge">$${libro.precio}</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">${libro.titulo}</h3>
              <p class="card-autor"><i class="fas fa-feather"></i> ${libro.autor}</p>
              <p class="card-description">${libro.descripcion}</p>
              <div class="card-tags">
                <span class="tag">${libro.formato}</span>
                <span class="tag">${libro.editorial}</span>
              </div>
              <button type="button" class="btn-primary btn-ordenar" data-id="${libro.id}">
                <i class="fas fa-cart-plus"></i> Encargar Libro
              </button>
            </div>
          </div>
        `;
    catalogoGrid.appendChild(entry);
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

function renderizarPedidos() {
  pedidosLista.innerHTML = '';
  if (pedidos.length === 0) {
    pedidosLista.innerHTML = '<p class="empty-state">Todavía no registraste ningún pedido.</p>';
    return;
  }
  pedidos.forEach((pedido) => {
    const entry = document.createElement('div');
    entry.innerHTML = `
       <div class="pedido-card">
            <div class="pedido-info">
              <h4>${pedido.libroTitulo} x${pedido.cantidad}</h4>
              <p>${pedido.cliente} · ${new Date(pedido.fecha).toLocaleString()}</p>
            </div>
            <div class="pedido-total">$${pedido.total}</div>
          </div>`;
    pedidosLista.appendChild(entry);
  });
}

filtroCategoria.addEventListener('change', () => {
  const filtro = filtroCategoria.value;
  libros = filtro ? todosLibros.filter((libro) => libro.categoria === filtro) : [...todosLibros];
  renderizarLibros();
});

async function abrirModal(id) {
  modalDetalle.classList.remove('hidden');
  const libro = await obtenerLibroPorId(id);
  libroActual = libro;
  const claseCategoria = libro.categoria;
  detalleContent.innerHTML = `
    <div class="detail-header-info" data-id="${libro.id}" data-precio-base="${libro.precio}">
              <img src="${libro.imagen}" alt="${libro.titulo}" class="detail-img" />
              <div>
                <span class="card-cat-badge cat-${claseCategoria}">${libro.categoriaNombre}</span>
                <h3 class="card-title">${libro.titulo}</h3>
                <p class="card-autor"><i class="fas fa-feather"></i> ${libro.autor}</p>
                <div class="detail-meta-grid">
                  <div class="detail-meta-item"><strong>Precio:</strong> $${libro.precio}</div>
                  <div class="detail-meta-item"><strong>Páginas:</strong> ${libro.paginas}</div>
                  <div class="detail-meta-item"><strong>Editorial:</strong> ${libro.editorial}</div>
                  <div class="detail-meta-item"><strong>Año:</strong> ${libro.anioPublicacion}</div>
                </div>
              </div>
            </div>
            <p class="card-description">${libro.descripcion}</p>
    `;
}

catalogoGrid.addEventListener('click', async (e) => {
  const tg = e.target;
  if (tg.closest('.btn-ordenar')) {
    const libro = tg.closest('.btn-ordenar').dataset.id;
    await abrirModal(libro);
    calcularPrecio();
  }
});

cerrarModal.forEach((boton) => {
  boton.addEventListener('click', () => {
    modalDetalle.classList.add('hidden');
    libroActual = null;
  });
});

formPedido.addEventListener('submit', (e) => {
  e.preventDefault();
  const cantidad = cantidadLibro.value;
  const nombre = inputCliente.value;

  const form = {
    libroTitulo: libroActual.titulo,
    cantidad,
    cliente: nombre,
    total: libroActual.precio * Number(cantidad),
    fecha: new Date().toISOString(),
  };

  pedidos.push(form);
  guardarPedidos();
  renderizarPedidos();
  modalDetalle.classList.add('hidden');
  libroActual = null;
});

function guardarPedidos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

function cargarPedidos() {
  if (localStorage.getItem(STORAGE_KEY)) {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }
  return [];
}

function limpiarPedidos() {
  pedidos = [];
  localStorage.removeItem(STORAGE_KEY);
  renderizarPedidos();
}

function calcularPrecio() {
  precioTotalCalculado.textContent = `$${libroActual.precio * cantidadLibro.value}`;
}

cantidadLibro.addEventListener('input', () => {
  calcularPrecio();
});

btnLimpiarPedidos.addEventListener('click', async () => {
  limpiarPedidos();
});

async function init() {
  libros = await obtenerLibros();
  todosLibros = [...libros];
  categorias = await obtenerCategorias();
  renderizarLibros();
  renderizarCategorias();
  pedidos = cargarPedidos();
  renderizarPedidos();
}

init();
