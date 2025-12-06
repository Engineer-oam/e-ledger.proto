
/**
 * E-Ledger Backend Server
 * 
 * Tech Stack: Node.js, Express, SQLite3
 * Purpose: Provides a solid, persistent backend for the E-Ledger Blockchain application.
 * 
 * Setup:
 * 1. npm init -y
 * 2. npm install express sqlite3 cors body-parser uuid
 * 3. node server.js
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Initialization
const dbPath = path.resolve(__dirname, 'eledger.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Connection Error:', err.message);
  else console.log('Connected to E-Ledger SQLite Database at', dbPath);
});

// Schema Setup
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    gln TEXT UNIQUE,
    orgName TEXT,
    password TEXT
  )`);

  // Batches Table (The "Ledger")
  db.run(`CREATE TABLE IF NOT EXISTS batches (
    batchID TEXT PRIMARY KEY,
    gtin TEXT,
    lotNumber TEXT,
    expiryDate TEXT,
    quantity INTEGER,
    unit TEXT,
    productName TEXT,
    manufacturerGLN TEXT,
    currentOwnerGLN TEXT,
    intendedRecipientGLN TEXT,
    status TEXT,
    integrityHash TEXT,
    trace JSON
  )`);

  // Logistics Units (SSCC)
  db.run(`CREATE TABLE IF NOT EXISTS logistics_units (
    sscc TEXT PRIMARY KEY,
    creatorGLN TEXT,
    status TEXT,
    contents JSON,
    createdDate TEXT,
    txHash TEXT
  )`);

  // VRS Requests
  db.run(`CREATE TABLE IF NOT EXISTS vrs_requests (
    reqID TEXT PRIMARY KEY,
    requesterGLN TEXT,
    responderGLN TEXT,
    gtin TEXT,
    serialOrLot TEXT,
    timestamp TEXT,
    status TEXT,
    responseMessage TEXT
  )`);
});

// Helper for safe JSON parsing
const safeParse = (str) => {
  try {
    return str ? JSON.parse(str) : [];
  } catch (e) {
    console.warn("JSON Parse Error:", e.message);
    return [];
  }
};

// --- API ROUTES ---

// Health Check
app.get('/', (req, res) => {
  res.status(200).send('E-Ledger Backend is Running. API available at /api');
});

// 1. AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { gln, password } = req.body;
  console.log(`Login attempt for GLN: ${gln}`);
  db.get('SELECT * FROM users WHERE gln = ? AND password = ?', [gln, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid GLN or password' });
    const { password: _, ...user } = row;
    res.json(user);
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, orgName, gln, role, password } = req.body;
  console.log(`Signup attempt for GLN: ${gln}`);
  const id = uuidv4();
  db.run(
    'INSERT INTO users (id, name, role, gln, orgName, password) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, role, gln, orgName, password],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'GLN already registered' });
        return res.status(500).json({ error: err.message });
      }
      res.json({ id, name, role, gln, orgName });
    }
  );
});

// 2. BATCH OPERATIONS
app.get('/api/batches', (req, res) => {
  const { gln, role } = req.query;
  
  const queryCallback = (err, rows) => {
    if (err) {
      console.error("Batch Fetch Error:", err);
      return res.status(500).json({ error: err.message });
    }
    const parsed = rows.map(r => ({ ...r, trace: safeParse(r.trace) }));
    
    // Filtering logic (if not regulator)
    if (role === 'REGULATOR' || role === 'AUDITOR') {
      res.json(parsed);
    } else {
      const filtered = parsed.filter(b => 
        b.currentOwnerGLN === gln || 
        b.manufacturerGLN === gln || 
        b.intendedRecipientGLN === gln || 
        b.trace.some(t => t.actorGLN === gln)
      );
      res.json(filtered);
    }
  };

  db.all('SELECT * FROM batches', [], queryCallback);
});

app.get('/api/batches/:id', (req, res) => {
  db.get('SELECT * FROM batches WHERE batchID = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Batch not found' });
    res.json({ ...row, trace: safeParse(row.trace) });
  });
});

app.post('/api/batches', (req, res) => {
  const b = req.body;
  console.log(`Creating batch: ${b.batchID}`);
  db.run(
    `INSERT INTO batches (batchID, gtin, lotNumber, expiryDate, quantity, unit, productName, manufacturerGLN, currentOwnerGLN, status, integrityHash, trace)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.batchID, b.gtin, b.lotNumber, b.expiryDate, b.quantity, b.unit, b.productName, b.manufacturerGLN, b.currentOwnerGLN, b.status, b.integrityHash, JSON.stringify(b.trace)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: 'success', batchID: b.batchID });
    }
  );
});

// Generic Batch Update
app.put('/api/batches/:id', (req, res) => {
  const { status, currentOwnerGLN, intendedRecipientGLN, trace } = req.body;
  const id = req.params.id;

  db.run(
    `UPDATE batches SET status = ?, currentOwnerGLN = ?, intendedRecipientGLN = ?, trace = ? WHERE batchID = ?`,
    [status, currentOwnerGLN, intendedRecipientGLN, JSON.stringify(trace), id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: 'success' });
    }
  );
});

// 3. LOGISTICS UNITS
app.get('/api/sscc', (req, res) => {
  const { gln } = req.query;
  db.all('SELECT * FROM logistics_units WHERE creatorGLN = ?', [gln], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(r => ({ ...r, contents: safeParse(r.contents) }));
    res.json(parsed);
  });
});

app.post('/api/sscc', (req, res) => {
  const u = req.body;
  db.run(
    `INSERT INTO logistics_units (sscc, creatorGLN, status, contents, createdDate, txHash) VALUES (?, ?, ?, ?, ?, ?)`,
    [u.sscc, u.creatorGLN, u.status, JSON.stringify(u.contents), u.createdDate, u.txHash],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: 'success' });
    }
  );
});

// 4. VRS / VERIFICATION
app.post('/api/vrs', (req, res) => {
  const r = req.body;
  db.run(
    `INSERT INTO vrs_requests (reqID, requesterGLN, responderGLN, gtin, serialOrLot, timestamp, status, responseMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.reqID, r.requesterGLN, r.responderGLN, r.gtin, r.serialOrLot, r.timestamp, r.status, r.responseMessage],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json(r);
    }
  );
});

app.get('/api/vrs', (req, res) => {
  const { gln } = req.query;
  db.all('SELECT * FROM vrs_requests WHERE requesterGLN = ? OR responderGLN = ?', [gln, gln], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`E-Ledger Backend running on http://localhost:${PORT}`);
});
