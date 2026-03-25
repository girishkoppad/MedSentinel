import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./medsentinel.db', (err) => {
  if (err) console.error(err);
  else console.log('Database connected');
});

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    specialization TEXT,
    rating REAL,
    distance REAL,
    cost_range TEXT,
    schemes TEXT,
    image_url TEXT,
    facilities TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    blood_group TEXT,
    allergies TEXT,
    emergency_contact TEXT,
    schemes TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    coverage TEXT,
    eligibility TEXT,
    type TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saved_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    hospital_id INTEGER,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample data
  const hospitals = [
    ['Apollo Multispeciality', 'Navi Mumbai', 'Multispecialty', 4.8, 2.4, '₹85,000', 'Ayushman Bharat,ESI', 'hospital1.jpg', '24/7 ER,ICU,Pharmacy'],
    ['Fortis Healthcare', 'Mulund West', 'Cardiology', 4.6, 5.1, '₹92,400', 'CGHS,PMJAY', 'hospital2.jpg', '24/7 ER,Cardiac Lab'],
    ['Max Super Speciality', 'South Delhi', 'Multispecialty', 4.8, 1.2, '₹145,000', 'Ayushman Bharat,CGHS', 'hospital3.jpg', '24/7 ER,ICU,Diagnostics'],
    ['Manipal Hospitals', 'Whitefield', 'Cardiology', 4.9, 5.1, '₹182,000', 'PMJAY,CGHS', 'hospital4.jpg', 'Cardiac Care,ICU'],
    ['Narayana Health', 'Hosur Road', 'Cardiac', 4.7, 12, '₹115,000', 'Ayushman Bharat,NABH', 'hospital5.jpg', 'Cardiac Surgery,ICU']
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO hospitals (name, location, specialization, rating, distance, cost_range, schemes, image_url, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  hospitals.forEach(h => stmt.run(h));
  stmt.finalize();

  const schemes = [
    ['Ayushman Bharat (PM-JAY)', 'Health cover of Rs. 5 lakhs per family per year', '₹5,00,000', 'Low income families (SECC 2011)', 'National'],
    ['MJPJAY Maharashtra', 'State health insurance for Maharashtra residents', '₹1,50,000', 'Yellow/Orange ration card holders', 'State'],
    ['ESIC', 'Medical care for insured persons and families', 'Comprehensive', 'Employees earning up to ₹21,000/month', 'National'],
    ['CGHS', 'Central Government Health Scheme', 'Comprehensive', 'Central Govt employees', 'National']
  ];

  const schemeStmt = db.prepare('INSERT OR IGNORE INTO schemes (name, description, coverage, eligibility, type) VALUES (?, ?, ?, ?, ?)');
  schemes.forEach(s => schemeStmt.run(s));
  schemeStmt.finalize();
});

// API Routes
app.get('/api/hospitals', (req, res) => {
  const { search, specialization, maxDistance, minRating, scheme } = req.query;
  let query = 'SELECT * FROM hospitals WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR location LIKE ? OR specialization LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (specialization) {
    query += ' AND specialization LIKE ?';
    params.push(`%${specialization}%`);
  }
  if (maxDistance) {
    query += ' AND distance <= ?';
    params.push(maxDistance);
  }
  if (minRating) {
    query += ' AND rating >= ?';
    params.push(minRating);
  }
  if (scheme) {
    query += ' AND schemes LIKE ?';
    params.push(`%${scheme}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/hospitals/:id', (req, res) => {
  db.get('SELECT * FROM hospitals WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.get('/api/schemes', (req, res) => {
  db.all('SELECT * FROM schemes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, phone, blood_group, allergies, emergency_contact } = req.body;
  db.run('INSERT INTO users (name, email, phone, blood_group, allergies, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, blood_group, allergies, emergency_contact],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/users/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/saved-items', (req, res) => {
  const { user_id, hospital_id } = req.body;
  db.run('INSERT INTO saved_items (user_id, hospital_id) VALUES (?, ?)',
    [user_id, hospital_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/saved-items/:userId', (req, res) => {
  db.all(`SELECT h.* FROM hospitals h 
          JOIN saved_items s ON h.id = s.hospital_id 
          WHERE s.user_id = ?`, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/saved-items/:userId/:hospitalId', (req, res) => {
  db.run('DELETE FROM saved_items WHERE user_id = ? AND hospital_id = ?',
    [req.params.userId, req.params.hospitalId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.post('/api/eligibility-check', (req, res) => {
  const { familySize, location, income, conditions } = req.body;
  const eligible = [];
  
  if (income === 'low') {
    eligible.push({ scheme: 'Ayushman Bharat', probability: 94 });
  }
  if (location === 'urban' || location === 'rural') {
    eligible.push({ scheme: 'State Health Scheme', probability: 78 });
  }
  
  res.json({ eligible });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
