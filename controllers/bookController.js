import { saveBookPreference, isBookLiked, deleteBookPreference } from '../models/bookModel.js';
import { updateBookScores } from '../utils/updateBookScores.js';

export async function saveBook(req, res) {
    try {
        const bookId = req.body.book_id;
        console.log(req.body);
        const userId = req.user.userId;
        const isLiked = await isBookLiked(userId, bookId);

        if (isLiked) {
            await deleteBookPreference(userId, bookId);
        } else {
            await saveBookPreference(userId, bookId);
            await updateBookScores(userId, bookId);
        }

        res.redirect('/home');
    } catch (err) {
        console.error("Error saving book:", err);
        res.status(500).send("Error saving book");
    }
}
