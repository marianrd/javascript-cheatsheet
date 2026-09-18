const express = require('express');
const cors = require('cors');
const path = require('path');
const catalogo = require('./data/mascotas.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Adopción de Mascotas corriendo. Animales en /api/animales');
});

// Obtener especies disponibles
app.get('/api/especies', (req, res) => {
  res.json(catalogo.especies);
});

// Obtener rangos de edad disponibles
app.get('/api/edades', (req, res) => {
  res.json(catalogo.edades);
});

// Obtener refugios colaboradores
app.get('/api/refugios', (req, res) => {
  res.json(catalogo.refugios);
});

// Obtener animales (con filtros opcionales de especie, edad y refugio)
app.get('/api/animales', (req, res) => {
  const { especie, edad, refugio } = req.query;
  let resultado = catalogo.animales;

  if (especie) {
    resultado = resultado.filter((a) => a.especie.toLowerCase() === String(especie).toLowerCase());
  }

  if (edad) {
    resultado = resultado.filter((a) => a.edad.toLowerCase() === String(edad).toLowerCase());
  }

  if (refugio) {
    resultado = resultado.filter(
      (a) =>
        a.refugioId === Number(refugio) ||
        a.refugio.toLowerCase() === String(refugio).toLowerCase(),
    );
  }

  res.json(resultado);
});

// Obtener ficha de animal por ID
app.get('/api/animales/:id', (req, res) => {
  const { id } = req.params;
  const animal = catalogo.animales.find((a) => a.id === Number(id));

  if (!animal) {
    return res.status(404).json({ error: 'Animal no encontrado en la base de datos' });
  }

  const refugioAsociado = catalogo.refugios.find((r) => r.id === animal.refugioId) || null;

  return res.json({
    ...animal,
    datosRefugio: refugioAsociado,
  });
});

app.use('/data', express.static(path.join(__dirname, 'data')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de Adopción de Mascotas escuchando en http://localhost:${PORT}`);
    console.log(`API Animales: http://localhost:${PORT}/api/animales`);
  });
}

module.exports = app;
