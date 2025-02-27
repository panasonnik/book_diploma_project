import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import navigationRoutes from './routes/navigationRoutes.js';
import authRoutes from './routes/authRoutes.js';


const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', navigationRoutes);
app.use('/auth', authRoutes);

// app.get("/books/top", async (req, res) => {
//     const books = await getBooks();
//     const rankedBooks = await calculateDecisionMatrix(books);
//     const topBooks = rankedBooks.slice(0, 2);
//     res.send(topBooks);
// });

// app.get("/books", async (req, res) => {
//     const books = await getBooks();
//     res.send(books);
// });

// app.get("/books/:id", async (req, res) => {
//     const id = req.params.id;
//     const book = await getBookById(id);
//     res.send(book);
// });

// app.post("/books", async (req, res) => {
//     const {title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing} = req.body;
//     const newBook = await addBook(title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing);
//     res.status(201).send(newBook);
// });
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});