// URL de la API
const API_URL = "http://localhost:3000";

// Array de objetos obtenidos a traves de la API
let videojuegos = [];
let plataformas = [];
let favoritos = [];

// Consts para el DOM
const filtroPlataforma = document.getElementById("filtroPlataforma");
const catalogoGrid  = document.getElementById("catalogoGrid");
const modalDetalle = document.getElementById("modalDetalle");
const detalleContent = document.getElementById("detalleContent");
const favoritosLista = document.getElementById("favoritosLista");
const btnLimpiarFavoritos = document.getElementById("btnLimpiarFavoritos");
const ordenarCalificacion = document.getElementById("ordenarCalificacion");
const cerrarModal = document.querySelectorAll(".cerrar-modal");

// Consumicion de APIs
async function obtenerVideojuegos() {
    const response = await fetch(`${API_URL}/api/videojuegos`);   // Pide la respuesta a la API
    const json = await response.json();                                          // Espera la respuesta y la parsea como JSON
    return json;
}

async function obtenerPlataformas() {
    const response = await fetch(`${API_URL}/api/plataformas`);
    const json = await response.json();
    return json;
}

async function obtenerVideojuegoPorId(id) {
    const response = await fetch(`${API_URL}/api/videojuegos/${id}`);
    const json = await response.json();
    return json;
}

async function obtenerVideojuegosPorPlataforma(plataforma) {
    const response = await fetch(`${API_URL}/api/videojuegos?plataforma=${plataforma}`);
    const json = await response.json();
    return json;
}

function renderizarJuegos(plataforma) {
    catalogoGrid.innerHTML = '';
    videojuegos.forEach(juego => {
        let plat;
        if (plataforma) {
          plat = plataforma;
        } else {
          plat = juego.plataforma;
        }
        let esFavorito;
        if (favoritos.length <= 0) {
          esFavorito = false;
        } else {
          esFavorito = favoritos.find((objeto) => objeto.id === Number(juego.id));
        }

        const entry = document.createElement('div');
        entry.innerHTML = `
        <div class="game-card" data-id="${juego.id}">
          <img src="${juego.imagen}" alt="${juego.nombre}" />
          <div class="game-card-body">
            <h3>${juego.nombre}</h3>
            <p class="developer">${juego.desarrollador}</p>
            <div class="meta">
              <div>
                <span class="badge badge-platform">${plat}</span>
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
    plataformas.forEach(plataforma => {
        const entry = document.createElement('option');
        entry.value = plataforma.id;
        entry.textContent = plataforma.nombre;
        filtroPlataforma.appendChild(entry);
    })
}

async function renderizarModal(juegoId) {
    modalDetalle.classList.remove('hidden');
    detalleContent.innerHTML = '';
    const juego = await obtenerVideojuegoPorId(juegoId);
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
    favoritos.forEach(fav => {
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
    })
}

async function agregarFavorito(id) {
    const juego = await obtenerVideojuegoPorId(id);
    const favorito = {
      id: juego.id,
      nombre: juego.nombre,
      plataforma: juego.plataforma,
      calificacion: juego.calificacion,
    }
    if (!buscarFavoritos(id)) {
        favoritos.push(favorito);
    } else {
        eliminarFavorito(id);
    }
    guardarFavoritos();
}

function buscarFavoritos(id) {
    return favoritos.find(objeto => objeto.id === Number(id));
}

function eliminarFavorito(id) {
    if (buscarFavoritos(id)) {
        favoritos = favoritos.filter(objeto => objeto.id !== Number(id));
        guardarFavoritos();
    }
    renderizarFavoritos();
    renderizarJuegos();
}

function limpiarFavoritos() {
    favoritos = [];
    localStorage.removeItem('gamehub_favoritos');
    renderizarFavoritos();
}

filtroPlataforma.addEventListener("change", async (e) => {
    e.preventDefault();
    const seleccionado = filtroPlataforma.value;
    videojuegos = [];
    videojuegos = await obtenerVideojuegosPorPlataforma(seleccionado);

    renderizarJuegos(seleccionado);
});

ordenarCalificacion.addEventListener("change", async (e) => {
    e.preventDefault();
    const seleccionado = ordenarCalificacion.value;
    if (seleccionado) {
        if (seleccionado === 'asc') {
            videojuegos.sort((a,b) => {
              if (a.calificacion > b.calificacion) {
                return 1;
              }
              if (a.calificacion < b.calificacion) {
                return -1;
              }
              return 0;
            })
        } else {
          videojuegos.sort((a, b) => {
            if (a.calificacion < b.calificacion) {
              return 1;
            }
            if (a.calificacion > b.calificacion) {
              return -1;
            }
            return 0;
          });
        }
        renderizarJuegos();
    } else {
        videojuegos = await obtenerVideojuegos();
        renderizarJuegos();
    }
});

catalogoGrid.addEventListener("click", async (e) => {
    const juegoId = e.target.closest('.game-card').dataset.id;
    if (!e.target.classList.contains('btn-fav') && !e.target.classList.contains('fa-star')) {
      await renderizarModal(juegoId);
    } else {
      await agregarFavorito(juegoId);
      renderizarJuegos();
    }
});

favoritosLista.addEventListener("click", async (e) => {
    if (!e.target.closest('.btn-quitar-fav')) {
      return;
    }
    const juegoId = e.target.closest('.btn-quitar-fav').dataset.id;

    if (e.target.classList.contains('btn-quitar-fav') || e.target.classList.contains('fa-trash')) {
        eliminarFavorito(juegoId);
    }
})

btnLimpiarFavoritos.addEventListener("click", async (e) => {
    e.preventDefault();
    limpiarFavoritos();
    renderizarJuegos();
});

cerrarModal.forEach((botonModal) => {
    botonModal.addEventListener("click", (e) => {
        modalDetalle.classList.add("hidden");
    });
});

function guardarFavoritos() {
    localStorage.setItem('gamehub_favoritos', JSON.stringify(favoritos));
    renderizarFavoritos();
}

function cargarFavoritos() {
    if (!localStorage.getItem('gamehub_favoritos')) {
      favoritos = [];
    } else {
      favoritos = JSON.parse(localStorage.getItem('gamehub_favoritos'));
    }
}

async function init() {
    videojuegos = await obtenerVideojuegos();
    plataformas = await obtenerPlataformas();
    cargarFavoritos();
    renderizarJuegos();
    renderizarFiltro();
    renderizarFavoritos();
}

init();