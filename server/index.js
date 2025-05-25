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
let isConnecting = false;

// MongoDB connection with caching and better error handling
const connectDB = async () => {
  // If already connecting, return the promise
  if (isConnecting) {
    console.log('Connection attempt already in progress');
    return;
  }

  try {
    isConnecting = true;

    // If we have a cached connection, return it
    if (cachedDb && mongoose.connection.readyState === 1) {
      console.log('Using cached database connection');
      return cachedDb;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Ensure the URI includes the database name
    const uriWithDb = mongoURI.includes('/blogosphere') 
      ? mongoURI 
      : mongoURI.replace(/\?/, '/blogosphere?');

    // Log connection attempt (without sensitive info)
    const sanitizedURI = uriWithDb.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('Attempting to connect to MongoDB...', {
      uri: sanitizedURI,
      readyState: mongoose.connection.readyState
    });

    // Configure mongoose
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB with minimal options
    const connection = await mongoose.connect(uriWithDb, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 3000,
      retryWrites: true,
      w: 'majority',
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      directConnection: false,
      replicaSet: 'atlas-8o9cop-shard-0',
      retryReads: true
    });

    // Cache the connection
    cachedDb = connection;
    isConnecting = false;
    
    console.log('Connected to MongoDB successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port,
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.db.databaseName
    });

    return connection;
  } catch (err) {
    console.error('MongoDB connection error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      readyState: mongoose.connection.readyState
    });
    
    // Clear the cached connection
    cachedDb = null;
    isConnecting = false;
    
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
  isConnecting = false;
  // Attempt immediate reconnection
  connectDB().catch(console.error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cachedDb = null;
  isConnecting = false;
  // Attempt immediate reconnection
  connectDB().catch(console.error);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  cachedDb = mongoose.connection;
  isConnecting = false;
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

    // If not connected, try to reconnect
    if (mongoStatus !== 1) {
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
        cached: !!cachedDb,
        isConnecting
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
