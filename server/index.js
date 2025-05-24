const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Backend Vercel URL
  process.env.CLIENT_URL, // Frontend URL (optional)
  process.env.FRONTEND_URL // Frontend URL (optional)
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't exit process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// ✅ Blog Schema (tags as Array)
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  coverImage: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ✅ Auto-update `updated_at`
blogSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

blogSchema.pre('findOneAndUpdate', function(next) {
  this._update.updated_at = new Date();
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ✅ Create blog
app.post('/api/blogs', async (req, res) => {
  try {
    const { title, content, tags, status, coverImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await Blog.create({
      title,
      content,
      tags,
      coverImage,
      status: status || 'draft'
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update blog
app.put('/api/blogs/:id', async (req, res) => {
  try {
    const { title, content, tags, status, coverImage } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, tags, coverImage, status },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all blogs grouped by status
app.get('/api/blogs', async (req, res) => {
  try {
    const published = await Blog.find({ status: 'published' }).sort({ updated_at: -1 });
    const drafts = await Blog.find({ status: 'draft' }).sort({ updated_at: -1 });
    res.json({ published, drafts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single blog
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
