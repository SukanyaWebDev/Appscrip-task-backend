const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to SQLite database
const db = new sqlite3.Database('mydatabase.db');

// Middleware to parse JSON requests
app.use(express.json());

// Create products table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    price REAL,
    description TEXT,
    category TEXT,
    image TEXT
  )`);
});

// Fetch actual product data from the API and insert into the database
fetch('https://fakestoreapi.com/products')
  .then(response => response.json())
  .then(data => {
    const insertStmt = db.prepare('INSERT INTO products (id, title, price, description, category, image) VALUES (?, ?, ?, ?, ?, ?)');
    data.forEach(product => {
      insertStmt.run(product.id, product.title, product.price, product.description, product.category, product.image);
    });
    insertStmt.finalize();
  })
  .catch(err => console.error('Error fetching product data:', err));

// GET /products - Get all products from the database
app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';
  db.all(sql, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// GET /products/:id - Get product by ID from the database
app.get('/products/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (!row) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(row);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
