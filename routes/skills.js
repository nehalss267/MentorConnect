const router = require('express').Router();
const { db } = require('../db');

// Get all skills
router.get('/skills', (req, res) => {
    db.all("SELECT * FROM skills ORDER BY category, name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new skill
router.post('/skills', (req, res) => {
    const { name, category } = req.body;
    db.run("INSERT INTO skills (name, category) VALUES (?, ?)", [name, category], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ 
            success: true, 
            message: 'Skill added successfully', 
            skill: { id: this.lastID, name, category } 
        });
    });
});

module.exports = router;
