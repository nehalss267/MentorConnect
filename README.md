# 🌐 MentorConnect – Underprivileged Youth Mentorship System

A Node.js + Express + SQLite-based web application designed to connect **underprivileged youth** with **qualified mentors**, enabling career guidance, skill development, and session scheduling.

---

## 🚀 Features

### 👤 User Management

* Register as **Youth** or **Mentor**
* Login and profile management
* Update user details

### 💬 Mentorship Sessions

* Youth can request sessions with mentors
* Mentors can view, accept, and provide feedback
* Ratings and feedback tracking

### 🎓 Skills Management

* Centralized skills database
* Add and list skills by category

### 📊 Dashboard

* View total youth, mentors, and session statistics
* Track completed and pending mentorship sessions

---

## 🛠️ Tech Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| **Backend**    | Node.js, Express.js           |
| **Database**   | SQLite3                       |
| **Frontend**   | HTML, CSS, Vanilla JavaScript |
| **API Format** | RESTful JSON-based            |

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mentorconnect.git
cd mentorconnect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Server

```bash
node server.js
```

### 4. Access in Browser

```
http://localhost:5000
```

---

## 🧩 API Endpoints

### 👥 Users

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| `POST` | `/api/register`  | Register a new user |
| `POST` | `/api/login`     | User login          |
| `GET`  | `/api/users/:id` | Get user details    |
| `PUT`  | `/api/users/:id` | Update user profile |
| `GET`  | `/api/mentors`   | List all mentors    |
| `GET`  | `/api/youth`     | List all youth      |

### 📅 Sessions

| Method | Endpoint                     | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| `POST` | `/api/sessions`              | Create a new session                       |
| `GET`  | `/api/sessions/user/:userId` | Get all sessions for a user                |
| `PUT`  | `/api/sessions/:id`          | Update session status, feedback, or rating |

### 🧠 Skills

| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| `GET`  | `/api/skills` | Get all skills  |
| `POST` | `/api/skills` | Add a new skill |

### 📊 Dashboard Stats

| Method | Endpoint     | Description                            |
| ------ | ------------ | -------------------------------------- |
| `GET`  | `/api/stats` | Get total counts of users and sessions |

---

## 🧪 Demo Credentials

| Role   | Email              | Password  |
| ------ | ------------------ | --------- |
| Youth  | `student@demo.com` | `demo123` |
| Mentor | `mentor@demo.com`  | `demo123` |

---

## 🧑‍💻 Contributors

* **Sanchitha V (23BCB0077)**
* **Nehal Solanki (23BCB0076)**

---

## 📜 License

This project is licensed under the **MIT License**.