import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import navigationRoutes from './routes/navigationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import langRoutes from './routes/languageRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import { saveLastPage } from './middleware/saveLastPage.js';
import { authenticateToken } from './middleware/authMiddleware.js';

const app = express();

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true 
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  let currentLang = req.cookies.lang || 'uk';
  res.redirect(`/${currentLang}`);
});

app.use(saveLastPage);

app.use('/:lang', navigationRoutes);
app.use('/:lang/auth', authRoutes);
app.use('/:lang/profile', profileRoutes);
app.use('/:lang/book', bookRoutes);
app.use('/lang', langRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});