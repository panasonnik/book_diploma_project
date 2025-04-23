import { getUserBooks, getSavedBooks } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked } from '../models/bookModel.js';
import { isBookRead, isBookCompleted } from '../models/userBooksModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { translateBook } from '../utils/translationUtils.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        let books = await getUserBooks(userId);
        const savedBooks = await getSavedBooks(userId);
        const booksByGenre = await getBooksByGenre();
        let showUpdateButton = false;
        for (let book of books) {
            book.is_liked = await isBookLiked(userId, book.book_id);
            book.is_read = await isBookRead(userId, book.book_id);
            book.is_completed = await isBookCompleted(userId, book.book_id);
        }

        for (let genre in booksByGenre) {
            if (Array.isArray(booksByGenre[genre])) {
                for (let book of booksByGenre[genre]) {
                    book.is_liked = await isBookLiked(userId, book.book_id);
                    book.is_read = await isBookRead(userId, book.book_id);
                    book.is_completed = await isBookCompleted(userId, book.book_id);
                }
            }
        }
        console.log(savedBooks);
        // if (savedBooks.length >= 3) {
        //     showUpdateButton = true;
        // }
        
        Object.keys(booksByGenre).forEach(genre => {
            booksByGenre[genre] = booksByGenre[genre].map(book => {
                return translateBook(translations, book);
            });
        });
        books = books.map(book => {
            return translateBook(translations, book);
        });

        res.render('homepage', { translations, showUpdateButton, books: books.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    } 
}



