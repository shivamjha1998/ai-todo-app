import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined.");
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token missing.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;
        (req as AuthRequest).user = verified;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};
