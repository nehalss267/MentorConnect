# MentorConnect - Youth Mentorship System

MentorConnect is a full-stack web application designed to connect underprivileged youth with experienced mentors. It provides a platform for managing user profiles, booking mentorship sessions, and browsing users by their skills and roles.

This project is built with **Node.js**, **Express**, and **SQLite** for the backend, and uses vanilla **HTML, CSS, and JavaScript** for the frontend.

## 🚀 Features

  * **User Authentication:** Secure registration and login for two distinct roles: `youth` and `mentor`.
  * **Profile Management:** Users can create and update their profiles with details like skills, bio, education, and experience.
  * **Discover:** Youth can browse a list of available mentors, and mentors can see youth seeking guidance.
  * **Session Booking:** Youth can request mentorship sessions with a specific mentor by providing a topic and description.
  * **Session Management:** Mentors can view and update the status of requested sessions (e.g., `accept`, `complete`).
  * **Skills Catalog:** A dedicated section to view and add new skills to the system's database.
  * **Admin Dashboard:** A simple dashboard displaying key system statistics, such as the total number of mentors, youth, and sessions.

## 🛠️ Tech Stack

  * **Backend:** Node.js, Express.js
  * **Database:** SQLite3
  * **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+ with `fetch` API)

## 📁 Project Structure

The project is organized into a clean client-server structure:

```
/mentor-project
|
|-- /public/
|   |-- index.html      # Main (and only) HTML file
|   |-- style.css       # All frontend styles
|   |-- script.js       # All client-side logic
|
|-- node_modules/       # (Created by npm install)
|-- .gitignore          # (Recommended: add node_modules/ and *.db)
|-- mentor_system.db    # (Created automatically on first run)
|-- package-lock.json
|-- package.json
|-- server.js           # Express server, API routes, and DB logic
```

## 🏁 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

You must have [Node.js](https://nodejs.org/) (which includes npm) installed on your machine.

### Installation & Running

1.  **Clone the repository** (or download and extract the files) into a new directory.
    ```sh
     git clone https://github.com/nehalss267/MentorConnect/git
    ```
3.  **Navigate to the project directory:**

    ```sh
    cd mentor-project
    ```

4.  **Install the dependencies:**

    ```sh
    npm install
    ```

    This will install `express` and `sqlite3`.

5.  **Run the server:**

    ```sh
    npm start
    ```

    (This runs the `node server.js` script defined in `package.json`).

6.  **Open the application** in your browser at:
    [http://localhost:5000](https://www.google.com/search?q=http://localhost:5000)

The server will start, automatically create the `mentor_system.db` file if it doesn't exist, and populate it with sample data.

## 🔑 Demo Credentials

You can use the built-in sample users to test the application:

  * **Youth:**
      * **Email:** `student@demo.com`
      * **Password:** `demo123`
  * **Mentor:**
      * **Email:** `mentor@demo.com`
      * **Password:** `demo123`

## 📡 API Endpoints

The server exposes the following RESTful API endpoints, which the frontend consumes.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Registers a new user (youth or mentor). |
| `POST` | `/api/login` | Authenticates a user and returns their profile. |
| `GET` | `/api/mentors` | Gets a list of all users with the 'mentor' role. |
| `GET` | `/api/youth` | Gets a list of all users with the 'youth' role. |
| `GET` | `/api/users/:id` | Gets the profile for a single user by ID. |
| `PUT` | `/api/users/:id` | Updates a user's profile information. |
| `POST` | `/api/sessions` | Creates a new mentorship session request. |
| `GET` | `/api/sessions/user/:userId` | Gets all sessions for a specific user (both as youth and mentor). |
| `PUT` | `/api/sessions/:id` | Updates a session's status, rating, or feedback. |
| `GET` | `/api/skills` | Retrieves the list of all skills. |
| `POST` | `/api/skills` | Adds a new skill to the database. |
| `GET` | `/api/stats` | Gets the dashboard statistics (total users, sessions, etc.). |
