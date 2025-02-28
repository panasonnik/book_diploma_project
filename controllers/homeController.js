import { getUserBooks, getSavedBooks } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked, getBookWithGenre } from '../models/bookModel.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const bestBooks = await getUserBooks(userId);
        const booksByGenre = await getBooksByGenre();
        for (let book of bestBooks) {
            book.is_liked = await isBookLiked(userId, book.book_id);
        }
        
        for (let genre in booksByGenre) {
            if (Array.isArray(booksByGenre[genre])) {
                for (let book of booksByGenre[genre]) {
                    book.is_liked = await isBookLiked(userId, book.book_id);
                }
            }
        }
        

        res.render('homepage', { books: bestBooks.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    }
    
}

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const savedBooks = await getSavedBooks(userId);
        const savedBooksWithGenre = await getBookWithGenre(savedBooks.book_id);
        res.render('profile', { savedBooks });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}
