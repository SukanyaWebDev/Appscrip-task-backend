// Import necessary modules
import express from 'express';
import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';

// Create an Express app
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
const fetchAndInsertData = async () => {
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    const data = await response.json();

    // Prepare SQL statement for inserting data
    const insertStmt = db.prepare('INSERT INTO products (id, title, price, description, category, image) VALUES (?, ?, ?, ?, ?, ?)');

    // Loop through the fetched data and insert each product into the database
    data.forEach(product => {
      // Check if the product ID already exists in the database
      db.get('SELECT * FROM products WHERE id = ?', [product.id], (err, existingProduct) => {
        if (err) {
          console.error('Error checking for existing product:', err);
          return;
        }

        if (!existingProduct) {
          // Insert the product if it doesn't already exist
          insertStmt.run(product.id, product.title, product.price, product.description, product.category, product.image, (err) => {
            if (err) {
              console.error('Error inserting product:', err);
            }
          });
        }
      });
    });

    // Finalize the insert statement
    insertStmt.finalize();

  } catch (error) {
    console.error('Error fetching product data:', error);
  }
};

// Call the function to fetch and insert data on server start
fetchAndInsertData();

// GET /products - Get all products from the database
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
