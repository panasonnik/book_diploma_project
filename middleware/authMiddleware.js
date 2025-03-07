import { getUserById } from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).redirect('/');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).redirect('/');
        req.user = user;
        next();
    });
}

export async function checkQuizCompletion(req, res, next) {
    const userId = req.user.userId;
    try {
        const user = await getUserById(userId);
        
        if (!user.has_completed_quiz) {
            return res.redirect('/quiz');
        }
        next();
    } catch (error) {
        console.error('Error checking quiz completion:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


