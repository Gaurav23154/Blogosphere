import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BlogEditor from './pages/BlogEditor';
import BlogList from './pages/BlogList';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <div className="app min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-xl shadow-xs p-6 sm:p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/editor" 
              element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editor/:id" 
              element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs" 
              element={
                <ProtectedRoute>
                  <BlogList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Blog App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default AppRoutes; 