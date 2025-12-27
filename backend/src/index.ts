import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import booksRoutes from './routes/books.routes';
import chaptersRoutes from './routes/chapters.routes';
import charactersRoutes from './routes/characters.routes';
import voicesRoutes from './routes/voices.routes';
import speechesRoutes from './routes/speeches.routes';
import { narrationRoutes } from './routes/narration.routes';
import { audioRoutes } from './routes/audio.routes';
import customVoicesRoutes from './routes/custom-voices.routes';
import { initializeWebSocket } from './websocket/websocket.server';
// Initialize Redis queues (if enabled)
import './queues/narration.queue';
import './queues/narration.processor';
import './queues/audio.queue';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API');
});

// Routes
app.use('/api/books', booksRoutes);
app.use('/api', chaptersRoutes);
app.use('/api', charactersRoutes);
app.use('/api', voicesRoutes);
app.use('/api', speechesRoutes);
app.use('/api', narrationRoutes);
app.use('/api', audioRoutes);
app.use('/api', customVoicesRoutes);

// Initialize WebSocket
initializeWebSocket(httpServer);

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
