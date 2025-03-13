import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.get('/', (req, res) => {
  res.send('Location Tracker Server Running');
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.emit('updateUsers', Array.from(users.values()));

  socket.on('updateLocation', (data) => {
    users.set(socket.id, { ...data, id: socket.id });
    io.emit('updateUsers', Array.from(users.values()));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users.delete(socket.id);
    io.emit('updateUsers', Array.from(users.values()));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});