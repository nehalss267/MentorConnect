const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/index'); // Import main API router

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json()); // To parse JSON request bodies

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Use the API routes
// All routes in './routes/index.js' will be prefixed with /api
app.use('/api', apiRoutes);

// Fallback: send index.html for any other GET request (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
