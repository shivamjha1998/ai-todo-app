import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTask } from '../services/api';
import type { Task } from '../types';
import ReactMarkdown from 'react-markdown';

export default function TaskDetails() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadTask(id);
    }, [id]);

    const loadTask = async (taskId: string) => {
        try {
            const data = await getTask(taskId);
            setTask(data);
        } catch (error) {
            console.error('Failed to load task', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading...</div>;
    if (!task) return <div className="p-5 text-center">Task not found</div>;

    return (
        <div className="container">
            <div className="mb-4">
                <Link to="/" className="btn btn-outline-secondary mb-3">&larr; Back to List</Link>
                <div className="d-flex justify-content-between align-items-start">
                    <h1>{task.title}</h1>
                    <span className={`badge ${task.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`}>{task.status}</span>
                </div>
                <p className="lead text-muted">{task.description || 'No description provided.'}</p>
            </div>

            <div className="card">
                <div className="card-header bg-white">
                    <h4 className="mb-0">AI Assistant & Threads</h4>
                </div>
                <div className="card-body bg-light">
                    {task.threads?.length === 0 ? (
                        <p className="text-center text-muted my-4">No AI interactions yet. Analysis might be in progress...</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {task.threads?.map(thread => (
                                <div key={thread.id} className={`card ${thread.role === 'ASSISTANT' ? 'border-primary' : ''}`}>
                                    <div className="card-body">
                                        <h6 className="card-subtitle mb-2 text-muted text-uppercase small">{thread.role === 'ASSISTANT' ? '🤖 AI Assistant' : '👤 You'}</h6>
                                        <div className="card-text markdown-body">
                                            <ReactMarkdown>{thread.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
