const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Blog = require('../models/Blog');

// @route   GET api/blogs/user
// @desc    Get all blogs for the current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/blogs/:id
// @desc    Get a single blog
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/blogs
// @desc    Create a new blog
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, isDraft } = req.body;
    const newBlog = new Blog({
      title,
      content,
      author: req.user.id,
      isDraft: isDraft || false
    });
    const blog = await newBlog.save();
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/blogs/:id
// @desc    Update a blog
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, isDraft } = req.body;
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user owns the blog
    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, isDraft: isDraft || false },
      { new: true }
    );

    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/blogs/:id
// @desc    Delete a blog
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user owns the blog
    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await blog.deleteOne();
    res.json({ message: 'Blog removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 