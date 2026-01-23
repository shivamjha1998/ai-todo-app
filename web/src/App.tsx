import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import TaskList from './components/TaskList';
import TaskDetails from './components/TaskDetails';
import Auth from './components/Auth';
import './main.scss';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on initial load
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center">
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <span className="fs-4 fw-bold">AI Todo App</span>
          </Link>
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">Logout</button>
        </header>

        <Routes>
          <Route path="/" element={
            <>
              <div className="p-5 mb-4 bg-white rounded-3 border">
                <div className="container-fluid py-3">
                  <h1 className="display-6 fw-bold">Intelligent Task Management</h1>
                  <p className="col-md-8 fs-5 text-muted">Analyze tasks, get suggestions, and stay organized with the power of AI.</p>
                </div>
              </div>
              <TaskList />
            </>
          } />
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <footer className="pt-3 mt-4 text-muted border-top">
          &copy; 2026 AI Todo App
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
