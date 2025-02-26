import { saveBookPreference } from '../models/bookModel.js';

export async function saveBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const userId = req.user.userId;
        await saveBookPreference(userId, bookId);
        res.redirect('/home');
    } catch (err) {
        console.error("Error saving book:", err);
        res.status(500).send("Error saving book");
    }
}