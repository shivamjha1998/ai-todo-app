import { Router } from 'express';
import {
    getTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    submitQuery
} from '../controllers/taskController';

const router = Router();

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/query', submitQuery);

export default router;
