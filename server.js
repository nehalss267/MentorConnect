const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./mentor_system.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database: mentor_system.db');
    }
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT CHECK(role IN ('youth', 'mentor')) NOT NULL,age INTEGER,location TEXT,bio TEXT,skills TEXT,education TEXT,experience TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,youth_id INTEGER NOT NULL,mentor_id INTEGER NOT NULL,topic TEXT NOT NULL,description TEXT NOT NULL,status TEXT DEFAULT 'pending',scheduled_date TEXT,duration INTEGER,rating INTEGER,feedback TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (youth_id) REFERENCES users (id),FOREIGN KEY (mentor_id) REFERENCES users (id))`);

    // Skills table
    db.run(`CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE NOT NULL,category TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // Insert sample data
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (row.count === 0) {
            // Sample users
            const sampleUsers = [
                ['Janaki Student', 'student@demo.com', 'demo123', 'youth', 18, 'Bangalore', 'High school student looking for guidance', 'Math, Science', 'High School', 'Looking for opportunities'],
                ['Swetha Mentor', 'mentor@demo.com', 'demo123', 'mentor', 32, 'Chennai', 'Experienced software engineer', 'Programming, Web Development, Career Guidance', 'B.Tech Computer Science', '8 years in IT industry'],
                ['Raj Advisor', 'raj@demo.com', 'demo123', 'mentor', 35, 'Mumbai', 'Business consultant and career coach', 'Business, Marketing, Entrepreneurship', 'MBA', '10 years in business consulting'],
                ['Priya Youth', 'priya@demo.com', 'demo123', 'youth', 20, 'Delhi', 'College student seeking career direction', 'Arts, Design, Communication', 'B.A. Psychology', 'Internship experience'],
                ['Kumar Mentor', 'kumar@demo.com', 'demo123', 'mentor', 40, 'Hyderabad', 'Industry expert in digital marketing', 'Digital Marketing, SEO, Social Media', 'M.Sc. Marketing', '15 years in digital marketing']
            ];

            sampleUsers.forEach(user => {
                db.run("INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", user);
            });

            // Sample skills
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
                db.run("INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)", skill);
            });

            console.log('Sample data inserted successfully');
        }
    });
});

// === API ROUTES ===

// AUTHENTICATION MIDDLEWARE
const requireAuth = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// USER CRUD OPERATIONS
app.post('/api/register', (req, res) => {
    const { name, email, password, role, age, location, bio, skills, education, experience } = req.body;
    db.run(
        "INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, email, password, role, age || null, location, bio, skills, education, experience],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, message: 'User registered successfully', user: { id: this.lastID, name, email, role, age, location, bio, skills, education, experience } });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(
        "SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            res.json({ success: true, message: 'Login successful', user });
        }
    );
});

app.get('/api/mentors', (req, res) => {
    db.all(
        "SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE role = 'mentor' ORDER BY name",
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
        "SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE role = 'youth' ORDER BY name",
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.get('/api/users/:id', (req, res) => {
    const id = req.params.id;
    db.get(
        "SELECT id, name, email, role, age, location, bio, skills, education, experience FROM users WHERE id = ?",
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

app.put('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const { name, age, location, bio, skills, education, experience } = req.body;
    db.run(
        "UPDATE users SET name = ?, age = ?, location = ?, bio = ?, skills = ?, education = ?, experience = ? WHERE id = ?",
        [name, age, location, bio, skills, education, experience, id],
        function(err) {
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

// SESSION CRUD OPERATIONS
app.post('/api/sessions', (req, res) => {
    const { youth_id, mentor_id, topic, description, scheduled_date, duration } = req.body;
    db.run(
        "INSERT INTO sessions (youth_id, mentor_id, topic, description, scheduled_date, duration) VALUES (?, ?, ?, ?, ?, ?)",
        [youth_id, mentor_id, topic, description, scheduled_date, duration],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, message: 'Session requested successfully', session: { id: this.lastID, youth_id, mentor_id, topic, description, scheduled_date, duration, status: 'pending' } });
        }
    );
});

app.get('/api/sessions/user/:userId', (req, res) => {
    const userId = req.params.userId;
    db.all(`
        SELECT s.*, 
               youth.name as youth_name,
               mentor.name as mentor_name
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

app.put('/api/sessions/:id', (req, res) => {
    const id = req.params.id;
    const { status, rating, feedback } = req.body;
    let query = "UPDATE sessions SET status = ?";
    let params = [status];
    if (rating !== undefined) {
        query += ", rating = ?";
        params.push(rating);
    }
    if (feedback !== undefined) {
        query += ", feedback = ?";
        params.push(feedback);
    }
    query += " WHERE id = ?";
    params.push(id);
    db.run(query, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true, message: 'Session updated successfully' });
    });
});

// SKILLS OPERATIONS
app.get('/api/skills', (req, res) => {
    db.all(
        "SELECT * FROM skills ORDER BY category, name",
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.post('/api/skills', (req, res) => {
    const { name, category } = req.body;
    db.run(
        "INSERT INTO skills (name, category) VALUES (?, ?)",
        [name, category],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, message: 'Skill added successfully', skill: { id: this.lastID, name, category } });
        }
    );
});

// DASHBOARD STATS
app.get('/api/stats', (req, res) => {
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

// === SERVE FRONTEND ===
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to serve index.html for any other request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
MENTORCONNECT SYSTEM STARTED SUCCESSFULLY!

URL: http://localhost:${PORT}

TABLES: users, sessions, skills
AUTHENTICATION: Simple email/password
DATA: Persistent SQLite storage

FEATURES:
- User Registration & Login
- Mentor & Youth Management  
- Session Booking & Management
- Skills Catalog
- Real-time Dashboard
- Full CRUD Operations

DEMO CREDENTIALS:
Youth: student@demo.com / demo123
Mentor: mentor@demo.com / demo123

Ready to use! Open http://localhost:${PORT}
    `);
});
