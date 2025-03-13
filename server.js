const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Import the cors middleware

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Or specific origins like "http://localhost:8080"
        methods: ["GET", "POST"]
    }
});

// Enable CORS for all routes
app.use(cors());
app.use(express.static('public'));

let users = new Map(); // Use Map to track users by socket ID

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send existing users to the new client
    socket.emit('updateUsers', Array.from(users.values()));

    // Listen for location updates
    socket.on('updateLocation', (data) => {
        // Update user's location
        users.set(socket.id, { ...data, id: socket.id });
        // Broadcast updated list to all clients
        io.emit('updateUsers', Array.from(users.values()));
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        users.delete(socket.id); // Remove user on disconnect
        io.emit('updateUsers', Array.from(users.values())); // Notify all clients
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});