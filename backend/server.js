const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'thermo_super_secret_key_dev'; // En production, utiliser process.env

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Base de données PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://postgres.cnazydesrucrfdiylxfo:Allhak2026%40@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'
});

// Wrapper SQLite-like pour minimiser les changements de code
const db = {
  get: async (sql, params, callback) => {
    try {
      if (typeof params === 'function') { callback = params; params = []; }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const { rows } = await pool.query(pgSql, params);
      if (callback) callback(null, rows[0]);
    } catch(err) { if (callback) callback(err, null); }
  },
  all: async (sql, params, callback) => {
    try {
      if (typeof params === 'function') { callback = params; params = []; }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const { rows } = await pool.query(pgSql, params);
      if (callback) callback(null, rows);
    } catch(err) { if (callback) callback(err, null); }
  },
  run: async (sql, params, callback) => {
    try {
      if (typeof params === 'function') { callback = params; params = []; }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      const finalSql = isInsert ? `${pgSql} RETURNING id` : pgSql;
      
      const { rows } = await pool.query(finalSql, params);
      const context = { lastID: isInsert && rows.length ? rows[0].id : null };
      if (callback) callback.call(context, null);
    } catch(err) { 
      if (callback) callback(err); 
    }
  }
};

// Initialisation des tables PostgreSQL
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        label TEXT NOT NULL,
        address_text TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        service TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        details TEXT,
        photo_data TEXT,
        status TEXT DEFAULT 'En attente',
        price REAL DEFAULT 0,
        date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        date_notif TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER REFERENCES reservations(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT
      );
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon_type TEXT DEFAULT 'tool'
      );
      CREATE TABLE IF NOT EXISTS technicians (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        specialty TEXT
      );
    `);
    
    // Insérer les services par défaut
    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM services`);
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`INSERT INTO services (name, description, icon_type) VALUES 
        ('Plomberie', 'Réparation, installation et entretien de vos installations sanitaires.', 'droplet'),
        ('Chauffage', 'Dépannage, pose et maintenance de vos systèmes de chauffage.', 'flame'),
        ('Climatisation', 'Installation, réparation et recharge gaz de vos climatiseurs.', 'snowflake')
      `);
    }
    console.log("Connecté à PostgreSQL (Supabase) !");
  } catch (err) {
    console.error("Erreur d'initialisation Postgres :", err);
  }
};
initDB();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware Admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err || user.role !== 'admin') return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========================
// ROUTES D'AUTHENTIFICATION
// ========================

// Inscription
app.post('/api/auth/register', async (req, res) => {
  const { phone, password, name } = req.body;
  if (!phone || !password || !name) return res.status(400).json({ error: "Champs manquants" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (phone, password, name) VALUES (?, ?, ?)`, [phone, hashedPassword, name], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Ce numéro de téléphone est déjà utilisé." });
        return res.status(500).json({ error: "Erreur serveur" });
      }
      
      const token = jwt.sign({ id: this.lastID, phone, name }, SECRET_KEY, { expiresIn: '7d' });
      res.status(201).json({ message: "Compte créé", token, user: { id: this.lastID, phone, name } });
    });
  } catch(e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Connexion
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Mot de passe incorrect" });
    
    const token = jwt.sign({ id: user.id, phone: user.phone, name: user.name }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
  });
});

// ========================
// ROUTES ESPACE CLIENT
// ========================

// Récupérer le profil
app.get('/api/users/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, phone, name, date_creation FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(row);
  });
});

// Récupérer les adresses du client
app.get('/api/users/addresses', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM addresses WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

// Ajouter une adresse
app.post('/api/users/addresses', authenticateToken, (req, res) => {
  const { label, address_text } = req.body;
  db.run(`INSERT INTO addresses (user_id, label, address_text) VALUES (?, ?, ?)`, [req.user.id, label, address_text], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ id: this.lastID, label, address_text });
  });
});

// Récupérer les réservations du client (Historique et En cours)
app.get('/api/users/reservations', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM reservations WHERE user_id = ? ORDER BY date_reservation DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

// Récupérer les notifications
app.get('/api/users/notifications', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY date_notif DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

// Marquer notif comme lue
app.put('/api/users/notifications/:id/read', authenticateToken, (req, res) => {
  db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ success: true });
  });
});

// Ajouter un avis
app.post('/api/users/reviews', authenticateToken, (req, res) => {
  const { reservation_id, rating, comment } = req.body;
  db.run(`INSERT INTO reviews (reservation_id, user_id, rating, comment) VALUES (?, ?, ?, ?)`, 
  [reservation_id, req.user.id, rating, comment], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ success: true });
  });
});

// ========================
// ROUTES RESERVATION (Publique / Authentifiée)
// ========================

// Récupérer la liste des services disponibles
app.get('/api/services', (req, res) => {
  db.all(`SELECT * FROM services`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

// Récupérer les avis publics (5 étoiles par exemple) pour la page d'accueil
app.get('/api/reviews/public', (req, res) => {
  const query = `
    SELECT r.rating, r.comment, u.name 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.rating >= 4 
    ORDER BY r.id DESC 
    LIMIT 5
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

// Créer une réservation (peut être liée à un user si le token est fourni, sinon anonyme)
app.post('/api/reservations', (req, res) => {
  const { service, name, phone, address, details, photo_data } = req.body;
  let user_id = null;
  
  // Tentative de récupérer l'utilisateur si token présent (sans forcer l'erreur si absent)
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      user_id = decoded.id;
    } catch(e) {
      // Token invalide, on laisse user_id = null
    }
  }

  const query = `INSERT INTO reservations (user_id, service, name, phone, address, details, photo_data, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'En attente')`;
  db.run(query, [user_id, service, name, phone, address, details, photo_data || null], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.status(201).json({ message: "Réservation enregistrée", id: this.lastID });
  });
});

// ========================
// ROUTES ADMIN
// ========================

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  // Mot de passe admin codé en dur (simplifié pour cet exemple)
  if (password === 'admin') {
    const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Mot de passe incorrect" });
  }
});

