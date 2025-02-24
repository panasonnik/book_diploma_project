import express from 'express';
import {getBooks, getBookById, addBook} from './models/bookModel.js';
import {calculateDecisionMatrix} from './utils/decisionMatrix.js';
import authRoutes from './routes/authRoutes.js';
const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.get("/books/top", async (req, res) => {
    const books = await getBooks();
    const rankedBooks = await calculateDecisionMatrix(books);
    const topBooks = rankedBooks.slice(0, 2);
    res.send(topBooks);
});

app.get("/books", async (req, res) => {
    const books = await getBooks();
    res.send(books);
});

app.get("/books/:id", async (req, res) => {
    const id = req.params.id;
    const book = await getBookById(id);
    res.send(book);
});




app.post("/books", async (req, res) => {
    const {title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing} = req.body;
    const newBook = await addBook(title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing);
    res.status(201).send(newBook);
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});