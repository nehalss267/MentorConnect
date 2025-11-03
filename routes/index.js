const router = require('express').Router();
const { db } = require('../db');

// Mount other routers
router.use(require('./users'));
router.use(require('./sessions'));
router.use(require('./skills'));

// DASHBOARD STATS
router.get('/stats', (req, res) => {
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'youth') as youth_count,
            (SELECT COUNT(*) FROM users WHERE role = 'mentor') as mentor_count,
            (SELECT COUNT(*) FROM sessions) as total_sessions,
            (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as completed_sessions
    `, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

module.exports = router;
