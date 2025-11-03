<!DOCTYPE html>
<html>
<head>
    <title>MentorConnect - Underprivileged Youth Mentorship</title>
    <link rel="stylesheet" href="style.css">
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
            <button onclick="showSection('sessions')">My Sessions</button>
            <button onclick="showSection('skills')">Skills</button>
            <button id="logoutButton" style="display:none; float: right;" class="danger" onclick="logout()">Logout</button>
            <span id="welcomeMessage" style="float: right; padding: 10px; color: white;"></span>
        </div>

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
                    <h3>Recent Activity (Sessions)</h3>
                    <div id="recentActivity">Login to see recent activity.</div>
                </div>
            </div>
        </div>

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
                <p>Demo: student@demo.com / demo123 (Youth) or mentor@demo.com / demo123 (Mentor)</p>
            </div>
        </div>

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
                        <label>Skills (comma-separated):</label>
                        <input type="text" id="regSkills" value="Programming, Math">
                    </div>
                    <div class="form-group">
                        <label>Education:</label>
                        <input type="text" id="regEducation" value="B.Tech">
                    </div>
                    <div class="form-group">
                        <label>Experience:</label>
                        <input type="text" id="regExperience" value="2 years intern">
                    </div>
                    <div class="form-group">
                        <label>Bio:</label>
                        <textarea id="regBio" rows="2">Short bio about yourself</textarea>
                    </div>
                </div>
            </div>
            <button onclick="register()">Register User</button>
        </div>

        <div id="mentors" class="section">
            <h2>Find a Mentor</h2>
            <div class="user-list" id="mentorList">Loading mentors...</div>
        </div>

        <div id="youth" class="section">
            <h2>Find Youth</h2>
            <div class="user-list" id="youthList">Loading youth...</div>
        </div>

        <div id="sessions" class="section">
            <h2>My Sessions</h2>
            <p id="sessionLoginPrompt">Please login to see your sessions.</p>
            <div id="sessionList"></div>
        </div>

        <div id="skills" class="section">
            <h2>Available Skills</h2>
            <div class="card">
                <h3>Add New Skill</h3>
                <div class="form-group">
                    <label>Skill Name:</label>
                    <input type="text" id="skillName" placeholder="e.g., Python">
                </div>
                <div class="form-group">
                    <label>Category:</label>
                    <input type="text" id="skillCategory" placeholder="e.g., Technical">
                </div>
                <button onclick="addSkill()">Add Skill</button>
            </div>
            <div id="skillList" style="margin-top: 20px;">Loading skills...</div>
        </div>
    </div>

    <div id="sessionModal" class="modal" style="display:none;">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Request Session</h2>
            <p>Requesting session with <strong id="modalMentorName"></strong></p>
            <input type="hidden" id="modalMentorId">
            <div class="form-group">
                <label>Topic:</label>
                <input type="text" id="sessionTopic" placeholder="e.g., Career Advice">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea id="sessionDescription" rows="3" placeholder="What would you like to discuss?"></textarea>
            </div>
            <div class="form-group">
                <label>Preferred Date:</label>
                <input type="datetime-local" id="sessionDate">
            </div>
            <div class="form-group">
                <label>Duration (minutes):</label>
                <input type="number" id="sessionDuration" value="30">
            </div>
            <button onclick="submitSessionRequest()">Submit Request</button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
