import { saveBookPreference, isBookLiked, deleteBookPreference, getBookByTitle } from '../models/bookModel.js';
import { getBookReadData, addUserReadBook, updateBookReadingProgress, completeBook} from '../models/userBooksModel.js';
import { getTranslations } from '../utils/getTranslations.js';

import { getBookFromOpenLibraryApi } from '../utils/getBookFromOpenLibraryApi.js';
import { getBookGenre } from '../models/genreModel.js';

import { modifyGenreWeights } from '../utils/updateUserPreferences.js';
import { translateBook } from '../utils/translationUtils.js';

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
        res.redirect(req.get('Referer'));
    } catch (err) {
        console.error("Error removing book:", err);
        res.status(500).send("Error removing book");
    }
}

// export async function removeReadBook(req, res) {
//     try {
//         const bookId = req.body.book_id;
//         const translations = getTranslations(req);
//         const userId = req.user.userId;
//         await deleteReadBook(userId, bookId);
//         const deletedBookGenre = await getBookGenre (bookId);
//         await modifyGenreWeights(userId, deletedBookGenre);
//         res.redirect(req.get('Referer'));
//     } catch (err) {
//         console.error("Error removing book:", err);
//         res.status(500).send("Error removing book");
//     }
// }

export async function showReadBookPage (req, res) {
    try {
        const { title } = req.params;
        const userId = req.user.userId;

        const translations = getTranslations(req);

        let book = await getBookByTitle(title);
        let bookReadData = await getBookReadData(userId, book.book_id);
        if(!bookReadData) {
            bookReadData = await addUserReadBook(userId, book.book_id, 0); //add new book to read
        }
        const bookGenre = await getBookGenre(book.book_id);
        // await addReadBook(userId, book.book_id);
        const bookPreviewUrl = await getBookFromOpenLibraryApi(title);

        book.is_liked = await isBookLiked(userId, book.book_id);
        book = translateBook(translations, book);

        req.session.isBooksReadModified = true;
        if (!req.session.userGenres) {
            req.session.userGenres = [];
        }
        
        const genres = bookGenre[0].genre_name_en.split(',').map(genre => genre.trim());
        genres.forEach(genreName => {
            const existingGenre = req.session.userGenres.find(g => g.name === genreName);
        
            if (existingGenre) {
                existingGenre.count += 1;
            } else {
                req.session.userGenres.push({ name: genreName, count: 1 });
            }
        });
        
        res.render('read-book', { translations, book, bookPreviewUrl, pagesRead: bookReadData.pages_read, isCompleted: bookReadData.is_book_completed });
    } catch (err) {
        console.error("Error rendering read book:", err);
        res.status(500).send("Error rendering read book");
    }
}

export async function updateBookPages (req, res) {
    try {
        const { title } = req.params;
        const newPages = req.body.pageCount;
        const userId = req.user.userId;
        const translations = getTranslations(req);

        let book = await getBookByTitle(title);
      
        await updateBookReadingProgress(userId, book.book_id, newPages);
        if (newPages == book.number_of_pages) {
            await completeBook(userId, book.book_id);
        }
        res.redirect(`/${translations.lang}/book/${title}`);
    } catch (err) {
        console.error("Error rendering read book:", err);
        res.status(500).send("Error rendering read book");
    }
}