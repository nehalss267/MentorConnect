let currentUser = null;
let previousSection = 'dashboard';

// Event delegation: every button is driven by data-action/data-id/data-status
// attributes. This allows a strict Content-Security-Policy (no inline scripts).
document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-action]');
    if (!el) {
        return;
    }
    const action = el.getAttribute('data-action');
    if (typeof window[action] === 'function') {
        event.preventDefault();
        window[action](el);
    }
});

function showSection(sectionId) {
    if (sectionId !== 'viewUser') {
        previousSection = sectionId;
    }
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function navigate(el) {
    showSection(el.getAttribute('data-section'));
}

function goBack() {
    showSection(previousSection);
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showNotice(containerId, message, isError) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    if (!message) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '<div class="notice ' + (isError ? 'error' : 'success') + '">' + escapeHtml(message) + '</div>';
}

class ApiError extends Error {
    constructor(message, data) {
        super(message);
        this.data = data;
    }
}

async function apiCall(endpoint, options = {}) {
    const response = await fetch('/api' + endpoint, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    const data = await response.json();
    if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', data);
    }
    return data;
}

// Authentication
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        currentUser = result.user;
        showNotice('loginNotice', 'Logged in successfully. Welcome, ' + currentUser.name + '!', false);
        applyAuthState();
        showSection('dashboard');
        loadStats();
    } catch (error) {
        showNotice('loginNotice', error.message, true);
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
        education: document.getElementById('regEducation').value,
        experience: document.getElementById('regExperience').value
    };

    try {
        const result = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        currentUser = result.user;
        showNotice('registerNotice', 'Account created successfully. Welcome, ' + currentUser.name + '!', false);
        applyAuthState();
        showSection('dashboard');
        loadStats();
    } catch (error) {
        showNotice('registerNotice', error.message, true);
    }
}

async function logout() {
    try {
        await apiCall('/logout', { method: 'POST' });
    } catch (error) {
        // ignore - session is cleared client-side regardless
    }
    currentUser = null;
    applyAuthState();
    showNotice('noticeArea', 'Logged out successfully.', false);
    showSection('dashboard');
    loadStats();
}

function applyAuthState() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const navLogin = document.getElementById('navLogin');
    const navRegister = document.getElementById('navRegister');
    const navLogout = document.getElementById('navLogout');
    const navProfile = document.getElementById('navProfile');

    if (currentUser) {
        welcomeMessage.textContent = 'Welcome, ' + currentUser.name + ' (' + currentUser.role + ')';
        navLogin.style.display = 'none';
        navRegister.style.display = 'none';
        navLogout.style.display = 'inline-block';
        navProfile.style.display = 'inline-block';
        populateProfileForm();
        loadMentorDropdown();
        loadUserSessions();
    } else {
        welcomeMessage.textContent = '';
        navLogin.style.display = 'inline-block';
        navRegister.style.display = 'inline-block';
        navLogout.style.display = 'none';
        navProfile.style.display = 'none';
        document.getElementById('sessionMentor').innerHTML = '<option value="">Log in to request a session</option>';
        document.getElementById('sessionsList').innerHTML = '<p class="hint">Log in to view your sessions.</p>';
    }
}

// User Management
async function loadMentors() {
    const filter = (document.getElementById('mentorSearch').value || '').trim().toLowerCase();
    const container = document.getElementById('mentorsList');
    try {
        const result = await apiCall('/mentors');
        const filtered = result.filter(mentor =>
            !filter ||
            mentor.name.toLowerCase().includes(filter) ||
            (mentor.skills || '').toLowerCase().includes(filter) ||
            (mentor.location || '').toLowerCase().includes(filter)
        );
        container.innerHTML = filtered.map(mentor => `
            <div class="card">
                <h4>${escapeHtml(mentor.name)}</h4>
                <p><strong>Skills:</strong> ${escapeHtml(mentor.skills || 'N/A')}</p>
                <p><strong>Experience:</strong> ${escapeHtml(mentor.experience || 'N/A')}</p>
                <p><strong>Location:</strong> ${escapeHtml(mentor.location || 'N/A')}</p>
                <button data-action="viewUser" data-id="${mentor.id}">View Profile</button>
                ${currentUser && currentUser.role === 'youth' ? `<button data-action="requestWithMentor" data-id="${mentor.id}">Request Session</button>` : ''}
            </div>
        `).join('') || '<p class="hint">No mentors found.</p>';
    } catch (error) {
        showNotice('mentorNotice', error.message, true);
    }
}

