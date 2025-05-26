const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();

// Import routes
const authRoutes = require('./routes/auth');

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://blogosphere-server-seven.vercel.app',
    'https://blogosphere-git-main-gaurav-jaiswals-projects-031b18ef.vercel.app',
    'https://blogosphere-pearl.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Use routes
app.use('/api/auth', authRoutes);

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI is not defined in environment variables');
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      retryWrites: true, // Retry write operations if they fail
      retryReads: true // Retry read operations if they fail
    });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Don't exit process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Add connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
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

// ✅ Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  coverImage: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ✅ Auto-update `updated_at`
blogSchema.pre('save', function(next) {
  this.updated_at = new Date();
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

// ✅ Save draft
app.post('/api/blogs/save-draft', async (req, res) => {
  try {
    const { title, content, tags, coverImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await Blog.create({
      title,
      content,
      tags: tags || [],
      coverImage,
      status: 'draft',
      author: req.user.id
    });

    res.status(201).json(blog);
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Publish blog
app.post('/api/blogs/publish', async (req, res) => {
  try {
    const { title, content, tags, coverImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await Blog.create({
      title,
      content,
      tags: tags || [],
      coverImage,
      status: 'published',
      author: req.user.id
    });

    res.status(201).json(blog);
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get user's blogs
app.get('/api/blogs/user', async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ updated_at: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const published = await Blog.find({ status: 'published' })
      .sort({ updated_at: -1 });
    const drafts = await Blog.find({ 
      status: 'draft',
      author: req.user.id 
    }).sort({ updated_at: -1 });
    res.json({ published, drafts });
  } catch (error) {
    console.error('Get all blogs error:', error);
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
    console.error('Get single blog error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update blog
app.put('/api/blogs/:id', async (req, res) => {
  try {
    const { title, content, tags, status, coverImage } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        content, 
        tags: tags || blog.tags, 
        coverImage: coverImage || blog.coverImage,
        status: status || blog.status,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json(updatedBlog);
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete blog
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await blog.deleteOne();
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configure Cloudinary
cloudinary.config({
  url: process.env.CLOUDINARY_URL
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'blogosphere',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

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
