"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const books_routes_1 = __importDefault(require("./routes/books.routes"));
const chapters_routes_1 = __importDefault(require("./routes/chapters.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API');
});
// Routes
app.use('/api/books', books_routes_1.default);
app.use('/api', chapters_routes_1.default);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
