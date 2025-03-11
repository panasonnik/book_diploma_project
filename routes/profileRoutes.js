import express from "express";
import { showProfilePage, showEditProfilePage, saveProfileChanges } from "../controllers/profileController.js";
import { authenticateToken, checkQuizCompletion } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, checkQuizCompletion, showProfilePage);
router.get('/edit', authenticateToken, checkQuizCompletion, showEditProfilePage);
router.post('/save-changes', authenticateToken, saveProfileChanges);

export default router;