const express = require('express');
const cors = require('cors');
const path = require('path');
const catalogo = require('./data/videojuegos.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de GameHub corriendo. Catálogo en /api/videojuegos');
});

// Obtener plataformas disponibles
app.get('/api/plataformas', (req, res) => {
  const plataformas = Object.keys(catalogo).map((nombre) => ({
    id: nombre.toLowerCase().replace(/\s+/g, '-'),
    nombre,
  }));
  res.json(plataformas);
});

// Obtener videojuegos (opcionalmente filtrados por plataforma)
app.get('/api/videojuegos', (req, res) => {
  const { plataforma } = req.query;

  if (plataforma) {
    const plataformaKey = Object.keys(catalogo).find(
      (k) => k.toLowerCase() === plataforma.toLowerCase(),
    );
    if (!plataformaKey) {
      return res.status(404).json({ error: 'Plataforma no encontrada' });
    }
    return res.json(catalogo[plataformaKey]);
  }

  // Si no hay filtro, devolver todos los juegos con su plataforma
  const todos = [];
  Object.entries(catalogo).forEach(([plat, juegos]) => {
    juegos.forEach((juego) => {
      todos.push({ ...juego, plataforma: plat });
    });
  });
  return res.json(todos);
});

// Obtener videojuego por ID
app.get('/api/videojuegos/:id', (req, res) => {
  const { id } = req.params;
  let encontrado = null;

  Object.entries(catalogo).forEach(([plat, juegos]) => {
    const juego = juegos.find((j) => j.id === Number(id));
    if (juego) {
      encontrado = { ...juego, plataforma: plat };
    }
  });

  if (!encontrado) {
    return res.status(404).json({ error: 'Videojuego no encontrado' });
  }

  return res.json(encontrado);
});

app.use('/data', express.static(path.join(__dirname, 'data')));

app.listen(PORT, () => {
  console.log(`Servidor de GameHub escuchando en http://localhost:${PORT}`);
  console.log(`API de videojuegos: http://localhost:${PORT}/api/videojuegos`);
  console.log(`Plataformas: http://localhost:${PORT}/api/plataformas`);
});
