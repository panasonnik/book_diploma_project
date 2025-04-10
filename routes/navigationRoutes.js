import express from "express";
import { showHomepage } from "../controllers/homeController.js";
import { showQuiz, submitQuiz, showRetakeQuiz, submitRetakeQuiz } from "../controllers/quizController.js";
import { saveBook, removeBook } from "../controllers/bookController.js";
import { authenticateToken, checkQuizCompletion } from '../middleware/authMiddleware.js';
import { updateBookScoresReadBooks, updateBookScoresLikedBooks } from '../utils/updateBookScores.js';
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
router.get('/quiz/update-preferences', authenticateToken, showRetakeQuiz);
router.post('/quiz/submit',authenticateToken, submitQuiz);
router.post('/quiz/update-preferences/submit', authenticateToken, submitRetakeQuiz);
router.post('/update-book-scores-read',authenticateToken, updateBookScoresReadBooks);
router.post('/update-book-scores-liked',authenticateToken, updateBookScoresLikedBooks);
router.post('/save-book',authenticateToken, saveBook);
router.post('/remove-book',authenticateToken, removeBook);
// router.post('/remove-read-book',authenticateToken, removeReadBook);

export default router;

