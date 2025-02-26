import { getUserBooks } from '../models/userModel.js';
import { getBooksByGenre } from '../models/bookModel.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const books = await getUserBooks(userId);
        const booksByGenre = await getBooksByGenre();
        res.render('homepage', { books, booksByGenre });
    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    }
}
