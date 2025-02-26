import express from "express";
import { showHomepage, showProfilePage } from "../controllers/homeController.js";
import { showQuiz, submitQuiz } from "../controllers/quizController.js";
import { saveBook } from "../controllers/bookController.js";
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
router.post('/quiz/submit', authenticateToken, submitQuiz);
router.get('/profile', authenticateToken, showProfilePage);
router.post('/save-book', authenticateToken, saveBook);

export default router;

