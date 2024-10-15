const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 3000;

// Connect to the MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Your MySQL username
  password: '',        // Your MySQL password, if any
  database: 'url_shortener'
});

// Middleware
app.use(cors());
app.use(express.json());

// Generate a short URL
const generateShortURL = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Function to check if short URL already exists
const shortUrlExists = (shortUrl, callback) => {
  const query = 'SELECT COUNT(*) AS count FROM urls WHERE short_url = ?';
  db.query(query, [shortUrl], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0); // Return true if exists
  });
};

// Route to shorten URL
app.post('/shorten', (req, res) => {
  const { original_url, custom_short_url } = req.body;
  
  if (!original_url) {
    return res.status(400).json({ error: 'Original URL is required.' });
  }

  let short_url;

  // Check if a custom short URL is provided
  if (custom_short_url) {
    short_url = custom_short_url;

    shortUrlExists(short_url, (err, exists) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (exists) {
        return res.status(400).json({ error: 'Custom short URL already exists. Please choose a different one.' });
      } else {
        // Proceed to insert the new URL into the database
        const query = 'INSERT INTO urls (original_url, short_url) VALUES (?, ?)';
        db.query(query, [original_url, short_url], (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error.' });
          }
          res.json({ short_url: `http://localhost:3000/${short_url}` });
        });
      }
    });
  } else {
    // Generate a new short URL if no custom short URL is provided
    const insertUrl = () => {
      short_url = generateShortURL();

      shortUrlExists(short_url, (err, exists) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error.' });
        }

        if (exists) {
          // If short URL exists, generate a new one
          return insertUrl();
        } else {
          // Proceed to insert the new URL into the database
          const query = 'INSERT INTO urls (original_url, short_url) VALUES (?, ?)';
          db.query(query, [original_url, short_url], (err, result) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error.' });
            }
            res.json({ short_url: `http://localhost:3000/${short_url}` });
          });
        }
      });
    };

    // Start the insertion process
    insertUrl();
  }
});

// Route to redirect from short URL
app.get('/:short_url', (req, res) => {
  const { short_url } = req.params;

  const query = 'SELECT original_url FROM urls WHERE short_url = ?';
  db.query(query, [short_url], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    res.redirect(results[0].original_url);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
