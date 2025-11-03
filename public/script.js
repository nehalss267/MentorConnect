let currentUser = null;

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function displayResponse(data) {
    document.getElementById('apiResponse').textContent = JSON.stringify(data, null, 2);
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch('/api' + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        displayResponse(data);
        return data;
    } catch (error) {
        displayResponse({ error: error.message });
    }
}

// Authentication
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (result.success) {
        currentUser = result.user;
        showSection('dashboard');
        loadStats();
    }
}

async function register() {
    const userData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value,
        age: document.getElementById('regAge').value,
        location: document.getElementById('regLocation').value,
        skills: document.getElementById('regSkills').value,
        bio: document.getElementById('regBio').value,
        education: 'Not specified',
        experience: 'Not specified'
    };
    
    await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

// User Management
async function loadMentors() {
    const result = await apiCall('/mentors');
    if (Array.isArray(result)) {
        const html = result.map(mentor => `
            <div class="card">
                <h4>${mentor.name}</h4>
                <p><strong>Skills:</strong> ${mentor.skills}</p>
                <p><strong>Experience:</strong> ${mentor.experience}</p>
                <p><strong>Location:</strong> ${mentor.location}</p>
                <button onclick="viewUser(${mentor.id})">View Profile</button>
            </div>
        `).join('');
        document.getElementById('mentorsList').innerHTML = html;
    }
}

async function loadYouth() {
    const result = await apiCall('/youth');
    if (Array.isArray(result)) {
        const html = result.map(youth => `
            <div class="card">
                <h4>${youth.name}</h4>
                <p><strong>Skills:</strong> ${youth.skills}</p>
                <p><strong>Education:</strong> ${youth.education}</p>
                <p><strong>Location:</strong> ${youth.location}</p>
                <button onclick="viewUser(${youth.id})">View Profile</button>
Note         </div>
        `).join('');
        document.getElementById('youthList').innerHTML = html;
    }
}

async function viewUser(userId) {
    const result = await apiCall('/users/' + userId);
}

// Session Management
async function createSession() {
    const sessionData = {
        youth_id: document.getElementById('sessionYouth').value,
        mentor_id: document.getElementById('sessionMentor').value,
        topic: document.getElementById('sessionTopic').value,
        description: document.getElementById('sessionDesc').value,
        scheduled_date: new Date().toISOString(),
        duration: 60
    };
    
    await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
    });
}

async function loadUserSessions() {
    const userId = document.getElementById('sessionUser').value;
    const result = await apiCall('/sessions/user/' + userId);
    if (Array.isArray(result)) {
        const html = result.map(session => `
            <div class="session-item">
                <p><strong>Topic:</strong> ${session.topic}</p>
                <p><strong>With:</strong> ${session.mentor_name}</p>
                <p><strong>Status:</strong> <span class="status-${session.status}">${session.status}</span></p>
                <button onclick="updateSession(${session.id}, 'accepted')">Accept</button>
                <button onclick="updateSession(${session.id}, 'completed')">Complete</button>
            </div>
        `).join('');
        document.getElementById('sessionsList').innerHTML = html;
    }
}

async function updateSession(sessionId, status) {
    await apiCall('/sessions/' + sessionId, {
        method: 'PUT',
        body: JSON.stringify({ status })
        });
    loadUserSessions();
}

// Skills Management
async function loadSkills() {
    const result = await apiCall('/skills');
    if (Array.isArray(result)) {
        const html = result.map(skill => `
            <div class="card">
                <strong>${skill.name}</strong> - ${skill.category}
            </div>
    s `).join('');
        document.getElementById('skillsList').innerHTML = html;
    }
}

async function addSkill() {
    const skillData = {
        name: document.getElementById('skillName').value,
        category: document.getElementById('skillCategory').value
    };
    
    await apiCall('/skills', {
        method: 'POST',
        body: JSON.stringify(skillData)
    });
    loadSkills();
}

// Dashboard
async function loadStats() {
    const result = await apiCall('/stats');
    if (result) {
        document.getElementById('youthCount').textContent = result.youth_count;
        document.getElementById('mentorCount').textContent = result.mentor_count;
        document.getElementById('sessionCount').textContent = result.total_sessions;
        document.getElementById('completedCount').textContent = result.completed_sessions;
A   }
}

// Initialize
showSection('dashboard');
loadStats();
loadSkills();
