// URL de la API
const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'gamehub_favoritos';

// Array de objetos obtenidos a traves de la API
let videojuegos = [];
let todosVideojuegos = [];
let plataformas = [];
let favoritos = [];

// Consts para el DOM
const filtroPlataforma = document.getElementById('filtroPlataforma');
const catalogoGrid = document.getElementById('catalogoGrid');
const modalDetalle = document.getElementById('modalDetalle');
const detalleContent = document.getElementById('detalleContent');
const favoritosLista = document.getElementById('favoritosLista');
const btnLimpiarFavoritos = document.getElementById('btnLimpiarFavoritos');
const ordenarCalificacion = document.getElementById('ordenarCalificacion');
const cerrarModal = document.querySelectorAll('.cerrar-modal');

// Consumicion de APIs
async function obtenerVideojuegos() {
  try {
    const response = await fetch(`${API_URL}/api/videojuegos`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerPlataformas() {
  try {
    const response = await fetch(`${API_URL}/api/plataformas`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerVideojuegoPorId(id) {
  try {
    const response = await fetch(`${API_URL}/api/videojuegos/${id}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function renderizarJuegos() {
  catalogoGrid.innerHTML = '';
  videojuegos.forEach((juego) => {
    const esFavorito = favoritos.some((objeto) => objeto.id === Number(juego.id));

    const entry = document.createElement('div');
    entry.innerHTML = `
        <div class="game-card" data-id="${juego.id}">
          <img src="${juego.imagen}" alt="${juego.nombre}" />
          <div class="game-card-body">
            <h3>${juego.nombre}</h3>
            <p class="developer">${juego.desarrollador}</p>
            <div class="meta">
              <div>
                <span class="badge badge-platform">${juego.plataforma}</span>
                <span class="badge badge-genre">${juego.genero}</span>
              </div>
              <div class="rating">
                <i class="fas fa-star"></i>
                <span>${juego.calificacion}</span>
              </div>
              <button type="button" class="btn-fav ${esFavorito ? 'active' : ''}" data-id="${juego.id}" title="Favorito">
                <i class="${esFavorito ? 'fas' : 'far'} fa-star"></i>
              </button>
            </div>
          </div>
        </div>`;
    catalogoGrid.appendChild(entry);
  });
}

function renderizarFiltro() {
  plataformas.forEach((plataforma) => {
    const entry = document.createElement('option');
    entry.value = plataforma.id;
    entry.textContent = plataforma.nombre;
    filtroPlataforma.appendChild(entry);
  });
}

async function renderizarModal(juegoId) {
  modalDetalle.classList.remove('hidden');
  detalleContent.innerHTML = '';
  const juego = await obtenerVideojuegoPorId(juegoId);
  if (!juego) {
    detalleContent.innerHTML = '<p>No se pudo cargar el videojuego. Intentá nuevamente.</p>';
    return;
  }
  const entry = document.createElement('div');
  entry.innerHTML = `
    <img src="${juego.imagen}" alt="${juego.nombre}" />
        <h2>${juego.nombre}</h2>
        <div class="detail-meta">
          <span class="badge badge-platform">${juego.plataforma}</span>
          <span class="badge badge-genre">${juego.genero}</span>
          <span class="badge"><i class="fas fa-star" style="color:var(--star)"></i> ${juego.calificacion}</span>
          <span class="badge">${juego.año || 2024}</span>
        </div>
        <p>${juego.descripcion}</p>
    `;
  detalleContent.appendChild(entry);
}

function renderizarFavoritos() {
  favoritosLista.innerHTML = '';
  favoritos.forEach((fav) => {
    const entry = document.createElement('div');
    entry.innerHTML = `
        <div class="fav-item">
          <div>
            <span><strong>${fav.nombre}</strong></span>
            <span class="fav-platform"> &bull; ${fav.plataforma} &bull; <i class="fas fa-star" style="color:var(--star)"></i> ${fav.calificacion}</span>
          </div>
          <button type="button" class="btn-outline btn-quitar-fav" data-id="${fav.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        `;
    favoritosLista.appendChild(entry);
  });
}

async function agregarFavorito(id) {
  if (buscarFavoritos(id)) {
    eliminarFavorito(id);
    return;
  }
  const juego = await obtenerVideojuegoPorId(id);
  if (!juego) return;
  const favorito = {
    id: juego.id,
    nombre: juego.nombre,
    plataforma: juego.plataforma,
    calificacion: juego.calificacion,
  };
  favoritos.push(favorito);
  guardarFavoritos();
}

function buscarFavoritos(id) {
  return favoritos.find((objeto) => objeto.id === Number(id));
}

function eliminarFavorito(id) {
  if (buscarFavoritos(id)) {
    favoritos = favoritos.filter((objeto) => objeto.id !== Number(id));
    guardarFavoritos();
  }
}

function limpiarFavoritos() {
  favoritos = [];
  localStorage.removeItem(STORAGE_KEY);
  renderizarFavoritos();
  renderizarJuegos();
}

function aplicarFiltroYOrden() {
  const plataformaId = filtroPlataforma.value;
  const orden = ordenarCalificacion.value;

  const plataformaSeleccionada = plataformas.find((p) => p.id === plataformaId);
  videojuegos = plataformaSeleccionada
    ? todosVideojuegos.filter((juego) => juego.plataforma === plataformaSeleccionada.nombre)
    : todosVideojuegos;

  if (orden) {
    videojuegos = [...videojuegos].sort((a, b) =>
      orden === 'asc' ? a.calificacion - b.calificacion : b.calificacion - a.calificacion,
    );
  }

  renderizarJuegos();
}

filtroPlataforma.addEventListener('change', aplicarFiltroYOrden);
ordenarCalificacion.addEventListener('change', aplicarFiltroYOrden);

catalogoGrid.addEventListener('click', async (e) => {
  const juegoId = e.target.closest('.game-card').dataset.id;
  if (!e.target.closest('.btn-fav')) {
    await renderizarModal(juegoId);
  } else {
    await agregarFavorito(juegoId);
    renderizarFavoritos();
    renderizarJuegos();
  }
});

favoritosLista.addEventListener('click', (e) => {
  const tg = e.target.closest('.btn-quitar-fav');
  if (!tg) return;
  eliminarFavorito(tg.dataset.id);
  renderizarFavoritos();
  renderizarJuegos();
});

btnLimpiarFavoritos.addEventListener('click', () => {
  limpiarFavoritos();
});

cerrarModal.forEach((botonModal) => {
  botonModal.addEventListener('click', () => {
    modalDetalle.classList.add('hidden');
  });
});

function guardarFavoritos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
}

function cargarFavoritos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  favoritos = raw ? JSON.parse(raw) : [];
}

async function init() {
  todosVideojuegos = await obtenerVideojuegos();
  videojuegos = todosVideojuegos;
  plataformas = await obtenerPlataformas();
  cargarFavoritos();
  renderizarJuegos();
  renderizarFiltro();
  renderizarFavoritos();
}

init();
