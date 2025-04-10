import { showReadBookPage, updateBookPages } from "../controllers/bookController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';
import express from "express";

const router = express.Router();

router.get('/:title', authenticateToken, showReadBookPage);
router.post('/:title/update-pages', authenticateToken, updateBookPages);

export default router;

