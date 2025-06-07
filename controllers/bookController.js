import { saveBookPreference, isBookLiked, deleteBookPreference, getBookByTitle, addBook, deleteBookFromDB } from '../models/bookModel.js';
import { getBookReadData, addUserReadBook, updateBookReadingProgress, completeBook, isBookCompleted } from '../models/userBooksModel.js';
import { getTranslations } from '../utils/getTranslations.js';

import { getBookFromOpenLibraryApi } from '../utils/getBookFromOpenLibraryApi.js';
import { getBookGenre, getGenres, addGenre, addBookGenre } from '../models/genreModel.js';

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
        const userId = req.user.userId;
        await deleteBookPreference(userId, bookId);
        res.redirect(req.get('Referer'));
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
        let bookPreviewUrl;
        let book = await getBookByTitle(title);
        let bookReadData = await getBookReadData(userId, book.book_id);
        if(!bookReadData) {
            bookReadData = await addUserReadBook(userId, book.book_id, 0); //add new book to read
        }
        if(translations.lang === 'uk') {
            bookPreviewUrl = await getBookFromOpenLibraryApi(translations[title].title);
        } else {
            bookPreviewUrl = await getBookFromOpenLibraryApi(title);
        }
        

        book.is_liked = await isBookLiked(userId, book.book_id);
        book.is_completed = await isBookCompleted(userId, book.book_id);
        book = translateBook(translations, book);

        req.session.isBooksReadModified = true;
        
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
        const readProgress = newPages/book.number_of_pages;
        await updateBookReadingProgress(userId, book.book_id, newPages, readProgress);
        if (newPages == book.number_of_pages) {
            await completeBook(userId, book.book_id);
            //await addReadBookGenre(userId, book.book_id);
        }
        res.redirect(`/${translations.lang}/book/${title}`);
    } catch (err) {
        console.error("Error rendering read book:", err);
        res.status(500).send("Error rendering read book");
    }
}

export async function addBookPage (req, res) {
    const translations = getTranslations(req);
    const isAdmin = true;
    const genres = await getGenres();
    res.render('add-book', {translations, isAdmin, genres});
}

export async function addGenrePage (req,res) {
    const translations = getTranslations(req);
    const isAdmin = true;
    let genres = await getGenres();
    genres = genres.map(genre => genre.genre_name_en);
    res.render('add-genre', {translations, isAdmin, genres});
}

export async function addBookToDB (req,res) {
     const { title, author, description, genre_id, year, pages, language } = req.body;
     const translations = getTranslations(req);
     console.log('File info:', req.file);
if (!req.file) {
  return res.status(400).send('No file uploaded');
}

    const imageUrl = req.file ? `/images/${req.file.filename}` : null;

  try {
    const bookId = await addBook(title, author, description, imageUrl, pages, language, year);
    await addBookGenre (bookId, genre_id);
    res.redirect(`/${translations.lang}/home`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding book');
  }
}

export async function addGenreToDB (req,res) {
    const { genre } = req.body;
    console.log(genre);
    const translations = getTranslations(req);
  try {
    await addGenre(genre);
    res.redirect(`/${translations.lang}/home`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding genre');
  }
}

export async function deleteBook (req,res) {
    try {
        const bookId = req.body.book_id;
        console.log(req.body.book_id);
        const translations = getTranslations(req);
        
        await deleteBookFromDB(bookId);
      
        res.redirect(`/${translations.lang}/home`);
    } catch (err) {
        console.error("Error deleting book:", err);
        res.status(500).send("Error deleting book");
    }
}