async function loadYouth() {
    const filter = (document.getElementById('youthSearch').value || '').trim().toLowerCase();
    const container = document.getElementById('youthList');
    try {
        const result = await apiCall('/youth');
        const filtered = result.filter(youth =>
            !filter ||
            youth.name.toLowerCase().includes(filter) ||
            (youth.skills || '').toLowerCase().includes(filter) ||
            (youth.location || '').toLowerCase().includes(filter)
        );
        container.innerHTML = filtered.map(youth => `
            <div class="card">
                <h4>${escapeHtml(youth.name)}</h4>
                <p><strong>Skills:</strong> ${escapeHtml(youth.skills || 'N/A')}</p>
                <p><strong>Education:</strong> ${escapeHtml(youth.education || 'N/A')}</p>
                <p><strong>Location:</strong> ${escapeHtml(youth.location || 'N/A')}</p>
                <button data-action="viewUser" data-id="${youth.id}">View Profile</button>
            </div>
        `).join('') || '<p class="hint">No youth found.</p>';
    } catch (error) {
        showNotice('youthNotice', error.message, true);
    }
}

function viewUser(el) {
    const userId = Number(el.getAttribute('data-id'));
    viewUserById(userId);
}

async function viewUserById(userId) {
    try {
        const user = await apiCall('/users/' + userId);
        document.getElementById('userProfileDetails').innerHTML = `
            <div class="card">
                <h4>${escapeHtml(user.name)}</h4>
                <p><strong>Role:</strong> ${escapeHtml(user.role)}</p>
                <p><strong>Age:</strong> ${escapeHtml(user.age || 'N/A')}</p>
                <p><strong>Location:</strong> ${escapeHtml(user.location || 'N/A')}</p>
                <p><strong>Bio:</strong> ${escapeHtml(user.bio || 'N/A')}</p>
                <p><strong>Skills:</strong> ${escapeHtml(user.skills || 'N/A')}</p>
                <p><strong>Education:</strong> ${escapeHtml(user.education || 'N/A')}</p>
                <p><strong>Experience:</strong> ${escapeHtml(user.experience || 'N/A')}</p>
            </div>
        `;
        showSection('viewUser');
    } catch (error) {
        showNotice('noticeArea', error.message, true);
    }
}

function requestWithMentor(el) {
    const mentorId = el.getAttribute('data-id');
    showSection('sessions');
    document.getElementById('sessionMentor').value = mentorId;
}

// Session Management
async function loadMentorDropdown() {
    const select = document.getElementById('sessionMentor');
    try {
        const mentors = await apiCall('/mentors');
        select.innerHTML = '<option value="">Select a mentor...</option>' + mentors.map(mentor =>
            '<option value="' + mentor.id + '">' + escapeHtml(mentor.name) + '</option>'
        ).join('');
    } catch (error) {
        // keep the placeholder if mentors cannot be loaded
    }
}

async function createSession() {
    const mentor_id = document.getElementById('sessionMentor').value;
    const topic = document.getElementById('sessionTopic').value;
    const description = document.getElementById('sessionDesc').value;
    const scheduled_date = document.getElementById('sessionDate').value || new Date().toISOString().slice(0, 10);
    const duration = document.getElementById('sessionDuration').value;

    if (!mentor_id) {
        showNotice('sessionNotice', 'Please select a mentor.', true);
        return;
    }
    try {
        await apiCall('/sessions', {
            method: 'POST',
            body: JSON.stringify({ mentor_id, topic, description, scheduled_date, duration })
        });
        showNotice('sessionNotice', 'Session requested successfully.', false);
        loadUserSessions();
    } catch (error) {
        showNotice('sessionNotice', error.message, true);
    }
}

