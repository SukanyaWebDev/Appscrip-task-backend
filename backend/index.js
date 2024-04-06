import express from 'express';
import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 5000;

const db = new sqlite3.Database('mydatabase.db');

app.use(express.json());

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

const fetchAndInsertData = async () => {
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    const data = await response.json();

    const insertStmt = db.prepare('INSERT INTO products (id, title, price, description, category, image) VALUES (?, ?, ?, ?, ?, ?)');

    data.forEach(product => {
      db.get('SELECT * FROM products WHERE id = ?', [product.id], (err, existingProduct) => {
        if (err) {
          console.error('Error checking for existing product:', err);
          return;
        }

        if (!existingProduct) {
          insertStmt.run(product.id, product.title, product.price, product.description, product.category, product.image, (err) => {
            if (err) {
              console.error('Error inserting product:', err);
            }
          });
        }
      });
    });

    insertStmt.finalize();

  } catch (error) {
    console.error('Error fetching product data:', error);
  }
};

fetchAndInsertData();

app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.get(sql, [productId], (err, row) => {
    if (err) {
      console.error('Error fetching product by ID:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (!row) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(row);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
