import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import taskRoutes from './routes/taskRoutes';
import './queue/taskQueue';
import authRoutes from './routes/authRoutes';

const app = express();
const port = process.env.PORT || 3001;

const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const defaultOrigins = ['http://localhost:5173', 'exp://localhost:19000'];
const allowedOrigins = [...envOrigins, ...defaultOrigins];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI-Powered Todo App Backend is running');
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
