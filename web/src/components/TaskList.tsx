import { useState, useEffect } from 'react';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';
import type { Task, CreateTaskDto } from '../types';
import { Link } from 'react-router-dom';

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        const hasProcessingTasks = tasks.some(t => t.aiStatus === 'PROCESSING');

        if (hasProcessingTasks) {
            const intervalId = setInterval(() => {
                loadTasks();
            }, 3000);

            return () => clearInterval(intervalId);
        }
    }, [tasks]);

    const loadTasks = async () => {
        try {
            const data = await fetchTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks', error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const newTask: CreateTaskDto = {
                title,
                description: description || undefined,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
            };
            await createTask(newTask);

            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setDueDate('');
            setShowDetails(false);

            await loadTasks();
        } catch (error) {
            console.error('Failed to create task', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    const handleToggleStatus = async (task: Task) => {
        try {
            const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
            const updatedTask = await updateTask(task.id, { status: newStatus });
            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        } catch (error) {
            console.error('Failed to update task status', error);
        }
    };

    return (
        <div className="container">
            <div className="row mb-4">
                <div className="col">
                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleCreateTask}>
                                {/* Main Input */}
                                <div className="input-group mb-3">
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        placeholder="What do you need to do?"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowDetails(!showDetails)}
                                    >
                                        {showDetails ? 'Hide Details' : 'Add Details'}
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                        {loading ? 'Adding...' : 'Add Task'}
                                    </button>
                                </div>

                                {/* Collapsible Details */}
                                {showDetails && (
                                    <div className="row g-3 animate__animated animate__fadeIn">
                                        <div className="col-md-12">
                                            <label className="form-label">Description (for AI Context)</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                placeholder="Add more details to help the AI..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Priority</label>
                                            <select
                                                className="form-select"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value as any)}
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Due Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List Display */}
            <div className="list-group">
                {tasks.map(task => (
                    <div key={task.id} className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 ${task.priority === 'HIGH' && task.status !== 'COMPLETED' ? 'border-start border-4 border-danger' : ''}`}>
                        <div className="d-flex flex-column flex-grow-1">
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input mt-0"
                                    checked={task.status === 'COMPLETED'}
                                    onChange={() => handleToggleStatus(task)}
                                />
                                <h5 className={`mb-0 text-decoration-none ${task.status === 'COMPLETED' ? 'text-muted text-decoration-line-through' : ''}`}>
                                    <Link to={`/tasks/${task.id}`} className="text-reset text-decoration-none">
                                        {task.title}
                                    </Link>
                                </h5>

                                {/* Status Badges */}
                                {task.aiStatus === 'PROCESSING' && <span className="badge bg-warning text-dark">AI Analyzing...</span>}
                                {task.aiStatus === 'COMPLETED' && <span className="badge bg-success">AI Ready</span>}
                                {task.priority === 'HIGH' && <span className="badge bg-danger">High</span>}
                                {task.priority === 'MEDIUM' && <span className="badge bg-warning text-dark">Medium</span>}
                                {task.priority === 'LOW' && <span className="badge bg-info text-dark">Low</span>}
                            </div>

                            <div className="d-flex gap-3 text-muted mt-1 small">
                                {task.dueDate && (
                                    <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                                {task.description && (
                                    <span className="text-truncate" style={{ maxWidth: '300px' }}>
                                        📝 {task.description}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="ms-2">
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(task.id)}>
                                <i className="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {tasks.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <h4>No tasks yet</h4>
                    <p>Add a task above and let AI help you plan it!</p>
                </div>
            )}
        </div>
    );
}