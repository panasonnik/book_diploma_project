import express from "express";
import { registerUser, loginUser, logoutUser, allUsers } from "../controllers/authController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/users', allUsers);

export default router;

