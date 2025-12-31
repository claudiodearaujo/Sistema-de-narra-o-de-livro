"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const books_routes_1 = __importDefault(require("./routes/books.routes"));
const chapters_routes_1 = __importDefault(require("./routes/chapters.routes"));
const characters_routes_1 = __importDefault(require("./routes/characters.routes"));
const voices_routes_1 = __importDefault(require("./routes/voices.routes"));
const speeches_routes_1 = __importDefault(require("./routes/speeches.routes"));
const narration_routes_1 = require("./routes/narration.routes");
const audio_routes_1 = require("./routes/audio.routes");
const custom_voices_routes_1 = __importDefault(require("./routes/custom-voices.routes"));
const websocket_server_1 = require("./websocket/websocket.server");
// Initialize Redis queues (if enabled)
require("./queues/narration.queue");
require("./queues/narration.processor");
require("./queues/audio.queue");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir arquivos estáticos (áudios gerados)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API - Gemini TTS');
});
// Auth Routes (public and protected)
app.use('/api/auth', auth_routes_1.default);
// Protected Routes (will add middleware to protect these later)
app.use('/api/books', books_routes_1.default);
app.use('/api', chapters_routes_1.default);
app.use('/api', characters_routes_1.default);
app.use('/api', voices_routes_1.default);
app.use('/api', speeches_routes_1.default);
app.use('/api', narration_routes_1.narrationRoutes);
app.use('/api', audio_routes_1.audioRoutes);
app.use('/api', custom_voices_routes_1.default);
// Initialize WebSocket
(0, websocket_server_1.initializeWebSocket)(httpServer);
httpServer.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📁 Arquivos de áudio em: ${path_1.default.join(__dirname, '../uploads')}`);
});
