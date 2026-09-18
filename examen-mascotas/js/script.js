const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'adopcion_solicitudes';

let mascotas = [];
let todasMascotas = [];
let especies = [];
let solicitudes = [];

let animalSeleccionado = null;

const filtroEspecie = document.getElementById('filtroEspecie');
const catalogoGrid = document.getElementById('catalogoGrid');
const modalDetalle = document.getElementById('modalDetalle');
const formAdopcion = document.getElementById('formAdopcion');
const inputNombreAdoptante = document.getElementById('inputNombreAdoptante');
const inputTelefono = document.getElementById('inputTelefono');
const solicitudesLista = document.getElementById('solicitudesLista');
const btnLimpiarSolicitudes = document.getElementById('btnLimpiarSolicitudes');
const detalleContent = document.getElementById('detalleContent');

async function obtenerMascotas() {
  try {
    const response = await fetch(`${API_URL}/api/animales`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerEspecies() {
  try {
    const response = await fetch(`${API_URL}/api/especies`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function obtenerMascotaPorId(id) {
  try {
    const response = await fetch(`${API_URL}/api/animales/${id}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function renderizarCatalogo() {
  catalogoGrid.innerHTML = '';
  mascotas.forEach((animal) => {
    const entry = document.createElement('div');
    entry.innerHTML = `
        <div class="animal-card">
          <div class="card-image-wrap">
            <img src="${animal.imagen}" alt="${animal.nombre}" class="card-image" />
            <span class="card-species-badge badge-${animal.especie}">${animal.especie}</span>
            <span class="card-age-badge">${animal.edad}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${animal.nombre}</h3>
            <p class="card-breed">${animal.raza} &bull; ${animal.sexo}</p>
            <p class="card-shelter"><i class="fas fa-home"></i> ${animal.refugio}</p>
            <p class="card-description">${animal.descripcion}</p>
            <button type="button" class="btn-primary btn-adoptar" data-id="${animal.id}">
              <i class="fas fa-heart"></i> Conocer y Adoptar
            </button>
          </div>
        </div>`;
    catalogoGrid.appendChild(entry);
  });
}

async function renderizarModal(id) {
  modalDetalle.classList.remove('hidden');
  const animal = await obtenerMascotaPorId(id);
  if (!animal) {
    detalleContent.innerHTML = '<p>No se pudo cargar la ficha del animal. Intentá nuevamente.</p>';
    return;
  }
  detalleContent.innerHTML = '';
  const entry = document.createElement('div');
  entry.innerHTML = `
    <div class="detail-header-info">
              <img src="${animal.imagen}" alt="${animal.nombre}" class="detail-img" />
              <div>
                <h4>${animal.nombre} (${animal.raza})</h4>
                <div class="detail-meta-grid">
                  <div class="detail-meta-item"><strong>Especie:</strong> ${animal.especie}</div>
                  <div class="detail-meta-item"><strong>Edad:</strong> ${animal.edad}</div>
                  <div class="detail-meta-item"><strong>Tamaño:</strong> ${animal.tamaño}</div>
                  <div class="detail-meta-item"><strong>Refugio:</strong> ${animal.refugio}</div>
                </div>
              </div>
            </div>
            <div class="detail-history">
              <strong>Historia:</strong> ${animal.historia}
            </div>`;
  detalleContent.appendChild(entry);
}

function renderizarSelector() {
  especies.forEach((especie) => {
    const entry = document.createElement('option');
    entry.value = especie.id;
    entry.textContent = especie.nombre;
    filtroEspecie.appendChild(entry);
  });
}

function cerrarModal() {
  modalDetalle.classList.add('hidden');
}

function guardarHistorial() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
}

function cargarHistorial() {
  const res = localStorage.getItem(STORAGE_KEY);
  solicitudes = res ? JSON.parse(res) : [];
}

function renderizarHistorial() {
  solicitudesLista.innerHTML = '';
  solicitudes.forEach((sol) => {
    const entry = document.createElement('div');
    entry.innerHTML = `<div class="solicitud-card">
            <div class="solicitud-info">
              <h4>🐾 Solicitud para: ${sol.animalNombre} (${sol.especie})</h4>
              <p><strong>Solicitante:</strong> ${sol.solicitante} &bull; <strong>Tel:</strong> ${sol.telefono} &bull; <strong>Fecha:</strong> ${sol.fecha}</p>
            </div>
            <span class="solicitud-badge">En Revisión</span>
          </div>`;
    solicitudesLista.appendChild(entry);
  });
}

function limpiarHistorial() {
  solicitudes = [];
  localStorage.removeItem(STORAGE_KEY);
}

catalogoGrid.addEventListener('click', async (e) => {
  const tg = e.target.closest('.btn-adoptar');
  if (tg) {
    const animalId = tg.dataset.id;
    animalSeleccionado = tg.dataset.id;
    await renderizarModal(animalId);
  }
});

modalDetalle.addEventListener('click', (e) => {
  const tg = e.target.closest('.cerrar-modal');
  if (tg) {
    cerrarModal();
  }
});

function filtrarEspecie(id) {
  mascotas = id ? todasMascotas.filter((objeto) => objeto.especie === id) : todasMascotas;
  renderizarCatalogo();
}

filtroEspecie.addEventListener('change', () => {
  const especieSeleccionada = filtroEspecie.value;
  filtrarEspecie(especieSeleccionada);
});

formAdopcion.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!animalSeleccionado) return;

  const nombre = inputNombreAdoptante.value;
  const telefono = inputTelefono.value;

  const animal = await obtenerMascotaPorId(animalSeleccionado);
  if (!animal) return;

  const fichaAdoptante = {
    id: animal.id,
    animalNombre: animal.nombre,
    especie: animal.especie,
    solicitante: nombre,
    telefono,
    fecha: new Date().toLocaleDateString(),
  };

  solicitudes.push(fichaAdoptante);
  guardarHistorial();
  renderizarHistorial();
  cerrarModal();
  formAdopcion.reset();
  animalSeleccionado = null;
});

btnLimpiarSolicitudes.addEventListener('click', () => {
  limpiarHistorial();
  renderizarHistorial();
});

async function init() {
  mascotas = await obtenerMascotas();
  todasMascotas = mascotas;
  especies = await obtenerEspecies();
  cargarHistorial();
  renderizarCatalogo();
  renderizarSelector();
  renderizarHistorial();
}

init();
