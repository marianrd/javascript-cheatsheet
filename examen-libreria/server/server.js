const express = require('express');
const cors = require('cors');
const path = require('path');
const catalogo = require('./data/libreria.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Librería Página Suelta corriendo. Catálogo en /api/libros');
});

// Obtener categorías disponibles
app.get('/api/categorias', (req, res) => {
  res.json(catalogo.categorias);
});

// Obtener libros (con filtro opcional de categoría)
app.get('/api/libros', (req, res) => {
  const { categoria } = req.query;
  let resultado = catalogo.libros;

  if (categoria) {
    resultado = resultado.filter(
      (l) => l.categoria.toLowerCase() === String(categoria).toLowerCase(),
    );
  }

  res.json(resultado);
});

// Obtener libro por ID
app.get('/api/libros/:id', (req, res) => {
  const { id } = req.params;
  const libro = catalogo.libros.find((l) => l.id === Number(id));

  if (!libro) {
    return res.status(404).json({ error: 'Libro no encontrado en el catálogo' });
  }

  return res.json(libro);
});

app.use('/data', express.static(path.join(__dirname, 'data')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de Librería Página Suelta escuchando en http://localhost:${PORT}`);
    console.log(`API Libros: http://localhost:${PORT}/api/libros`);
  });
}

module.exports = app;
