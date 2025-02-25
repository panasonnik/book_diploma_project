import { getUserBooks } from '../models/userModel.js';

export async function showHomepage(req, res) {

    try {
        const userId = req.user.userId;
        const books = await getUserBooks(userId);
        res.render('homepage', { books: books });
    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    }
}
