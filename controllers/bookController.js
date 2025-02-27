import { saveBookPreference, isBookLiked, deleteBookPreference } from '../models/bookModel.js';
import { updateBookScores } from '../utils/updateBookScores.js';

export async function saveBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const userId = req.user.userId;
        const isLiked = await isBookLiked(userId, bookId);

        if (isLiked) {
            await deleteBookPreference(userId, bookId);
            console.log('Book preference deleted');
        } else {
            await saveBookPreference(userId, bookId);
            console.log('Book preference saved');
            await updateBookScores(userId, bookId);
            console.log('Book scores updated');
        }

        res.redirect('/home');
    } catch (err) {
        console.error("Error saving book:", err);
        res.status(500).send("Error saving book");
    }
}
