"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioWorker = exports.audioQueue = exports.AUDIO_JOB_NAME = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// Configuração do Redis - opcional
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
let audioQueue = null;
exports.audioQueue = audioQueue;
let audioWorker = null;
exports.audioWorker = audioWorker;
exports.AUDIO_JOB_NAME = 'process-audio';
if (REDIS_ENABLED) {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
}
else {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
}
