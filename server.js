const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let broadcaster;

io.on('connection', socket => {
    console.log('New client connected:', socket.id);

    socket.on('broadcaster', () => {
        broadcaster = socket.id;
        socket.join('broadcaster');
        socket.emit('broadcaster');
        console.log('Broadcaster connected:', broadcaster);
    });

    socket.on('watcher', () => {
        socket.join('watcher');
        if (broadcaster) {
            socket.emit('broadcaster_found');
            io.to(broadcaster).emit('watcher', socket.id);
            console.log('Watcher connected, notifying broadcaster:', socket.id);
        } else {
            socket.emit('no_broadcaster');
            console.log('Watcher connected, no broadcaster yet:', socket.id);
        }
    });

    socket.on('offer', (id, message) => {
        io.to(id).emit('offer', socket.id, message);
        console.log('Offer from', socket.id, 'to', id);
    });

    socket.on('answer', (id, message) => {
        io.to(id).emit('answer', socket.id, message);
        console.log('Answer from', socket.id, 'to', id);
    });

    socket.on('candidate', (id, message) => {
        io.to(id).emit('candidate', socket.id, message);
        console.log('Candidate from', socket.id, 'to', id);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.id === broadcaster) {
            broadcaster = null;
            io.emit('broadcaster_disconnected');
            console.log('Broadcaster disconnected.');
        } else {
            io.to(broadcaster).emit('disconnectPeer', socket.id);
            console.log('Watcher disconnected, notifying broadcaster:', socket.id);
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
