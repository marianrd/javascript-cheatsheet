const express = require('express');
const cors = require('cors');
const path = require('path');
const catalogo = require('./data/inmobiliaria.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Inmobiliaria Vivienda Ideal corriendo. Catálogo en /api/propiedades');
});

// Obtener tipos de propiedad disponibles
app.get('/api/tipos', (req, res) => {
  res.json(catalogo.tipos);
});

// Obtener propiedades (con filtro opcional de tipo)
app.get('/api/propiedades', (req, res) => {
  const { tipo } = req.query;
  let resultado = catalogo.propiedades;

  if (tipo) {
    resultado = resultado.filter((p) => p.tipo.toLowerCase() === String(tipo).toLowerCase());
  }

  res.json(resultado);
});

// Obtener propiedad por ID
app.get('/api/propiedades/:id', (req, res) => {
  const { id } = req.params;
  const propiedad = catalogo.propiedades.find((p) => p.id === Number(id));

  if (!propiedad) {
    return res.status(404).json({ error: 'Propiedad no encontrada en el catálogo' });
  }

  return res.json(propiedad);
});

app.use('/data', express.static(path.join(__dirname, 'data')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de Inmobiliaria Vivienda Ideal escuchando en http://localhost:${PORT}`);
    console.log(`API Propiedades: http://localhost:${PORT}/api/propiedades`);
  });
}

module.exports = app;