app.get('/api/admin/reservations', authenticateAdmin, (req, res) => {
  db.all(`SELECT * FROM reservations ORDER BY date_reservation DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

app.put('/api/admin/reservations/:id/status', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status, price } = req.body;
  
  const query = price !== undefined ? `UPDATE reservations SET status = ?, price = ? WHERE id = ?` : `UPDATE reservations SET status = ? WHERE id = ?`;
  const params = price !== undefined ? [status, price, id] : [status, id];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    
    // Si c'est lié à un user, on crée une notification in-app
    db.get(`SELECT user_id, phone, name FROM reservations WHERE id = ?`, [id], (err, row) => {
      if (row && row.user_id) {
        db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`, 
        [row.user_id, `Le statut de votre intervention est passé à : ${status}`]);
      }
      
      // Simulation d'envoi de SMS (pour tout client, même anonyme)
      let smsSent = false;
      let smsText = "";
      if (row && row.phone) {
        smsSent = true;
        smsText = `SERVICE-GO : Bonjour ${row.name || 'Client'}, le statut de votre réservation est maintenant : ${status}`;
        // On pourrait logger ça dans une table sms_logs
        console.log(`[SIMULATION SMS] Vers ${row.phone}: ${smsText}`);
      }

      res.json({ message: "Statut mis à jour", smsSent, phone: row?.phone, smsText });
    });
  });
});

app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {
    clients: 0,
    technicians: 0, 
    reservationsToday: 0,
    completed: 0,
    revenue: 0
  };

  db.get(`SELECT COUNT(*) as count FROM technicians`, [], (err, row) => {
    if (row) stats.technicians = row.count;

    db.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
      if (row) stats.clients = row.count;
      
      db.get(`SELECT COUNT(*) as count FROM reservations WHERE DATE(date_reservation) = CURRENT_DATE`, [], (err, row) => {
        if (row) stats.reservationsToday = row.count;
        
        db.get(`SELECT COUNT(*) as count, SUM(price) as total FROM reservations WHERE status = 'Terminée'`, [], (err, row) => {
          if (row) {
            stats.completed = row.count;
            stats.revenue = row.total || 0;
          }
          res.json(stats);
        });
      });
    });
  });
});

app.delete('/api/admin/reservations/:id', authenticateAdmin, (req, res) => {
  db.run(`DELETE FROM reservations WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ message: "Supprimée" });
  });
});

// Admin : Services
app.post('/api/admin/services', authenticateAdmin, (req, res) => {
  const { name, description, icon_type } = req.body;
  db.run(`INSERT INTO services (name, description, icon_type) VALUES (?, ?, ?)`, [name, description, icon_type || 'tool'], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.status(201).json({ id: this.lastID });
  });
});

app.delete('/api/admin/services/:id', authenticateAdmin, (req, res) => {
  db.run(`DELETE FROM services WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ message: "Supprimé" });
  });
});

// Admin : Technicians
app.get('/api/admin/technicians', authenticateAdmin, (req, res) => {
  db.all(`SELECT * FROM technicians`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(rows);
  });
});

app.post('/api/admin/technicians', authenticateAdmin, (req, res) => {
  const { name, phone, specialty } = req.body;
  db.run(`INSERT INTO technicians (name, phone, specialty) VALUES (?, ?, ?)`, [name, phone, specialty], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.status(201).json({ id: this.lastID });
  });
});

app.delete('/api/admin/technicians/:id', authenticateAdmin, (req, res) => {
  db.run(`DELETE FROM technicians WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json({ message: "Supprimé" });
  });
});
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
