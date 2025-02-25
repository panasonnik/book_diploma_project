import express from "express";
import { showHomepage } from "../controllers/homeController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register');
});

router.get('/home', authenticateToken, showHomepage);

export default router;

