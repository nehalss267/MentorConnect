const router = require('express').Router();
const { db } = require('../db');

// Create session
router.post('/sessions', (req, res) => {
    const { youth_id, mentor_id, topic, description, scheduled_date, duration } = req.body;
    db.run(
        "INSERT INTO sessions (youth_id, mentor_id, topic, description, scheduled_date, duration) VALUES (?, ?, ?, ?, ?, ?)",
        [youth_id, mentor_id, topic, description, scheduled_date, duration],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ 
                success: true,
                message: 'Session requested successfully', 
                session: { id: this.lastID, youth_id, mentor_id, topic, status: 'pending' } 
            });
        }
    );
});

// Get sessions for a specific user (both youth and mentor)
router.get('/sessions/user/:userId', (req, res) => {
    db.all(`
        SELECT s.*, youth.name as youth_name, mentor.name as mentor_name
        FROM sessions s
        LEFT JOIN users youth ON s.youth_id = youth.id
        LEFT JOIN users mentor ON s.mentor_id = mentor.id
        WHERE s.youth_id = ? OR s.mentor_id = ?
        ORDER BY s.created_at DESC
    `, [req.params.userId, req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update session status, rating, or feedback
router.put('/sessions/:id', (req, res) => {
    const { status, rating, feedback } = req.body;
    
    let queryParts = [];
    let params = [];
    
    if (status !== undefined) {
        queryParts.push("status = ?");
        params.push(status);
    }
    if (rating !== undefined) {
        queryParts.push("rating = ?");
        params.push(rating);
    }
    if (feedback !== undefined) {
        queryParts.push("feedback = ?");
        params.push(feedback);
    }
    
    if (queryParts.length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
    }
    
    params.push(req.params.id);
    const query = `UPDATE sessions SET ${queryParts.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Session not found' });
        res.json({ success: true, message: 'Session updated successfully' });
    });
});

module.exports = router;
