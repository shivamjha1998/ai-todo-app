import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI-Powered Todo App Backend is running');
});

app.use('/tasks', taskRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
