const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// Cache the MongoDB connection
let cachedDb = null;

// MongoDB connection with caching and better error handling
const connectDB = async () => {
  try {
    // If we have a cached connection, return it
    if (cachedDb) {
      console.log('Using cached database connection');
      return cachedDb;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Log connection attempt (without sensitive info)
    const sanitizedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('Attempting to connect to MongoDB...', {
      uri: sanitizedURI
    });

    // Configure mongoose
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1, // Reduce pool size for serverless
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });

    // Cache the connection
    cachedDb = connection;
    
    console.log('Connected to MongoDB successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port
    });

    return connection;
  } catch (err) {
    console.error('MongoDB connection error:', {
      message: err.message,
      name: err.name,
      code: err.code
    });
    
    // Clear the cached connection
    cachedDb = null;
    
    // Don't throw in production, let the app continue running
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  }
};

// Initialize database connection
connectDB().catch(console.error);

// Add connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  cachedDb = null;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cachedDb = null;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  cachedDb = mongoose.connection;
});

// Health check endpoint with detailed status
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const mongoStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[mongoStatus] || 'unknown';

    // If disconnected, try to reconnect
    if (mongoStatus === 0) {
      await connectDB();
    }

    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mongodb: {
        status: mongoStatusText,
        readyState: mongoStatus,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
        cached: !!cachedDb
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
