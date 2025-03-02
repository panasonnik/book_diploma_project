import express from "express";
import { showHomepage, showProfilePage } from "../controllers/homeController.js";
import { showQuiz, submitQuiz } from "../controllers/quizController.js";
import { saveBook } from "../controllers/bookController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register', {errorDB:null, errorUsername:null, errorEmail:null, data:null});
});
router.get('/login', (req, res) => {
    res.render('login', {errorDB:null, errorUsername: null, errorPassword:null, data: null});
});

router.get('/home', authenticateToken, showHomepage);
router.get('/quiz', authenticateToken, showQuiz);
router.post('/quiz/submit', authenticateToken, submitQuiz);
router.get('/profile', authenticateToken, showProfilePage);
router.post('/save-book', authenticateToken, saveBook);

export default router;

