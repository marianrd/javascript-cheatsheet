const API_URL = 'http://localhost:3000';
const STORAGE_KEY = 'inmobiliaria_favoritos';

let propiedades = [];
let todasPropiedades = [];
let tipos = [];
let favoritos = [];

const filtroTipo = document.getElementById('filtroTipo');
const ordenarPrecio = document.getElementById('ordenarPrecio');
const catalogoGrid = document.getElementById('catalogoGrid');
const modalDetalle = document.getElementById('modalDetalle');
const detalleContent = document.getElementById('detalleContent');
const favoritosLista = document.getElementById('favoritosLista');
const btnLimpiarFavoritos = document.getElementById('btnLimpiarFavoritos');
const cerrarModal = document.querySelectorAll('.cerrar-modal');

async function obtenerPropiedades() {
    try {
        const res = await fetch(`${API_URL}/api/propiedades`);
        return res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function obtenerTipos() {
    try {
        const res = await fetch(`${API_URL}/api/tipos`);
        return res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function obtenerPropiedadPorId(id) {
    try {
        const res = await fetch(`${API_URL}/api/propiedades/${id}`);
        return res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

function renderizarPropiedades() {
    catalogoGrid.innerHTML = '';
    if (propiedades.length === 0) {
        catalogoGrid.innerHTML = '<p class="empty-state">No se encontraron propiedades.</p>';
        return;
    }
    propiedades.forEach((propiedad) => {
        let esFavorito = false;
        favoritos.forEach(favorito => {
          if (favorito.id === propiedad.id) {
            esFavorito = true;
          }
        })
        const entry = document.createElement('div');
        entry.innerHTML = `
        <div class="propiedad-card" data-id="${propiedad.id}">
            <div class="card-image-wrap">
              <img src="${propiedad.imagen}" alt="${propiedad.titulo}" class="card-image" />
              <span class="card-tipo-badge badge-${propiedad.tipo}">${propiedad.tipoNombre}</span>
              <span class="card-price-badge">${propiedad.moneda} ${propiedad.precio}</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">${propiedad.titulo}</h3>
              <p class="card-ubicacion"><i class="fas fa-map-marker-alt"></i> ${propiedad.barrio}, ${propiedad.ciudad}</p>
              <div class="meta">
                <div class="meta-info">
                  <span><i class="fas fa-door-open"></i> ${propiedad.ambientes} amb.</span>
                  <span><i class="fas fa-bath"></i> ${propiedad.banios}</span>
                  <span><i class="fas fa-ruler-combined"></i> ${propiedad.superficieM2}m²</span>
                </div>
                <button type="button" class="btn-fav ${esFavorito ? 'active' : ''}" data-id="${propiedad.id}" title="Favorito">
                  <i class="${esFavorito ? 'fas' : 'far'} fa-star"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        catalogoGrid.appendChild(entry);
    })
}

function renderizarFiltros() {
    tipos.forEach(tipo => {
        const entry = document.createElement('option');
        entry.value = tipo.id;
        entry.textContent = tipo.nombre;
        filtroTipo.appendChild(entry);
    })
}

function renderizarGuardadas() {
    favoritosLista.innerHTML = '';
    if (favoritos.length === 0) {
        favoritosLista.innerHTML = '<p class="empty-state">Todavía no guardaste ninguna propiedad.</p>';
        return;
    }
    favoritos.forEach(fav => {
        const entry = document.createElement('div');
        entry.innerHTML = `
        <div class="fav-item">
            <div>
              <span><strong>${fav.titulo}</strong></span>
              <span class="fav-ubicacion"> &bull; ${fav.barrio} &bull; ${fav.moneda} ${fav.precio}</span>
            </div>
            <button type="button" class="btn-outline btn-quitar-fav" data-id="${fav.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>`;
        favoritosLista.appendChild(entry);
    })
}

function aplicarFiltros() {
    const filtro = filtroTipo.value;
    let resultado = [...todasPropiedades];
    if (filtro) {
        resultado = resultado.filter((propiedad) => propiedad.tipo === filtro);
    }
    const orden = ordenarPrecio.value;
    if (orden) {
        resultado = resultado.sort((a, b) => {
            if (orden === 'asc') {
                return a.precio - b.precio;
            }
            return b.precio - a.precio;
        })
    }
    propiedades = resultado;
    renderizarPropiedades();
}

filtroTipo.addEventListener('change', aplicarFiltros);
ordenarPrecio.addEventListener('change', aplicarFiltros);

async function abrirModal(id) {
    modalDetalle.classList.remove('hidden');
    const propiedad = await obtenerPropiedadPorId(id);
    detalleContent.innerHTML = `
    <img src="${propiedad.imagen}" alt="${propiedad.titulo}" />
            <h2>${propiedad.titulo}</h2>
            <div class="detail-meta">
              <span class="badge badge-tipo badge-${propiedad.tipo}">${propiedad.tipoNombre}</span>
              <span class="badge">${propiedad.operacion}</span>
              <span class="badge"><i class="fas fa-tag" style="color:var(--star)"></i> ${propiedad.moneda} ${propiedad.precio}</span>
            </div>
            <div class="detail-meta-grid">
              <div class="detail-meta-item"><strong>Ambientes:</strong> ${propiedad.ambientes}</div>
              <div class="detail-meta-item"><strong>Baños:</strong> ${propiedad.banios}</div>
              <div class="detail-meta-item"><strong>Superficie:</strong> ${propiedad.superficieM2}m²</div>
              <div class="detail-meta-item"><strong>Ubicación:</strong> ${propiedad.barrio}, ${propiedad.ciudad}</div>
            </div>
            <p>${propiedad.descripcion}</p>
            <div class="card-tags">
              ${propiedad.caracteristicas.map((c) => `<span class="tag">${c}</span>`).join('')}
            </div>`;
}

catalogoGrid.addEventListener('click', async (e) => {
    if (e.target.closest('.propiedad-card') && !(e.target.closest('.btn-fav'))) {
        const propiedad = e.target.closest('.propiedad-card').dataset.id;
        await abrirModal(propiedad);
    }
    if (e.target.closest('.btn-fav')) {
        const propiedad = e.target.closest('.btn-fav').dataset.id;
        toggleFavorito(propiedad);
    }
});

cerrarModal.forEach((boton) => {
    boton.addEventListener('click', () => {
        modalDetalle.classList.add('hidden');
    })
});

async function toggleFavorito(id) {
    const propiedad = await obtenerPropiedadPorId(id);
    const yaEsFavorito = favoritos.some(fav => fav.id === Number(id));
    if (yaEsFavorito) {
      favoritos = favoritos.filter(fav => fav.id !== Number(id));
    } else {
      favoritos.push(propiedad);
    }
    guardarFavoritos();
    renderizarPropiedades();
}

function guardarFavoritos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
    renderizarGuardadas();
}

function cargarFavoritos() {
    if (localStorage.getItem(STORAGE_KEY)) {
        favoritos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } else {
        favoritos = [];
    }
    return favoritos;
}

function limpiarFavoritos() {
    favoritos = [];
    localStorage.removeItem(STORAGE_KEY);
    renderizarGuardadas();
    renderizarPropiedades();
}

btnLimpiarFavoritos.addEventListener('click', limpiarFavoritos);

function eliminarFavorito(id) {
    favoritos = favoritos.filter((fav) => fav.id !== Number(id));
    guardarFavoritos();
    renderizarPropiedades();
}

favoritosLista.addEventListener('click', (e) => {
    const tg = e.target;
    if (tg.closest('.btn-quitar-fav')) {
        const propiedad = tg.closest('.btn-quitar-fav').dataset.id;
        eliminarFavorito(propiedad);
    }
});

async function init() {
    propiedades = await obtenerPropiedades();
    todasPropiedades = propiedades;
    tipos = await obtenerTipos();
    renderizarPropiedades();
    renderizarFiltros();
    favoritos = await cargarFavoritos();
    renderizarGuardadas();
}

init();
