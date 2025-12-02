"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const books_routes_1 = __importDefault(require("./routes/books.routes"));
const chapters_routes_1 = __importDefault(require("./routes/chapters.routes"));
const characters_routes_1 = __importDefault(require("./routes/characters.routes"));
const voices_routes_1 = __importDefault(require("./routes/voices.routes"));
const speeches_routes_1 = __importDefault(require("./routes/speeches.routes"));
const narration_routes_1 = require("./routes/narration.routes");
const websocket_server_1 = require("./websocket/websocket.server");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API');
});
// Routes
app.use('/api/books', books_routes_1.default);
app.use('/api', chapters_routes_1.default);
app.use('/api', characters_routes_1.default);
app.use('/api', voices_routes_1.default);
app.use('/api', speeches_routes_1.default);
app.use('/api', narration_routes_1.narrationRoutes);
// Initialize WebSocket
(0, websocket_server_1.initializeWebSocket)(httpServer);
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
