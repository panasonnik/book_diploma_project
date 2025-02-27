import { getUserBooks, getSavedBooks } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked } from '../models/bookModel.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
const books = await getUserBooks(userId);
const booksByGenre = await getBooksByGenre();

const checkedBookIds = new Set();

for (let book of books) {
    if (!checkedBookIds.has(book.book_id)) {
        book.is_liked = await isBookLiked(userId, book.book_id);
        checkedBookIds.add(book.book_id);
    }
}

for (let genre in booksByGenre) {
    if (Array.isArray(booksByGenre[genre])) {
        for (let book of booksByGenre[genre]) {
            if (!checkedBookIds.has(book.book_id)) {
                book.is_liked = await isBookLiked(userId, book.book_id);
                checkedBookIds.add(book.book_id);
            }
        }
    }
}

res.render('homepage', { books, booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    }
    
}

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const savedBooks = await getSavedBooks(userId);
        res.render('profile', { savedBooks });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}
