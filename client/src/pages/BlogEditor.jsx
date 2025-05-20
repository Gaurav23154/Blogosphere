import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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
          const response = await axios.get(`/api/blogs/${id}`);
          setBlog(response.data);
          calculateCounts(response.data.content);
        } catch (error) {
          toast.error('Error fetching blog post');
        }
      };
      fetchBlog();
    }
  }, [id]);

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
        await axios.post('/api/blogs/save-draft', updatedBlog);
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
    [isSaving]
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
  };

  const handleEditorChange = (content) => {
    setBlog((prev) => ({ ...prev, content }));
    calculateCounts(content);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('/api/upload', formData);
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
      const response = await axios.post('/api/blogs/publish', blog);
      toast.success('Blog published successfully!', {
        icon: '🎉',
        style: {
          borderRadius: '10px',
          background: '#4CAF50',
          color: '#fff',
        },
      });
      navigate(`/blogs/${response.data.id}`);
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Title
          </label>
          <input
            type="text"
            name="title"
            value={blog.title}
            onChange={handleChange}
            className="w-full px-4 py-3 text-2xl font-semibold border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
            placeholder="Your amazing story title..."
            required
          />
        </div>

        {/* Content Editor */}
        <div className="rounded-lg overflow-hidden shadow-lg">
          <Editor
            apiKey="cjvt7yxvcaz66kh9hypfx6ygsmklcy883z998wlsggfqck9j"
            value={blog.content}
            onEditorChange={handleEditorChange}
            init={{
              height: 600,
              menubar: true,
              skin: 'oxide-dark',
              content_css: 'dark',
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount',
                'codesample'
              ],
              toolbar: `undo redo | formatselect | bold italic underline strikethrough | 
                        forecolor backcolor | alignleft aligncenter alignright alignjustify | 
                        bullist numlist outdent indent | link image media codesample | 
                        table | code | fullscreen | help`,
              content_style: 'body { font-family:Inter,sans-serif; font-size:16px; line-height:1.6; }',
              images_upload_handler: async (blobInfo, progress) => {
                const formData = new FormData();
                formData.append('image', blobInfo.blob(), blobInfo.filename());

                try {
                  const response = await axios.post('/api/upload', formData, {
                    onUploadProgress: (e) => {
                      progress(e.loaded / e.total * 100);
                    }
                  });
                  return response.data.url;
                } catch (error) {
                  toast.error('Error uploading image');
                  throw new Error('Image upload failed');
                }
              }
            }}
          />
        </div>

        {/* Tags Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={blog.tags}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors"
            placeholder="technology, programming, web-development"
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span>Save Draft</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          <button
            type="submit"
            disabled={isPublishing}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            {isPublishing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
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
