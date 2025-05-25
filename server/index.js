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

// MongoDB connection with better error handling and retry logic
const connectDB = async (retries = 5, interval = 5000) => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI is not defined in environment variables');
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Log connection attempt (without sensitive info)
    const sanitizedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('Attempting to connect to MongoDB...', {
      uri: sanitizedURI,
      retries,
      interval
    });

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000, // 10 seconds
      heartbeatFrequencyMS: 2000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 60000, // 1 minute
      waitQueueTimeoutMS: 10000, // 10 seconds
      retryWrites: true,
      w: 'majority'
    });

    console.log('Connected to MongoDB successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port
    });
  } catch (err) {
    console.error('MongoDB connection error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      retries
    });
    
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      setTimeout(() => {
        connectDB(retries - 1, interval);
      }, interval);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    }
  }
};

// Initialize database connection
connectDB();

// Add connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Attempt to reconnect on error
  if (process.env.NODE_ENV === 'production') {
    console.log('Attempting to reconnect to MongoDB...');
    connectDB();
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  // Attempt to reconnect
  if (process.env.NODE_ENV === 'production') {
    console.log('Attempting to reconnect to MongoDB...');
    connectDB();
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[mongoStatus] || 'unknown';

  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStatusText,
      readyState: mongoStatus,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown'
    }
  });
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
