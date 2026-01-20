import { useState, useEffect } from 'react';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';
import type { Task, CreateTaskDto } from '../types';
import { Link } from 'react-router-dom';

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [loading, setLoading] = useState(false);

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
        if (!newTaskTitle.trim()) return;

        setLoading(true);
        try {
            const newTask: CreateTaskDto = {
                title: newTaskTitle,
                priority: 'MEDIUM', // default
            };
            await createTask(newTask);
            setNewTaskTitle('');
            await loadTasks(); // reload to get AI status if immediate
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
                    <form onSubmit={handleCreateTask} className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="What do you need to do? (AI will analyze it)"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Task'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="list-group">
                {tasks.map(task => (
                    <div key={task.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
                        <div className="d-flex flex-column">
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input mt-0"
                                    checked={task.status === 'COMPLETED'}
                                    onChange={() => handleToggleStatus(task)}
                                />
                                <h5 className="mb-0 text-decoration-none">
                                    <Link to={`/tasks/${task.id}`} className="text-dark text-decoration-none">
                                        {task.title}
                                    </Link>
                                </h5>
                                {task.aiStatus === 'PROCESSING' && <span className="badge bg-warning text-dark">AI Analyzing...</span>}
                                {task.aiStatus === 'COMPLETED' && <span className="badge bg-success">AI Suggestions Ready</span>}
                                {task.aiStatus === 'ERROR' && <span className="badge bg-danger">AI Error</span>}
                            </div>
                            <small className="text-muted mt-1">Priority: {task.priority} • Created: {new Date(task.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(task.id)}>Delete</button>
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
