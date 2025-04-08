import { getUserBooks, getSavedBooks } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked, isBookRead } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { translateText, translateObject } from '../utils/translationUtils.js';

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
        }

        for (let genre in booksByGenre) {
            if (Array.isArray(booksByGenre[genre])) {
                for (let book of booksByGenre[genre]) {
                    book.is_liked = await isBookLiked(userId, book.book_id);
                    book.is_read = await isBookRead(userId, book.book_id);
                }
            }
        }

        if (savedBooks.length >= 3) {
            showUpdateButton = true;
        }
            Object.keys(booksByGenre).forEach(genre => {
                booksByGenre[genre] = booksByGenre[genre].map(book => {
                const translatedTitle = translations[book.title_en]?.title || book.title_en;
                const translatedDescription = translations[book.title_en]?.description || book.description_en;
                const translatedAuthor = translations[book.title_en]?.author || book.author_en;
               
                return {
                  title: translatedTitle,
                  author: translatedAuthor,
                  description: translatedDescription,
                  image_url: book.image_url,
                  number_of_pages: book.number_of_pages,
                  year_published: book.year_published,
                  is_liked: book.is_liked,
                  is_read: book.is_read,
                  genre_name: book.genre_name_en.split(",").map(genre => translations.dbGenres[genre] || genre).join(","),
                  language: translations.dbLanguages[book.language_en],
                };
                });
            });
            books = books.map(book => {
                const translatedTitle = translations[book.title_en]?.title || book.title_en;
                const translatedDescription = translations[book.title_en]?.description || book.description_en;
                const translatedAuthor = translations[book.title_en]?.author || book.author_en;
               
                return {
                  title: translatedTitle,
                  author: translatedAuthor,
                  description: translatedDescription,
                  image_url: book.image_url,
                  number_of_pages: book.number_of_pages,
                  year_published: book.year_published,
                  is_liked: book.is_liked,
                  is_read: book.is_read,
                  genre_name: book.genre_name_en.split(",").map(genre => translations.dbGenres[genre] || genre).join(","),
                  language: translations.dbLanguages[book.language_en],
                };
            });
        res.render('homepage', { translations, showUpdateButton, books: books.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    } 
}



