const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const Message = require('./models/Message');

dotenv.config();

const app = express();
const server = http.createServer(app);
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

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('FATAL: MONGO_URI environment variable is not set.');
    process.exit(1);
}

// Disable operation buffering to fail immediately if connection is down
mongoose.set('bufferCommands', false);

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

app.get('/', (req, res) => {
    res.send('Daily Fix API is running...');
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);

    // Join a booking-specific room (e.g., room name = bookingId)
    socket.on('joinBookingRoom', (bookingId) => {
        socket.join(`booking_${bookingId}`);
        console.log(`Socket ${socket.id} joined booking room: booking_${bookingId}`);
    });

    // Also support personal room join (for backward compat / notifications)
    socket.on('join', (userId) => {
        socket.join(userId);
    });

    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, bookingId, message } = data;

        try {
            const newMsg = new Message({ senderId, receiverId, bookingId: bookingId || null, message });
            await newMsg.save();

            if (bookingId) {
                // Booking room: emit to all participants in the booking room (customer + provider)
                io.to(`booking_${bookingId}`).emit('receiveMessage', newMsg);
            } else {
                // Direct chat: emit to receiver AND back to sender (for real-time update on sender side)
                io.to(receiverId).emit('receiveMessage', newMsg);
                io.to(senderId).emit('receiveMessage', newMsg);
            }
        } catch (error) {
            console.error('Socket message save error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from chat:', socket.id);
    });
});

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    });
