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
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('youth', 'mentor')) NOT NULL,
        age INTEGER,
        location TEXT,
        bio TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_id INTEGER NOT NULL,
        mentor_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        scheduled_date TEXT,
        duration INTEGER,
        rating INTEGER,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_id) REFERENCES users (id),
        FOREIGN KEY (mentor_id) REFERENCES users (id)
    )`);

    // Skills table
    db.run(`CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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

// AUTHENTICATION MIDDLEWARE
const requireAuth = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// USER CRUD OPERATIONS

// Register user
app.post('/api/register', (req, res) => {
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
                user: { 
                    id: this.lastID, 
                    name, 
                    email, 
                    role,
                    age,
                    location,
                    bio,
                    skills,
                    education,
                    experience
                } 
            });
        }
    );
});

// Login user
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
            res.json({ 
                success: true,
                message: 'Login successful',
                user 
            });
        }
    );
});

// Get all mentors
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

// Get all youth
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

// Get user by ID
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

// Update user profile
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
            res.json({ 
                success: true,
                message: 'Profile updated successfully' 
            });
        }
    );
});

// SESSION CRUD OPERATIONS

// Create session
app.post('/api/sessions', (req, res) => {
    const { youth_id, mentor_id, topic, description, scheduled_date, duration } = req.body;
    
    db.run(
        "INSERT INTO sessions (youth_id, mentor_id, topic, description, scheduled_date, duration) VALUES (?, ?, ?, ?, ?, ?)",
        [youth_id, mentor_id, topic, description, scheduled_date, duration],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ 
                success: true,
                message: 'Session requested successfully', 
                session: { 
                    id: this.lastID, 
                    youth_id, 
                    mentor_id, 
                    topic, 
                    description, 
                    scheduled_date, 
                    duration,
                    status: 'pending'
                } 
            });
        }
    );
});

// Get sessions for user
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

// Update session status
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
        res.json({ 
            success: true,
            message: 'Session updated successfully' 
        });
    });
});

// SKILLS OPERATIONS

// Get all skills
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

// Add new skill
app.post('/api/skills', (req, res) => {
    const { name, category } = req.body;
    
    db.run(
        "INSERT INTO skills (name, category) VALUES (?, ?)",
        [name, category],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ 
                success: true,
                message: 'Skill added successfully', 
                skill: { id: this.lastID, name, category } 
            });
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

// Serve frontend
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>MentorConnect - Underprivileged Youth Mentorship</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            .nav { background: #34495e; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .nav button { background: #3498db; color: white; border: none; padding: 10px 20px; margin: 0 5px; border-radius: 5px; cursor: pointer; }
            .nav button:hover { background: #2980b9; }
            .section { display: none; background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .active { display: block; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .form-group { margin: 10px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select, textarea { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; }
            button { background: #27ae60; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin: 5px; }
            button:hover { background: #229954; }
            button.danger { background: #e74c3c; }
            button.danger:hover { background: #c0392b; }
            pre { background: #2c3e50; color: white; padding: 15px; border-radius: 5px; overflow: auto; max-height: 300px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: #3498db; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .user-list { max-height: 400px; overflow-y: auto; }
            .session-item { border-left: 4px solid #3498db; padding-left: 10px; margin: 10px 0; }
            .status-pending { color: #f39c12; }
            .status-accepted { color: #27ae60; }
            .status-completed { color: #3498db; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MentorConnect - Underprivileged Youth Mentorship System</h1>
                <p>REG: 23BCB0077 - SANCHITHA V, NEHAL SOLANKI - 23BCB0076 </p>
                <p>Connecting Youth with Mentors for Better Future</p>
            </div>

            <div class="nav">
                <button onclick="showSection('dashboard')">Dashboard</button>
                <button onclick="showSection('login')">Login</button>
                <button onclick="showSection('register')">Register</button>
                <button onclick="showSection('mentors')">Find Mentors</button>
                <button onclick="showSection('youth')">Find Youth</button>
                <button onclick="showSection('sessions')">Sessions</button>
                <button onclick="showSection('skills')">Skills</button>
            </div>

            <!-- Dashboard Section -->
            <div id="dashboard" class="section active">
                <h2>System Dashboard</h2>
                <div class="stats" id="statsContainer">
                    <div class="stat-card">
                        <h3>Total Youth</h3>
                        <p id="youthCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Mentors</h3>
                        <p id="mentorCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Sessions</h3>
                        <p id="sessionCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Completed</h3>
                        <p id="completedCount">0</p>
                    </div>
                </div>
                <div class="grid">
                    <div class="card">
                        <h3>Quick Actions</h3>
                        <button onclick="showSection('register')">Register New User</button>
                        <button onclick="showSection('mentors')">Browse Mentors</button>
                        <button onclick="showSection('sessions')">Manage Sessions</button>
                    </div>
                    <div class="card">
                        <h3>Recent Activity</h3>
                        <div id="recentActivity">No recent activity</div>
                    </div>
                </div>
            </div>

            <!-- Login Section -->
            <div id="login" class="section">
                <h2>User Login</h2>
                <div class="card">
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="loginEmail" value="student@demo.com">
                    </div>
                    <div class="form-group">
                        <label>Password:</label>
                        <input type="password" id="loginPassword" value="demo123">
                    </div>
                    <button onclick="login()">Login</button>
                    <p>Demo: student@demo.com / demo123 or mentor@demo.com / demo123</p>
                </div>
            </div>

            <!-- Register Section -->
            <div id="register" class="section">
                <h2>Register New User</h2>
                <div class="grid">
                    <div class="card">
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" id="regName" value="New User">
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" id="regEmail" value="new@demo.com">
                        </div>
                        <div class="form-group">
                            <label>Password:</label>
                            <input type="password" id="regPassword" value="demo123">
                        </div>
                        <div class="form-group">
                            <label>Role:</label>
                            <select id="regRole">
                                <option value="youth">Youth</option>
                                <option value="mentor">Mentor</option>
                            </select>
                        </div>
                    </div>
                    <div class="card">
                        <div class="form-group">
                            <label>Age:</label>
                            <input type="number" id="regAge" value="20">
                        </div>
                        <div class="form-group">
                            <label>Location:</label>
                            <input type="text" id="regLocation" value="City">
                        </div>
                        <div class="form-group">
                            <label>Skills:</label>
                            <input type="text" id="regSkills" value="Programming, Math">
                        </div>
                        <div class="form-group">
                            <label>Bio:</label>
                            <textarea id="regBio" rows="3">Short bio about yourself</textarea>
                        </div>
                    </div>
                </div>
                <button onclick="register()">Register User</button>
            </div>

            <!-- Mentors Section -->
           
