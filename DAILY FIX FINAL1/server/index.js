require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Socket.io
const io = new Server(server, {
    cors: {
        origin: 'https://daily-fix-lovat.vercel.app',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://daily-fix-lovat.vercel.app',
    credentials: true
}));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default health check route
app.get('/', (req, res) => {
    res.send('Backend is running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/public', require('./routes/public'));

// Socket.io logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinBookingRoom', (bookingId) => {
        socket.join(`booking_${bookingId}`);
    });

    socket.on('join', (userId) => {
        socket.join(userId);
    });

    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, bookingId, message } = data;
        try {
            const newMsg = new Message({ senderId, receiverId, bookingId: bookingId || null, message });
            await newMsg.save();
            if (bookingId) {
                io.to(`booking_${bookingId}`).emit('receiveMessage', newMsg);
            } else {
                io.to(receiverId).emit('receiveMessage', newMsg);
                io.to(senderId).emit('receiveMessage', newMsg);
            }
        } catch (error) {
            console.error('Socket message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server immediately so Railway health check passes
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB after server is already listening
if (!MONGO_URI) {
    console.error('WARNING: MONGO_URI is not set. Database features will not work.');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB connection failed:', err.message));
}
