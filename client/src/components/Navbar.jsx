import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const [activeLink, setActiveLink] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLinkClick = (link) => {
    setActiveLink(link);
    setIsMobileMenuOpen(false); // Close mobile menu when a link is clicked
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            onClick={() => handleLinkClick('home')}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <span className="text-indigo-600 font-bold text-xl">B</span>
            </div>
            <span className="text-white text-2xl font-extrabold tracking-tight hover:text-indigo-100 transition-colors duration-300">
              Blogosphere
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-indigo-100 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'home' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
              onClick={() => handleLinkClick('home')}
            >
              Home
              {activeLink === 'home' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-white rounded-full"></span>
              )}
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/editor" 
                  className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'editor' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                  onClick={() => handleLinkClick('editor')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    New Post
                  </span>
                </Link>
                
                <Link 
                  to="/blogs" 
                  className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'blogs' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                  onClick={() => handleLinkClick('blogs')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    My Blogs
                  </span>
                </Link>
              </>
            ) : null}

            {/* User Profile/Login Button */}
            <div className="relative group">
              {user ? (
                <button className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-xs rounded-full px-4 py-2 text-white font-medium hover:bg-opacity-30 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span>{user.name || 'User'}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-xs rounded-full px-4 py-2 text-white font-medium hover:bg-opacity-30 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span>Login</span>
                </Link>
              )}
              
              {user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-1">
                  <Link to="/settings" className="block px-4 py-2 text-gray-800 hover:bg-indigo-500 hover:text-white">
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-500 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mt-4 pb-4`}>
          <div className="flex flex-col space-y-3">
            <Link 
              to="/" 
              className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'home' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
              onClick={() => handleLinkClick('home')}
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/editor" 
                  className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'editor' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                  onClick={() => handleLinkClick('editor')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    New Post
                  </span>
                </Link>
                
                <Link 
                  to="/blogs" 
                  className={`relative px-3 py-2 text-white font-medium rounded-lg transition-all duration-300 ${activeLink === 'blogs' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                  onClick={() => handleLinkClick('blogs')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    My Blogs
                  </span>
                </Link>

                <Link 
                  to="/settings" 
                  className="px-3 py-2 text-white font-medium rounded-lg hover:bg-white hover:bg-opacity-10"
                >
                  Settings
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 text-white font-medium rounded-lg hover:bg-white hover:bg-opacity-10 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-xs rounded-lg px-4 py-2 text-white font-medium hover:bg-opacity-30 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;