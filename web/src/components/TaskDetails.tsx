import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTask, postQuery } from '../services/api';
import type { Task } from '../types';
import ReactMarkdown from 'react-markdown';

export default function TaskDetails() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);

    useEffect(() => {
        if (id) loadTask(id);
    }, [id]);

    useEffect(() => {
        if (task?.aiStatus === 'PROCESSING') {
            const intervalId = setInterval(() => {
                if (id) loadTask(id);
            }, 3000);

            return () => clearInterval(intervalId);
        }
    }, [task, id]);

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

    const handleSendQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !id) return;

        setIsAsking(true);
        try {
            await postQuery(id, question);
            setQuestion('');
            await loadTask(id);
        } catch (error) {
            console.error('Failed to send question', error);
            alert('Failed to get an answer. Please try again.');
        } finally {
            setIsAsking(false);
        }
    }

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
                <div className="card-body">
                    <div className="d-flex flex-column gap-3 mb-4">
                        {task.threads?.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(thread => (
                            <div key={thread.id} className="card mb-3" style={
                                thread.role === 'ASSISTANT'
                                    ? { borderLeft: '5px solid #5dcdf3', backgroundColor: '#fff' }
                                    : { borderRight: '5px solid #fa8a8b', backgroundColor: '#fff' }
                            }>
                                <div className="card-body">
                                    <h6 className="card-subtitle mb-2 text-muted text-uppercase small">
                                        {thread.role === 'ASSISTANT' ? '🤖 AI Assistant' : '👤 You'}
                                    </h6>
                                    <div className="card-text markdown-body">
                                        <ReactMarkdown>{thread.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendQuery} className="mt-4 border-top pt-3">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ask a follow-up question about this task..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                disabled={isAsking}
                            />
                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={isAsking || !question.trim()}
                            >
                                {isAsking ? 'thinking...' : 'Ask AI'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
