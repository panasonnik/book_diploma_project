import { saveBookPreference, isBookLiked, deleteBookPreference } from '../models/bookModel.js';

export async function saveBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const userId = req.user.userId;
        const isLiked = await isBookLiked(userId, bookId);

        if (isLiked) {
            await deleteBookPreference(userId, bookId);
        } else {
            await saveBookPreference(userId, bookId);
            // await updateBookScores(userId, bookId);
        }

        res.redirect('/home');
    } catch (err) {
        console.error("Error saving book:", err);
        res.status(500).send("Error saving book");
    }
}

export async function removeBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const userId = req.user.userId;
        await deleteBookPreference(userId, bookId);
        res.redirect('/profile');
    } catch (err) {
        console.error("Error removing book:", err);
        res.status(500).send("Error removing book");
    }
}