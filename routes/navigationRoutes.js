import express from "express";
import { showHomepage } from "../controllers/homeController.js";
import { showQuiz } from "../controllers/quizController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register');
});
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/home', authenticateToken, showHomepage);
router.get('/quiz', authenticateToken, showQuiz);

export default router;

