const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "./mentor_system.db";

// Initialize and connect to the database
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        throw err;
    } else {
        console.log('Connected to SQLite database: mentor_system.db');
        initializeDatabase(); // Call initialization
    }
});

// Function to create tables and seed data
const initializeDatabase = () => {
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

        // Insert sample data only if users table is empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                console.log('Inserting sample data...');
                // Sample users
                const sampleUsers = [
                    ['Janaki Student', 'student@demo.com', 'demo123', 'youth', 18, 'Bangalore', 'High school student looking for guidance', 'Math, Science', 'High School', 'Looking for opportunities'],
                    ['Swetha Mentor', 'mentor@demo.com', 'demo123', 'mentor', 32, 'Chennai', 'Experienced software engineer', 'Programming, Web Development, Career Guidance', 'B.Tech Computer Science', '8 years in IT industry'],
                    ['Raj Advisor', 'raj@demo.com', 'demo123', 'mentor', 35, 'Mumbai', 'Business consultant and career coach', 'Business, Marketing, Entrepreneurship', 'MBA', '10 years in business consulting'],
                    ['Priya Youth', 'priya@demo.com', 'demo123', 'youth', 20, 'Delhi', 'College student seeking career direction', 'Arts, Design, Communication', 'B.A. Psychology', 'Internship experience'],
                    ['Kumar Mentor', 'kumar@demo.com', 'demo123', 'mentor', 40, 'Hyderabad', 'Industry expert in digital marketing', 'Digital Marketing, SEO, Social Media', 'M.Sc. Marketing', '15 years in digital marketing']
                ];
                const userInsert = db.prepare("INSERT INTO users (name, email, password, role, age, location, bio, skills, education, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                sampleUsers.forEach(user => userInsert.run(user));
                userInsert.finalize();

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
                const skillInsert = db.prepare("INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)");
                sampleSkills.forEach(skill => skillInsert.run(skill));
                skillInsert.finalize();
                
                console.log('Sample data inserted successfully');
            } else if (err) {
                console.error("Error checking user count:", err);
            } else {
                console.log('Database already contains data.');
            }
        });
    });
};

// Export the database connection and the initializer
module.exports = { db, initializeDatabase };
