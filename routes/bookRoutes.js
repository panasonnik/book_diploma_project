import { showReadBookPage, updateBookPages, addBookPage, addBookToDB, addGenrePage, addGenreToDB, deleteBook } from "../controllers/bookController.js";
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';
import express from "express";
import { upload } from "../middleware/uploadImage.js";

const router = express.Router();

router.get('/add', authenticateToken, isAdmin, addBookPage);
router.get('/add-genre', authenticateToken, isAdmin, addGenrePage);
router.post('/delete-book',authenticateToken, deleteBook);
router.post('/add', authenticateToken, isAdmin, upload.single('cover'), addBookToDB);
router.post('/add-genre', authenticateToken, isAdmin, addGenreToDB);
router.get('/:title', authenticateToken, showReadBookPage);

router.post('/:title/update-pages', authenticateToken, updateBookPages);



export default router;

