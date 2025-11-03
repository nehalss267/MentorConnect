const router = require('express').Router();
const { db } = require('../db'); // Import the db connection

// Register user
router.post('/register', (req, res) => {
    const { name, email, password, role, age, location, bio, skills, education, experience } = req.body;
    
    db.run(
        "INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, email, password, role, age || null, location, bio, skills, education, experience],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ 
                success: true,
                message: 'User registered successfully', 
                user: { id: this.lastID, name, email, role } 
            });
        }
    );
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(
        "SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: 'Invalid email or password' });
            res.json({ success: true, message: 'Login successful', user });
        }
    );
});

// Get all mentors
router.get('/mentors', (req, res) => {
    db.all("SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE role = 'mentor' ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get all youth
router.get('/youth', (req, res) => {
    db.all("SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE role = 'youth' ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get user by ID
router.get('/users/:id', (req, res) => {
    db.get("SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE id = ?", [req.params.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
});

// Update user profile
router.put('/users/:id', (req, res) => {
    const { name, age, location, bio, skills, education, experience } = req.body;
    db.run(
        "UPDATE users SET name = ?, age = ?, location = ?, bio = ?, skills = ?, education = ?, experience = ? WHERE id = ?",
        [name, age, location, bio, skills, education, experience, req.params.id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, message: 'Profile updated successfully' });
        }
    );
});

module.exports = router;
