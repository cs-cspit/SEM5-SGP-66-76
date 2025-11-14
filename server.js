require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const vendorRoutes = require('./routes/vendor');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/vendor', vendorRoutes);

// Serve frontend (optional, if you want to serve static files)
// app.use(express.static('../public'));

// MongoDB Connection
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sgp-practice2';

// Start server even if MongoDB is not available (for testing)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Website is running on http://127.0.0.1:5505/index.html");
    
    // Try to connect to MongoDB
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB connected');
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Server running without database connection');
        });
});