const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'mentor_system.db');

const ROLES = ['youth', 'mentor'];
const SESSION_STATUSES = ['pending', 'accepted', 'declined', 'completed', 'cancelled'];

// --- Middleware ---
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' }
});

if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not set. Using a development secret - set it in production.');
}
app.use(session({
    secret: process.env.SESSION_SECRET || 'mentor-connect-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// --- Database ---
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database:', DB_PATH);
    }
});

db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('youth', 'mentor')),
        age INTEGER CHECK (age IS NULL OR (age >= 10 AND age <= 100)),
        location TEXT,
        bio TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_id INTEGER NOT NULL,
        mentor_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
        scheduled_date TEXT,
        duration INTEGER,
        rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_youth ON sessions (youth_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON sessions (mentor_id)');

    db.run(`CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    seedData();
});

function seedData() {
    db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
        if (err || row.count > 0) {
            return;
        }
        const sampleUsers = [
            ['Janaki Student', 'student@demo.com', 'youth', 18, 'Bangalore', 'High school student looking for guidance', 'Math, Science', 'High School', 'Looking for opportunities'],
            ['Swetha Mentor', 'mentor@demo.com', 'mentor', 32, 'Chennai', 'Experienced software engineer', 'Programming, Web Development, Career Guidance', 'B.Tech Computer Science', '8 years in IT industry'],
            ['Raj Advisor', 'raj@demo.com', 'mentor', 35, 'Mumbai', 'Business consultant and career coach', 'Business, Marketing, Entrepreneurship', 'MBA', '10 years in business consulting'],
            ['Priya Youth', 'priya@demo.com', 'youth', 20, 'Delhi', 'College student seeking career direction', 'Arts, Design, Communication', 'B.A. Psychology', 'Internship experience'],
            ['Kumar Mentor', 'kumar@demo.com', 'mentor', 40, 'Hyderabad', 'Industry expert in digital marketing', 'Digital Marketing, SEO, Social Media', 'M.Sc. Marketing', '15 years in digital marketing']
        ];

        bcrypt.hash('demo123', 10, (hashErr, hash) => {
            if (hashErr) {
                console.error('Error hashing sample passwords:', hashErr);
                return;
            }
            db.serialize(() => {
                sampleUsers.forEach(user => {
                    db.run(
                        'INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [user[0], user[1], hash, user[2], user[3], user[4], user[5], user[6], user[7], user[8]]
                    );
                });

                const sampleSkills = [
                    ['Programming', 'Technical'],
                    ['Web Development', 'Technical'],
                    ['Career Guidance', 'Professional'],
                    ['Business', 'Professional'],
                    ['Marketing', 'Professional'],
                    ['Mathematics', 'Academic'],
                    ['Science', 'Academic'],
                    ['Design', 'Creative'],
                    ['Communication', 'Soft Skills'],
                    ['Leadership', 'Soft Skills']
                ];
                sampleSkills.forEach(skill => {
                    db.run('INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)', skill);
                });
            });

            console.log('Sample data inserted successfully');
        });
    });
}

// --- Helpers ---

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateRegistration(body) {
    const errors = [];
    const { name, email, password, role } = body;

    if (!isNonEmptyString(name) || name.trim().length > 100) {
        errors.push('Name is required (max 100 characters)');
    }
    if (!isNonEmptyString(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 255) {
        errors.push('A valid email is required');
    }
    if (typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    if (typeof password === 'string' && password.length > 72) {
        errors.push('Password must be at most 72 characters');
    }
    if (!ROLES.includes(role)) {
        errors.push('Role must be "youth" or "mentor"');
    }
    if (body.age !== undefined && body.age !== null && body.age !== '') {
        const age = Number(body.age);
        if (!Number.isInteger(age) || age < 10 || age > 100) {
            errors.push('Age must be a whole number between 10 and 100');
        }
    }
    ['location', 'bio', 'skills', 'education', 'experience'].forEach(field => {
        if (body[field] !== undefined && body[field] !== null && String(body[field]).length > 500) {
            errors.push(field + ' is too long (max 500 characters)');
        }
    });
    return errors;
}

function validateProfile(body) {
    const errors = [];
    if (!isNonEmptyString(body.name) || body.name.trim().length > 100) {
        errors.push('Name is required (max 100 characters)');
    }
    if (body.age !== undefined && body.age !== null && body.age !== '') {
        const age = Number(body.age);
        if (!Number.isInteger(age) || age < 10 || age > 100) {
            errors.push('Age must be a whole number between 10 and 100');
        }
    }
    ['location', 'bio', 'skills', 'education', 'experience'].forEach(field => {
        if (body[field] !== undefined && body[field] !== null && String(body[field]).length > 500) {
            errors.push(field + ' is too long (max 500 characters)');
        }
    });
    return errors;
}

function validateSessionRequest(body) {
    const errors = [];
    if (!isNonEmptyString(body.topic) || body.topic.trim().length > 200) {
        errors.push('Topic is required (max 200 characters)');
    }
    if (!isNonEmptyString(body.description) || body.description.trim().length > 1000) {
        errors.push('Description is required (max 1000 characters)');
    }
    if (body.duration !== undefined && body.duration !== null && body.duration !== '') {
        const duration = Number(body.duration);
        if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
            errors.push('Duration must be between 15 and 480 minutes');
        }
    }
    return errors;
}

const PUBLIC_USER_COLUMNS = 'id, name, email, role, age, location, bio, skills, education, experience';

// --- API ROUTES ---

// AUTH

app.post('/api/register', authLimiter, (req, res) => {
    const errors = validateRegistration(req.body);
    if (errors.length) {
        return res.status(400).json({ error: errors[0], details: errors });
    }

    const { name, email, password, role } = req.body;
    const age = (req.body.age === '' || req.body.age === undefined || req.body.age === null) ? null : Number(req.body.age);
    const optional = ['location', 'bio', 'skills', 'education', 'experience'];
    const values = {};
    optional.forEach(field => {
        values[field] = (req.body[field] !== undefined && req.body[field] !== null) ? req.body[field] : null;
    });

    bcrypt.hash(password, 10, (hashErr, hash) => {
        if (hashErr) {
            return res.status(500).json({ error: 'Could not secure the password' });
        }
        db.run(
            'INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hash, role, age, values.location, values.bio, values.skills, values.education, values.experience],
            function (insertErr) {
                if (insertErr) {
                    if (String(insertErr.message).toUpperCase().includes('UNIQUE')) {
                        return res.status(409).json({ error: 'An account with this email already exists' });
                    }
                    return res.status(400).json({ error: insertErr.message });
                }
                req.session.regenerate((regErr) => {
                    if (regErr) {
                        return res.status(500).json({ error: 'Could not start a session' });
                    }
                    req.session.userId = this.lastID;
                    req.session.role = role;
                    return res.status(201).json({
                        success: true,
                        message: 'User registered successfully',
                        user: { id: this.lastID, name: name.trim(), email: email.trim().toLowerCase(), role, age, location: values.location, bio: values.bio, skills: values.skills, education: values.education, experience: values.experience }
                    });
                });
            }
        );
    });
});

app.post('/api/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    if (!isNonEmptyString(email) || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    db.get(
        'SELECT ' + PUBLIC_USER_COLUMNS + ', password FROM users WHERE email = ?',
        [email.trim().toLowerCase()],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            bcrypt.compare(password, user.password, (cmpErr, match) => {
                if (cmpErr) {
                    return res.status(500).json({ error: 'Could not verify the password' });
                }
                if (!match) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role, age: user.age, location: user.location, bio: user.bio, skills: user.skills, education: user.education, experience: user.experience };
                req.session.regenerate((regErr) => {
                    if (regErr) {
                        return res.status(500).json({ error: 'Could not start a session' });
                    }
                    req.session.userId = user.id;
                    req.session.role = user.role;
                    res.json({ success: true, message: 'Login successful', user: publicUser });
                });
            });
        }
    );
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/me', requireAuth, (req, res) => {
    db.get(
        'SELECT ' + PUBLIC_USER_COLUMNS + ' FROM users WHERE id = ?',
        [req.session.userId],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

// USERS

app.get('/api/mentors', (req, res) => {
    db.all(
        'SELECT ' + PUBLIC_USER_COLUMNS + ' FROM users WHERE role = ? ORDER BY name',
        ['mentor'],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.get('/api/youth', (req, res) => {
    db.all(
        'SELECT ' + PUBLIC_USER_COLUMNS + ' FROM users WHERE role = ? ORDER BY name',
        ['youth'],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.get('/api/users/:id', (req, res) => {
    const id = Number(req.params.id);
    db.get(
        'SELECT ' + PUBLIC_USER_COLUMNS + ' FROM users WHERE id = ?',
        [id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

app.put('/api/users/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id !== req.session.userId) {
        return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    const errors = validateProfile(req.body);
    if (errors.length) {
        return res.status(400).json({ error: errors[0], details: errors });
    }

    const { name, age, location, bio, skills, education, experience } = req.body;
    const cleanAge = (age === '' || age === undefined || age === null) ? null : Number(age);
    db.run(
        'UPDATE users SET name = ?, age = ?, location = ?, bio = ?, skills = ?, education = ?, experience = ? WHERE id = ?',
        [name.trim(), cleanAge, location, bio, skills, education, experience, id],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, message: 'Profile updated successfully' });
        }
    );
});

app.delete('/api/users/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id !== req.session.userId) {
        return res.status(403).json({ error: 'You can only delete your own account' });
    }
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.session.destroy(() => {
            res.json({ success: true, message: 'Account deleted successfully' });
        });
    });
});

// SESSIONS

app.post('/api/sessions', requireAuth, (req, res) => {
    if (req.session.role !== 'youth') {
        return res.status(403).json({ error: 'Only youth can request a session' });
    }

    const errors = validateSessionRequest(req.body);
    if (errors.length) {
        return res.status(400).json({ error: errors[0], details: errors });
    }

    const mentorId = Number(req.body.mentor_id);
    if (!Number.isInteger(mentorId)) {
        return res.status(400).json({ error: 'A valid mentor must be selected' });
    }

    const { topic, description } = req.body;
    const scheduledDate = req.body.scheduled_date || null;
    const duration = (req.body.duration === '' || req.body.duration === undefined || req.body.duration === null) ? null : Number(req.body.duration);

    db.get('SELECT id FROM users WHERE id = ? AND role = ?', [mentorId, 'mentor'], (mentorErr, mentor) => {
        if (mentorErr) {
            return res.status(500).json({ error: mentorErr.message });
        }
        if (!mentor) {
            return res.status(400).json({ error: 'Selected mentor does not exist' });
        }

        db.get(
            'SELECT id FROM sessions WHERE youth_id = ? AND mentor_id = ? AND status IN (?, ?)',
            [req.session.userId, mentorId, 'pending', 'accepted'],
            (dupErr, existing) => {
                if (dupErr) {
                    return res.status(500).json({ error: dupErr.message });
                }
                if (existing) {
                    return res.status(409).json({ error: 'You already have a pending session with this mentor' });
                }

                db.run(
                    'INSERT INTO sessions (youth_id, mentor_id, topic, description, scheduled_date, duration) VALUES (?, ?, ?, ?, ?, ?)',
                    [req.session.userId, mentorId, topic.trim(), description.trim(), scheduledDate, duration],
                    function (insertErr) {
                        if (insertErr) {
                            return res.status(400).json({ error: insertErr.message });
                        }
                        res.status(201).json({
                            success: true,
                            message: 'Session requested successfully',
                            session: { id: this.lastID, youth_id: req.session.userId, mentor_id: mentorId, topic: topic.trim(), description: description.trim(), scheduled_date: scheduledDate, duration, status: 'pending' }
                        });
                    }
                );
            }
        );
    });
});

app.get('/api/sessions/user/:userId', requireAuth, (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId !== req.session.userId) {
        return res.status(403).json({ error: 'You can only view your own sessions' });
    }
    db.all(`
        SELECT s.*,
               youth.name AS youth_name,
               mentor.name AS mentor_name
        FROM sessions s
        LEFT JOIN users youth ON s.youth_id = youth.id
        LEFT JOIN users mentor ON s.mentor_id = mentor.id
        WHERE s.youth_id = ? OR s.mentor_id = ?
        ORDER BY s.created_at DESC
    `, [userId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/sessions/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid session id' });
    }

    const { status, rating, feedback } = req.body;

    db.get('SELECT * FROM sessions WHERE id = ?', [id], (err, session) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const isYouth = session.youth_id === req.session.userId;
        const isMentor = session.mentor_id === req.session.userId;

        if (status !== undefined && status !== null) {
            if (!SESSION_STATUSES.includes(status)) {
                return res.status(400).json({ error: 'Invalid session status' });
            }
            const allowedTransitions = {};
            if (isMentor) {
                allowedTransitions.pending = ['accepted', 'declined'];
                allowedTransitions.accepted = ['completed'];
            } else if (isYouth) {
                allowedTransitions.pending = ['cancelled'];
            }
            const allowed = allowedTransitions[session.status] || [];
            if (!allowed.includes(status)) {
                return res.status(403).json({ error: 'Cannot change session status from "' + session.status + '" to "' + status + '"' });
            }
        }

        if ((rating !== undefined && rating !== null) || (feedback !== undefined && feedback !== null)) {
            if (!isYouth) {
                return res.status(403).json({ error: 'Only the youth can rate a session' });
            }
            if (session.status !== 'completed') {
                return res.status(400).json({ error: 'Only completed sessions can be rated' });
            }
            if (rating !== undefined && rating !== null) {
                if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                    return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' });
                }
            }
            if (feedback !== undefined && feedback !== null) {
                if (typeof feedback !== 'string' || feedback.trim().length > 1000) {
                    return res.status(400).json({ error: 'Feedback must be at most 1000 characters' });
                }
            }
        }

        let query = 'UPDATE sessions SET ';
        const params = [];
        const updates = [];
        if (status !== undefined && status !== null) {
            updates.push('status = ?');
            params.push(status);
        }
        if (rating !== undefined && rating !== null) {
            updates.push('rating = ?');
            params.push(rating);
        }
        if (feedback !== undefined && feedback !== null) {
            updates.push('feedback = ?');
            params.push(feedback);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        db.run(query, params, function (updateErr) {
            if (updateErr) {
                return res.status(400).json({ error: updateErr.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json({ success: true, message: 'Session updated successfully' });
        });
    });
});

app.delete('/api/sessions/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid session id' });
    }
    db.get('SELECT * FROM sessions WHERE id = ?', [id], (err, session) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.youth_id !== req.session.userId) {
            return res.status(403).json({ error: 'Only the youth who requested can delete this session' });
        }
        if (session.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending sessions can be deleted' });
        }
        db.run('DELETE FROM sessions WHERE id = ?', [id], function (deleteErr) {
            if (deleteErr) {
                return res.status(400).json({ error: deleteErr.message });
            }
            res.json({ success: true, message: 'Session deleted successfully' });
        });
    });
});

// SKILLS

app.get('/api/skills', (req, res) => {
    db.all(
        'SELECT * FROM skills ORDER BY category, name',
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.post('/api/skills', requireAuth, (req, res) => {
    const { name, category } = req.body;
    if (!isNonEmptyString(name) || name.trim().length > 100) {
        return res.status(400).json({ error: 'Skill name is required (max 100 characters)' });
    }
    db.run(
        'INSERT INTO skills (name, category) VALUES (?, ?)',
        [name.trim(), category || null],
        function (err) {
            if (err) {
                if (String(err.message).toUpperCase().includes('UNIQUE')) {
                    return res.status(409).json({ error: 'This skill already exists' });
                }
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ success: true, message: 'Skill added successfully', skill: { id: this.lastID, name: name.trim(), category: category || null } });
        }
    );
});

// DASHBOARD STATS

app.get('/api/stats', (req, res) => {
    db.get(`
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'youth') AS youth_count,
            (SELECT COUNT(*) FROM users WHERE role = 'mentor') AS mentor_count,
            (SELECT COUNT(*) FROM sessions) AS total_sessions,
            (SELECT COUNT(*) FROM sessions WHERE status = 'completed') AS completed_sessions
    `, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.all(`
            SELECT s.id, s.topic, s.status, s.created_at,
                   youth.name AS youth_name,
                   mentor.name AS mentor_name
            FROM sessions s
            LEFT JOIN users youth ON s.youth_id = youth.id
            LEFT JOIN users mentor ON s.mentor_id = mentor.id
            ORDER BY s.created_at DESC
            LIMIT 5
        `, (recentErr, recent) => {
            if (recentErr) {
                return res.status(500).json({ error: recentErr.message });
            }
            row.recent_activity = recent || [];
            res.json(row);
        });
    });
});

// --- FALLBACKS ---

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to serve index.html for any other request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body too large' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
MENTORCONNECT SYSTEM STARTED SUCCESSFULLY!

URL: http://localhost:${PORT}

TABLES: users, sessions, skills
AUTHENTICATION: Secure sessions (cookie) + hashed passwords
DATA: Persistent SQLite storage

FEATURES:
- User Registration & Login
- Mentor & Youth Management
- Session Booking & Management
- Skills Catalog
- Dashboard with Recent Activity
- Role-based controls (youth vs mentor)
- Rate limiting & input validation

DEMO CREDENTIALS:
Youth: student@demo.com / demo123
Mentor: mentor@demo.com / demo123

Ready to use! Open http://localhost:${PORT}
    `);
});
