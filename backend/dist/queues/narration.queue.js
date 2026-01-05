"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NARRATION_JOB_NAME = exports.narrationQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_config_1 = require("../config/redis.config");
dotenv_1.default.config();
let connection = null;
let narrationQueue = null;
exports.narrationQueue = narrationQueue;
if ((0, redis_config_1.isRedisEnabled)()) {
    try {
        connection = new ioredis_1.default((0, redis_config_1.getRedisConfig)());
        connection.on('ready', () => {
            console.log('✅ Redis connected (Narration Queue)');
        });
        connection.on('error', (err) => {
            console.warn('⚠️  Redis error (Narration):', err.message);
        });
        connection.on('close', () => {
            console.warn('⚠️  Redis connection closed (Narration)');
        });
        exports.narrationQueue = narrationQueue = new bullmq_1.Queue('narration', { connection });
        console.log('✅ Narration Queue initialized');
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize Narration Queue:', error);
    }
}
else {
    console.log('ℹ️  Redis desabilitado - Narration Queue não inicializada');
}
exports.NARRATION_JOB_NAME = 'generate-narration';