async function loadUserSessions() {
    if (!currentUser) {
        return;
    }
    const container = document.getElementById('sessionsList');
    try {
        const result = await apiCall('/sessions/user/' + currentUser.id);
        container.innerHTML = result.map(session => {
            const otherName = currentUser.role === 'youth' ? session.mentor_name : session.youth_name;
            const isMentor = currentUser.role === 'mentor';
            const isYouth = currentUser.role === 'youth';

            let actions = '';
            if (session.status === 'pending') {
                if (isMentor) {
                    actions = `
                        <button data-action="updateSession" data-id="${session.id}" data-status="accepted">Accept</button>
                        <button class="danger" data-action="updateSession" data-id="${session.id}" data-status="declined">Decline</button>
                    `;
                } else if (isYouth) {
                    actions = `
                        <button class="danger" data-action="updateSession" data-id="${session.id}" data-status="cancelled">Cancel Request</button>
                        <button class="danger" data-action="deleteSession" data-id="${session.id}">Delete</button>
                    `;
                }
            } else if (session.status === 'accepted' && isMentor) {
                actions = `<button data-action="updateSession" data-id="${session.id}" data-status="completed">Mark Completed</button>`;
            } else if (session.status === 'completed' && isYouth && !session.rating) {
                actions = `<button data-action="showFeedback" data-id="${session.id}">Rate & Feedback</button>`;
            }

            const ratingHtml = session.rating ? '<p><strong>Rating:</strong> ' + escapeHtml(session.rating) + '/5</p>' : '';
            const feedbackHtml = session.feedback ? '<p><strong>Feedback:</strong> ' + escapeHtml(session.feedback) + '</p>' : '';
            const scheduledHtml = session.scheduled_date ? '<p><strong>Scheduled:</strong> ' + escapeHtml(session.scheduled_date) + '</p>' : '';

            return `
                <div class="session-item">
                    <p><strong>Topic:</strong> ${escapeHtml(session.topic)}</p>
                    <p><strong>With:</strong> ${escapeHtml(otherName || 'Unknown')}</p>
                    <p><strong>Status:</strong> <span class="status-${escapeHtml(session.status)}">${escapeHtml(session.status)}</span></p>
                    ${scheduledHtml}
                    ${ratingHtml}
                    ${feedbackHtml}
                    <div id="feedbackArea-${session.id}"></div>
                    ${actions}
                </div>
            `;
        }).join('') || '<p class="hint">No sessions yet.</p>';
    } catch (error) {
        container.innerHTML = '<p class="hint">' + escapeHtml(error.message) + '</p>';
    }
}

function showFeedback(el) {
    const sessionId = Number(el.getAttribute('data-id'));
    const area = document.getElementById('feedbackArea-' + sessionId);
    area.innerHTML = `
        <div class="form-group">
            <label>Rating:</label>
            <select id="feedbackRating-${sessionId}">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Poor</option>
            </select>
        </div>
        <div class="form-group">
            <label>Feedback:</label>
            <textarea id="feedbackText-${sessionId}" rows="3"></textarea>
        </div>
        <button data-action="submitFeedback" data-id="${sessionId}">Submit Feedback</button>
    `;
}

async function submitFeedback(el) {
    const sessionId = Number(el.getAttribute('data-id'));
    const rating = Number(document.getElementById('feedbackRating-' + sessionId).value);
    const feedback = document.getElementById('feedbackText-' + sessionId).value;
    try {
        await apiCall('/sessions/' + sessionId, {
            method: 'PUT',
            body: JSON.stringify({ rating, feedback })
        });
        loadUserSessions();
    } catch (error) {
        showNotice('noticeArea', error.message, true);
    }
}

