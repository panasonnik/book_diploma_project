import { saveBookPreference, isBookLiked, deleteBookPreference, getBookByTitle } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { getBookFromOpenLibraryApi } from '../utils/getBookFromOpenLibraryApi.js';

export async function saveBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const isLiked = await isBookLiked(userId, bookId);

        if (isLiked) {
            await deleteBookPreference(userId, bookId);
        } else {
            await saveBookPreference(userId, bookId);
            // await updateBookScores(userId, bookId);
        }

        res.redirect(`/${translations.lang}/home`);
    } catch (err) {
        console.error("Error saving book:", err);
        res.status(500).send("Error saving book");
    }
}

export async function removeBook(req, res) {
    try {
        const bookId = req.body.book_id;
        const translations = getTranslations(req);
        const userId = req.user.userId;
        await deleteBookPreference(userId, bookId);
        res.redirect(`/${translations.lang}/home`);
    } catch (err) {
        console.error("Error removing book:", err);
        res.status(500).send("Error removing book");
    }
}

export async function showReadBookPage (req, res) {
    try {
        const { title } = req.params;
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const book = await getBookByTitle(title);
        const bookPreviewUrl = await getBookFromOpenLibraryApi(title);
        book.is_liked = await isBookLiked(userId, book.book_id);
        

        res.render('read-book', { translations, book, bookPreviewUrl });
    } catch (err) {
        console.error("Error rendering read book:", err);
        res.status(500).send("Error rendering read book");
    }
}