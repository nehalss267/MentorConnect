# MentorConnect - Youth Mentorship System

MentorConnect is a full-stack web application designed to connect underprivileged youth with experienced mentors. It provides a platform for managing user profiles, booking mentorship sessions, and browsing users by their skills and roles.

This project is built with **Node.js**, **Express**, and **SQLite** for the backend, and uses vanilla **HTML, CSS, and JavaScript** for the frontend.

## Features

  * **User Authentication:** Secure registration and login for two distinct roles: `youth` and `mentor`.
  * **Profile Management:** Users can create and update their own profiles (name, age, location, bio, skills, education, experience).
  * **Discover:** Youth can browse mentors (and request a session directly), and mentors can see youth seeking guidance. Search/filter by name, skill, or location.
  * **Session Booking:** Youth can request a session with a chosen mentor (from a dropdown — no raw IDs), with topic, description, date, and duration.
  * **Role-based Session Management:**
    * *Mentor*: accept/decline pending requests, mark accepted sessions completed.
    * *Youth*: cancel or delete their pending request, rate (1-5) and leave feedback on completed sessions.
  * **Skills Catalog:** View and add skills.
  * **Dashboard:** Live statistics plus the 5 most recent sessions.

## Tech Stack

  * **Backend:** Node.js, Express.js
  * **Database:** SQLite3 (with foreign keys + CHECK constraints)
  * **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+ with `fetch` API)

## Project Structure

```
MentorConnect/
|
|-- /public/
|   |-- index.html      # Main (and only) HTML file
|   |-- style.css       # All frontend styles
|   |-- script.js       # All client-side logic
|
|-- node_modules/       # (Created by npm install)
|-- .gitignore
|-- mentor_system.db    # (Created automatically on first run)
|-- package-lock.json
|-- package.json
|-- server.js           # Express server, API routes, and DB logic
```

## Getting Started

### Prerequisites

You must have [Node.js](https://nodejs.org/) (which includes npm) installed on your machine.

### Installation & Running

1.  Clone the repository (or download and extract the files) into a new directory:
    ```sh
    git clone https://github.com/nehalss267/MentorConnect
    ```
2.  Navigate to the project directory:
    ```sh
    cd MentorConnect
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```
4.  Run the server:
    ```sh
    npm start
    ```
    or, for development with auto-restart:
    ```sh
    npm run dev
    ```
5.  Open the application in your browser at [http://localhost:5000](http://localhost:5000).

The server creates `mentor_system.db` on first run, populates it with sample data (hashed passwords), and is ready to use. To run on a different port, set the `PORT` environment variable (e.g. `PORT=3000 npm start`).

## Demo Credentials

  * **Youth:** `student@demo.com` / `demo123`
  * **Mentor:** `mentor@demo.com` / `demo123`

Other seeded users: `priya@demo.com` (youth), `raj@demo.com` and `kumar@demo.com` (mentors) — all with password `demo123`.

## API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | — (rate-limited) | Registers a user (youth/mentor), hashes the password, logs them in. |
| `POST` | `/api/login` | — (rate-limited) | Authenticates a user, starts a cookie session. |
| `POST` | `/api/logout` | — | Destroys the session. |
| `GET` | `/api/me` | required | Returns the logged-in user's profile. |
| `GET` | `/api/mentors` | — | Lists all users with the `mentor` role. |
| `GET` | `/api/youth` | — | Lists all users with the `youth` role. |
| `GET` | `/api/users/:id` | — | Gets a single user's public profile. |
| `PUT` | `/api/users/:id` | required (self only) | Updates your own profile. |
| `DELETE` | `/api/users/:id` | required (self only) | Deletes your own account (cascades to your sessions). |
| `POST` | `/api/sessions` | required (youth) | Requests a session with a mentor. Rejects duplicates and invalid mentors. |
| `GET` | `/api/sessions/user/:userId` | required (self only) | Lists sessions for the logged-in user. |
| `PUT` | `/api/sessions/:id` | required | Mentor: `accepted`/`declined`/`completed`. Youth: `cancelled`, or rating/feedback on completed sessions. |
| `DELETE` | `/api/sessions/:id` | required (youth owner) | Deletes a pending session request. |
| `GET` | `/api/skills` | — | Lists all skills. |
| `POST` | `/api/skills` | required | Adds a skill. |
| `GET` | `/api/stats` | — | Dashboard statistics + `recent_activity` (last 5 sessions). |


## Testing

```sh
npm test
```

Runs a syntax check on `server.js` and `public/script.js`.
