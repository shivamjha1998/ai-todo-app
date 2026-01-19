import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TaskList from './components/TaskList';
import TaskDetails from './components/TaskDetails';
import './main.scss';

function App() {
  return (
    <BrowserRouter>
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom">
          <Link to="/" className="d-flex align-items-center text-dark text-decoration-none">
            <span className="fs-4">AI Todo App</span>
          </Link>
        </header>

        <Routes>
          <Route path="/" element={
            <>
              <div className="p-5 mb-4 bg-light rounded-3 shadow-sm border">
                <div className="container-fluid py-3">
                  <h1 className="display-6 fw-bold">Intelligent Task Management</h1>
                  <p className="col-md-8 fs-5 text-muted">Analyze tasks, get suggestions, and stay organized with the power of Claude AI.</p>
                </div>
              </div>
              <TaskList />
            </>
          } />
          <Route path="/tasks/:id" element={<TaskDetails />} />
        </Routes>

        <footer className="pt-3 mt-4 text-muted border-top">
          &copy; 2026 AI Todo App
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
