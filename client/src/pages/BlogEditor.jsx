import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../context/AuthContext';
import { 
  FiImage, 
  FiSave, 
  FiX, 
  FiShare2, 
  FiLoader 
} from 'react-icons/fi';

function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft',
    coverImage: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (id) {
      const fetchBlog = async () => {
        try {
          const response = await api.get(`/blogs/${id}`);
          setBlog(response.data);
          calculateCounts(response.data.content);
        } catch (error) {
          toast.error('Error fetching blog post');
          navigate('/blogs');
        }
      };
      fetchBlog();
    }
  }, [id, navigate]);

  const calculateCounts = (content) => {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  const autoSave = useCallback(
    async (updatedBlog) => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        if (id) {
          await api.put(`/blogs/${id}`, updatedBlog);
        } else {
          await api.post('/blogs/save-draft', updatedBlog);
        }
        toast.success('Draft saved', {
          icon: '💾',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } catch (error) {
        toast.error('Error saving draft');
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, id]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (blog.title || blog.content) {
        autoSave(blog);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [blog, autoSave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlog((prev) => ({ ...prev, [name]: value }));
    if (name === 'content') {
      calculateCounts(value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setBlog((prev) => ({ ...prev, coverImage: response.data.url }));
      toast.success('Cover image uploaded!');
    } catch (error) {
      toast.error('Error uploading image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      if (id) {
        await api.put(`/blogs/${id}`, { ...blog, status: 'published' });
      } else {
        await api.post('/blogs/publish', blog);
      }
      toast.success('Blog published successfully!', {
        icon: '🎉',
        style: {
          borderRadius: '10px',
          background: '#4CAF50',
          color: '#fff',
        },
      });
      navigate('/blogs');
    } catch (error) {
      toast.error('Error publishing blog');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {id ? 'Edit Your Story' : 'Create New Story'}
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {wordCount} words • {charCount} chars
          </span>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isSaving ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {isSaving ? 'Saving...' : 'Draft saved'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image Upload */}
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
            {blog.coverImage ? (
              <img 
                src={blog.coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <FiImage className="h-12 w-12" />
                <span>Click to upload cover image</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={blog.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your blog title"
            required
          />
        </div>

        {/* Content Input */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={blog.content}
            onChange={handleChange}
            className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Write your blog content here..."
            required
          />
        </div>

        {/* Tags Input */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={blog.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., technology, programming, web development"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => autoSave(blog)}
              disabled={isSaving}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <FiLoader className="animate-spin h-4 w-4 text-gray-600" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="h-5 w-5" />
                  <span>Save Draft</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FiX className="h-5 w-5" />
              <span>Cancel</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={isPublishing}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            {isPublishing ? (
              <>
                <FiLoader className="animate-spin h-4 w-4 text-white" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <FiShare2 className="h-5 w-5" />
                <span>Publish Story</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BlogEditor;
