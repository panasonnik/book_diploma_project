import express from "express";
import { showHomepage } from "../controllers/homeController.js";
import { showQuiz, submitQuiz } from "../controllers/quizController.js";
import { saveBook, removeBook } from "../controllers/bookController.js";
import { authenticateToken, checkQuizCompletion } from '../middleware/authMiddleware.js';
import { updateBookScores } from '../utils/updateBookScores.js';
import { getTranslations } from '../utils/getTranslations.js';

const router = express.Router();

router.get('/', (req, res) => {
    const translations = getTranslations(req);
    res.render('register', {translations, errorDB:null, errorUsername:null, errorEmail:null, data:null});
});
router.get('/login', (req, res) => {
    const translations = getTranslations(req);
    res.render('login', {translations, errorDB:null, errorUsername: null, errorPassword:null, data: null});
});

router.get('/home', authenticateToken, checkQuizCompletion, showHomepage);
router.get('/quiz', authenticateToken, showQuiz);
router.post('/quiz/submit', authenticateToken, submitQuiz);
router.post('/update-book-scores', authenticateToken, updateBookScores);
router.post('/save-book', authenticateToken, saveBook);
router.post('/remove-book', authenticateToken, removeBook);

export default router;

