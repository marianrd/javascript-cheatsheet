const express = require('express');
const cors = require('cors');
const path = require('path');
const data = require('./data/eventos.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Eventos corriendo. Eventos en /api/eventos');
});

// Obtener géneros disponibles
app.get('/api/generos', (req, res) => {
  const generos = [...new Set(data.eventos.map((e) => e.genero))].sort();
  res.json(generos.map((g) => ({ id: g.toLowerCase().replace(/[\s/]+/g, '-'), nombre: g })));
});

// Obtener todos los eventos o filtrar por género
app.get('/api/eventos', (req, res) => {
  const { genero } = req.query;
  let resultado = data.eventos;

  if (genero) {
    resultado = resultado.filter(
      (e) => e.genero.toLowerCase().replace(/[\s/]+/g, '-') === genero.toLowerCase(),
    );
  }

  return res.json(resultado);
});

// Obtener evento por ID
app.get('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const evento = data.eventos.find((e) => e.id === Number(id));

  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }

  return res.json(evento);
});

app.use('/data', express.static(path.join(__dirname, 'data')));

app.listen(PORT, () => {
  console.log(`Servidor de Eventos escuchando en http://localhost:${PORT}`);
  console.log(`API de eventos: http://localhost:${PORT}/api/eventos`);
  console.log(`Géneros: http://localhost:${PORT}/api/generos`);
});