async function updateSession(el) {
    const sessionId = Number(el.getAttribute('data-id'));
    const status = el.getAttribute('data-status');
    try {
        await apiCall('/sessions/' + sessionId, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        loadUserSessions();
    } catch (error) {
        showNotice('noticeArea', error.message, true);
    }
}

async function deleteSession(el) {
    const sessionId = Number(el.getAttribute('data-id'));
    if (!confirm('Delete this session request?')) {
        return;
    }
    try {
        await apiCall('/sessions/' + sessionId, { method: 'DELETE' });
        showNotice('noticeArea', 'Session deleted.', false);
        loadUserSessions();
    } catch (error) {
        showNotice('noticeArea', error.message, true);
    }
}

// Skills Management
async function loadSkills() {
    try {
        const result = await apiCall('/skills');
        document.getElementById('skillsList').innerHTML = result.map(skill => `
            <div class="card">
                <strong>${escapeHtml(skill.name)}</strong> - ${escapeHtml(skill.category || '')}
            </div>
        `).join('') || '<p class="hint">No skills added yet.</p>';
    } catch (error) {
        showNotice('skillsNotice', error.message, true);
    }
}

async function addSkill() {
    const skillData = {
        name: document.getElementById('skillName').value,
        category: document.getElementById('skillCategory').value
    };
    try {
        await apiCall('/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
        showNotice('skillsNotice', 'Skill added successfully.', false);
        loadSkills();
    } catch (error) {
        showNotice('skillsNotice', error.message, true);
    }
}

// Dashboard
async function loadStats() {
    try {
        const result = await apiCall('/stats');
        document.getElementById('youthCount').textContent = result.youth_count;
        document.getElementById('mentorCount').textContent = result.mentor_count;
        document.getElementById('sessionCount').textContent = result.total_sessions;
        document.getElementById('completedCount').textContent = result.completed_sessions;

        const recent = result.recent_activity || [];
        document.getElementById('recentActivity').innerHTML = recent.map(session => `
            <div class="session-item">
                <strong>${escapeHtml(session.topic)}</strong>
                <span class="status-${escapeHtml(session.status)}">(${escapeHtml(session.status)})</span>
                <p class="hint">${escapeHtml(session.youth_name)} with ${escapeHtml(session.mentor_name)}</p>
            </div>
        `).join('') || '<p class="hint">No recent activity</p>';
    } catch (error) {
        showNotice('noticeArea', error.message, true);
    }
}

// Profile
function populateProfileForm() {
    if (!currentUser) {
        return;
    }
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileAge').value = currentUser.age || '';
    document.getElementById('profileLocation').value = currentUser.location || '';
    document.getElementById('profileBio').value = currentUser.bio || '';
    document.getElementById('profileSkills').value = currentUser.skills || '';
    document.getElementById('profileEducation').value = currentUser.education || '';
    document.getElementById('profileExperience').value = currentUser.experience || '';
}

async function updateProfile() {
    try {
        await apiCall('/users/' + currentUser.id, {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('profileName').value,
                age: document.getElementById('profileAge').value,
                location: document.getElementById('profileLocation').value,
                bio: document.getElementById('profileBio').value,
                skills: document.getElementById('profileSkills').value,
                education: document.getElementById('profileEducation').value,
                experience: document.getElementById('profileExperience').value
            })
        });
        currentUser.name = document.getElementById('profileName').value;
        showNotice('profileNotice', 'Profile updated successfully.', false);
        applyAuthState();
    } catch (error) {
        showNotice('profileNotice', error.message, true);
    }
}

async function deleteAccount() {
    if (!confirm('This will permanently delete your account and all your sessions. Continue?')) {
        return;
    }
    try {
        await apiCall('/users/' + currentUser.id, { method: 'DELETE' });
        currentUser = null;
        applyAuthState();
        showNotice('noticeArea', 'Account deleted successfully.', false);
        showSection('dashboard');
        loadStats();
    } catch (error) {
        showNotice('profileNotice', error.message, true);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('mentorSearch').addEventListener('input', loadMentors);
    document.getElementById('youthSearch').addEventListener('input', loadYouth);

    showSection('dashboard');
    loadStats();
    loadSkills();

    try {
        const user = await apiCall('/me');
        currentUser = user;
    } catch (error) {
        currentUser = null;
    }
    applyAuthState();
});
