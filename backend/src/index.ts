import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import booksRoutes from './routes/books.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API');
});

// Routes
app.use('/api/books', booksRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
