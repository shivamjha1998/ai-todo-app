import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import taskRoutes from './routes/taskRoutes';
import './queue/taskQueue';
import authRoutes from './routes/authRoutes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI-Powered Todo App Backend is running');
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
