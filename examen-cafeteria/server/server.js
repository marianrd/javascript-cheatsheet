const express = require('express');
const cors = require('cors');
const path = require('path');
const catalogo = require('./data/cafeteria.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Cafetería de Especialidad corriendo. Menú en /api/productos');
});

// Obtener categorías disponibles
app.get('/api/categorias', (req, res) => {
  res.json(catalogo.categorias);
});

// Obtener opciones de personalización (tamaños, leches y extras)
app.get('/api/adicionales', (req, res) => {
  res.json({
    tamanos: catalogo.tamanos,
    leches: catalogo.leches,
    extras: catalogo.extras,
  });
});

// Obtener productos (con filtro opcional de categoría y precio máximo)
app.get('/api/productos', (req, res) => {
  const { categoria, maxPrecio } = req.query;
  let resultado = catalogo.productos;

  if (categoria) {
    resultado = resultado.filter(
      (p) => p.categoria.toLowerCase() === String(categoria).toLowerCase(),
    );
  }

  if (maxPrecio) {
    resultado = resultado.filter((p) => p.precioBase <= Number(maxPrecio));
  }

  res.json(resultado);
});

// Obtener producto por ID
app.get('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const producto = catalogo.productos.find((p) => p.id === Number(id));

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado en la carta' });
  }

  return res.json({
    ...producto,
    opcionesPersonalizacion: {
      tamanos: catalogo.tamanos,
      leches: catalogo.leches,
      extras: catalogo.extras,
    },
  });
});

app.use('/data', express.static(path.join(__dirname, 'data')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de Cafetería de Especialidad escuchando en http://localhost:${PORT}`);
    console.log(`API Menú: http://localhost:${PORT}/api/productos`);
  });
}

module.exports = app;
