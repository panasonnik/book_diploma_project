import { getUserBooks } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const books = await getUserBooks(userId);
        const booksByGenre = await getBooksByGenre();

        for (let book of books) {
            book.is_liked = await isBookLiked(userId, book.book_id);
        }

        for (let genre in booksByGenre) {
            if (Array.isArray(booksByGenre[genre])) {
                for (let book of booksByGenre[genre]) {
                    book.is_liked = await isBookLiked(userId, book.book_id);
                }
            }
        }

        res.render('homepage', { translations, books: books.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    } 
}

