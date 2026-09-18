const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'eventos_compras';

const filtroGenero = document.getElementById('filtroGenero');
const inputBusqueda = document.getElementById('inputBusqueda');
const eventosGrid = document.getElementById('eventosGrid');
const modalCompra = document.getElementById('modalCompra');
const compraContent = document.getElementById('compraContent');
const formCompra = document.getElementById('formCompra');
const cantidadEntradas = document.getElementById('cantidadEntradas');
const totalPagar = document.getElementById('totalPagar');
const btnConfirmar = document.getElementById('btnConfirmar');
const historialLista = document.getElementById('historialLista');
const btnLimpiarHistorial = document.getElementById('btnLimpiarHistorial');
const cerrarModal = document.querySelectorAll('.cerrar-modal');

let eventos = [];
let todosEventos = [];
let generos = [];

let historial = [];

let eventoSeleccionado = null;

async function obtenerEventos() {
    const response = await fetch(`${API_URL}/api/eventos`);
    return response.json();
}

async function obtenerEventosPorGenero(genero) {
    const response = await fetch(`${API_URL}/api/eventos?genero=${genero}`);
    return response.json();
}

async function obtenerEventosPorId(id) {
    const response = await fetch(`${API_URL}/api/eventos/${id}`);
    return response.json();
}

async function obtenerGeneros() {
    const response = await fetch(`${API_URL}/api/generos`);
    return response.json();
}

function renderizarCatalogo() {
    eventosGrid.innerHTML = '';
    eventos.forEach(evento => {
        const entry = document.createElement('div');
        entry.innerHTML = `
        <div class="event-card" data-id="${evento.id}">
            <img src="${evento.imagen}" alt="${evento.nombre}" />
            <div class="event-card-body">
              <span class="badge badge-genre">${evento.genero}</span>
              <h3>${evento.nombre}</h3>
              <p class="artist">${evento.artista}</p>
              <div class="event-info">
                <p><i class="fas fa-calendar"></i> ${new Date(evento.fecha).toLocaleDateString()}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${evento.ubicacion}</p>
              </div>
              <div class="event-meta">
                <span class="price">$${evento.precio.toFixed(2)}</span>
                ${
                  // eslint-disable-next-line no-nested-ternary
                  evento.tickets_disponibles === 0
                    ? '<span class="badge badge-sold-out">Agotado</span>'
                    : evento.tickets_disponibles < 500
                      ? '<span class="badge badge-low-stock">Últimas entradas</span>'
                      : '<span class="badge badge-available">Disponible</span>'
                }
              </div>
              <button
                type="button"
                class="btn-comprar"
                data-id="${evento.id}"
                ${evento.tickets_disponibles === 0 ? 'disabled' : ''}
              >
                <i class="fas fa-ticket-alt"></i>
                ${evento.tickets_disponibles === 0 ? 'Agotado' : 'Comprar'}
              </button>
            </div>
          </div>
        `;
        eventosGrid.appendChild(entry);
    });
}

function renderizarFiltros() {
    generos.forEach(genero => {
      const entry = document.createElement('option');
      entry.value = genero.id;
      entry.textContent = genero.nombre;
      filtroGenero.appendChild(entry);
    })
}

function aplicarFiltros() {
    const genero = filtroGenero.value;
    const query = inputBusqueda.value.toLowerCase();

    eventos = todosEventos.filter((evento) => {
      const claseGenero = evento.genero.toLowerCase().replace(/[\s/]+/g, '-');
      const coincideCategoria = !genero || claseGenero === genero;
      const coincideBusqueda = evento.nombre.toLowerCase().includes(query) || evento.artista.toLowerCase().includes(query);
      return coincideCategoria && coincideBusqueda;
    });

    if (!genero && !query) {
      eventos = todosEventos;
    }

    renderizarCatalogo();
}

function abrirModal() {
    modalCompra.classList.remove('hidden');
    totalPagar.textContent = `$${calcularPrecio()}`;
    compraContent.innerHTML = `
    <h4 data-id="${eventoSeleccionado.id}" data-precio="${eventoSeleccionado.precio}">${eventoSeleccionado.nombre}</h4>
            <p class="purchase-artist">${eventoSeleccionado.artista}</p>
            <p class="purchase-details">
              <i class="fas fa-calendar"></i> ${new Date(eventoSeleccionado.fecha).toLocaleDateString()}
            </p>
            <p class="purchase-details">
              <i class="fas fa-map-marker-alt"></i> ${eventoSeleccionado.ubicacion}
            </p>
            <p class="purchase-price">Precio unitario: $${eventoSeleccionado.precio}</p>`;
}

eventosGrid.addEventListener('click', async (e) => {
    const tg = e.target;
    const boton = tg.closest('.btn-comprar');
    if (boton) {
      const eventoId = boton.dataset.id;
      eventoSeleccionado = await obtenerEventosPorId(eventoId);
      abrirModal();
    }
});

cerrarModal.forEach((boton) => {
    boton.addEventListener('click', (e) => {
        modalCompra.classList.add('hidden');
    })
})

function calcularPrecio() {
    const precioUnidad = eventoSeleccionado.precio;
    const cantidad = cantidadEntradas.value;
    return precioUnidad * cantidad;
}

formCompra.addEventListener('submit', (e) => {
    e.preventDefault();
    const precioTotal = calcularPrecio();
    const evento = eventoSeleccionado.nombre;
    const artistaEvento = eventoSeleccionado.artista;
    const cantidad = cantidadEntradas.value;

    const compra = {
        evento,
        artista: artistaEvento,
        cantidad,
        total: precioTotal,
        fecha: new Date().toLocaleDateString(),
    };

    historial.push(compra);
    guardarHistorial();
    renderizarHistorial();
    modalCompra.classList.add('hidden');
})

function guardarHistorial() {
    if (historial.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
    }
}

function cargarHistorial() {
    if (localStorage.getItem(STORAGE_KEY)) {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    return [];
}

function limpiarHistorial() {
    localStorage.removeItem(STORAGE_KEY);
    historial = [];
    renderizarHistorial();
}

function renderizarHistorial() {
    historialLista.innerHTML = '';
    historial.forEach((compra) => {
      historialLista.innerHTML += `
      <li class="history-item">
            <div>
              <p class="item-event">${compra.evento} x${compra.cantidad}</p>
              <p class="item-detail">${compra.artista} · ${new Date(compra.fecha).toLocaleString()}</p>
            </div>
            <span class="item-total">$${compra.total}</span>
          </li>`;
    })
}

cantidadEntradas.addEventListener('input', (e) => {
    totalPagar.textContent = `$${calcularPrecio()}`;
});

btnLimpiarHistorial.addEventListener('click', limpiarHistorial);

filtroGenero.addEventListener('change', aplicarFiltros);
inputBusqueda.addEventListener('input', aplicarFiltros);

async function init() {
    eventos = await obtenerEventos();
    todosEventos = eventos;
    generos = await obtenerGeneros();
    historial = cargarHistorial();
    renderizarHistorial();
    renderizarCatalogo();
    renderizarFiltros();
}

init();