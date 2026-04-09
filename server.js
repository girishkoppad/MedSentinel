import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure the app can be run with a default single-origin API base path
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return next();
});

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

  // Only seed if DB is empty (prevents duplicates on restart)
  db.get('SELECT COUNT(*) as count FROM hospitals', (err, row) => {
    if (err || row.count > 0) return;
  // Insert sample data - Real Karnataka Hospitals from PM-JAY and Aarogya Karnataka
  const hospitals = [
    // Bengaluru Government Hospitals
    ['KC General Hospital', 'Malleshwaram, Bengaluru', 'General Surgery, ENT, Orthopedics', 4.2, 3.5, '₹15,000 - ₹45,000', 'Ayushman Bharat,Aarogya Karnataka,PMJAY', 'hospital1.jpg', '24/7 ER,ICU,General Ward,OPD'],
    ['Yelahanka General Hospital', 'Yelahanka, Bengaluru', 'General Medicine, Pediatrics', 4.0, 8.2, '₹10,000 - ₹35,000', 'Ayushman Bharat,Aarogya Karnataka', 'hospital2.jpg', '24/7 ER,Pharmacy,Lab'],
    ['Victoria Hospital', 'Fort, Bengaluru', 'Multispecialty, Trauma Care', 4.3, 2.1, '₹12,000 - ₹50,000', 'Ayushman Bharat,PMJAY,ESI', 'hospital3.jpg', '24/7 ER,ICU,Trauma Center,Blood Bank'],
    ['Bowring and Lady Curzon Hospital', 'Shivaji Nagar, Bengaluru', 'Obstetrics, Gynecology, Pediatrics', 4.1, 3.8, '₹8,000 - ₹30,000', 'Ayushman Bharat,Aarogya Karnataka', 'hospital4.jpg', 'Maternity Ward,NICU,OPD'],
    ['Vani Vilas Hospital', 'KR Market, Bengaluru', 'General Surgery, Orthopedics', 3.9, 4.2, '₹10,000 - ₹40,000', 'Ayushman Bharat,PMJAY', 'hospital5.jpg', '24/7 ER,General Ward,OT'],
    
    // Bengaluru Private Empanelled Hospitals
    ['Manipal Hospital', 'HAL Airport Road, Bengaluru', 'Cardiology, Neurology, Oncology', 4.8, 6.5, '₹50,000 - ₹2,50,000', 'Ayushman Bharat,PMJAY,CGHS,ESI', 'hospital6.jpg', '24/7 ER,ICU,Cath Lab,Advanced Diagnostics'],
    ['Narayana Health City', 'Bommasandra, Bengaluru', 'Cardiac Surgery, Multispecialty', 4.7, 15.3, '₹40,000 - ₹2,00,000', 'Ayushman Bharat,PMJAY,Aarogya Karnataka', 'hospital7.jpg', 'Cardiac Care,ICU,Dialysis,Transplant'],
    ['Apollo Hospital', 'Bannerghatta Road, Bengaluru', 'Multispecialty, Oncology', 4.9, 9.8, '₹60,000 - ₹3,00,000', 'Ayushman Bharat,CGHS,ESI', 'hospital8.jpg', '24/7 ER,ICU,Cancer Center,Robotic Surgery'],
    ['Fortis Hospital', 'Bannerghatta Road, Bengaluru', 'Orthopedics, Neurosurgery', 4.6, 10.2, '₹55,000 - ₹2,80,000', 'Ayushman Bharat,PMJAY,CGHS', 'hospital9.jpg', '24/7 ER,Neuro ICU,Joint Replacement'],
    ['Columbia Asia Hospital', 'Whitefield, Bengaluru', 'General Surgery, Pediatrics', 4.5, 12.7, '₹35,000 - ₹1,50,000', 'Ayushman Bharat,ESI', 'hospital10.jpg', '24/7 ER,ICU,Pediatric Ward'],
    
    // Uttara Kannada District
    ['24X7 Hi-Tech Lifeline Hospital', 'Karwar, Uttara Kannada', 'Emergency Care, General Medicine', 4.1, 485.0, '₹15,000 - ₹60,000', 'Ayushman Bharat,PMJAY', 'hospital11.jpg', '24/7 ER,ICU,Ambulance'],
    ['District Hospital Karwar', 'Karwar, Uttara Kannada', 'General Surgery, Obstetrics', 3.8, 487.0, '₹10,000 - ₹35,000', 'Ayushman Bharat,Aarogya Karnataka', 'hospital12.jpg', '24/7 ER,Maternity,OPD'],
    
    // Mysuru District
    ['JSS Hospital', 'Mysuru', 'Multispecialty, Cardiology', 4.6, 145.0, '₹30,000 - ₹1,20,000', 'Ayushman Bharat,PMJAY,ESI', 'hospital13.jpg', '24/7 ER,ICU,Cardiac Care'],
    ['Apollo BGS Hospital', 'Mysuru', 'Oncology, Neurology', 4.7, 147.0, '₹45,000 - ₹2,00,000', 'Ayushman Bharat,CGHS', 'hospital14.jpg', 'Cancer Center,Neuro ICU,Diagnostics'],
    
    // Mangaluru District
    ['KMC Hospital', 'Mangaluru', 'Multispecialty, Nephrology', 4.5, 352.0, '₹35,000 - ₹1,80,000', 'Ayushman Bharat,PMJAY,ESI', 'hospital15.jpg', '24/7 ER,Dialysis,ICU'],
    ['AJ Hospital', 'Mangaluru', 'Orthopedics, General Surgery', 4.4, 355.0, '₹25,000 - ₹1,00,000', 'Ayushman Bharat,Aarogya Karnataka', 'hospital16.jpg', '24/7 ER,OT,Physiotherapy'],
    
    // Hubli-Dharwad
    ['KIMS Hospital', 'Hubli', 'Cardiology, Neurosurgery', 4.6, 410.0, '₹40,000 - ₹1,90,000', 'Ayushman Bharat,PMJAY,CGHS', 'hospital17.jpg', 'Cardiac Cath Lab,Neuro ICU,24/7 ER'],
    ['SDM Hospital', 'Dharwad', 'General Medicine, Pediatrics', 4.3, 420.0, '₹20,000 - ₹80,000', 'Ayushman Bharat,ESI', 'hospital18.jpg', '24/7 ER,Pediatric ICU,OPD'],
    
    // Belgaum District
    ['KLE Hospital', 'Belgaum', 'Multispecialty, Oncology', 4.5, 502.0, '₹35,000 - ₹1,60,000', 'Ayushman Bharat,PMJAY', 'hospital19.jpg', 'Cancer Center,ICU,24/7 ER'],
    ['District Hospital Belgaum', 'Belgaum', 'General Surgery, Obstetrics', 3.9, 505.0, '₹12,000 - ₹45,000', 'Ayushman Bharat,Aarogya Karnataka', 'hospital20.jpg', 'Maternity Ward,OT,OPD']
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
  }); // end count check
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

  query += ' LIMIT 20';

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

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use.`);
    const fallbackPort = PORT === 3000 ? 3001 : 3000;
    console.log(`➡️ Attempting to listen on fallback port ${fallbackPort}...`);

    app.listen(fallbackPort, () => {
      console.log(`✅ Server running on http://localhost:${fallbackPort}`);
    }).on('error', (err2) => {
      console.error(`❌ Fallback port ${fallbackPort} also failed:`, err2.message);
      process.exit(1);
    });

  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});
