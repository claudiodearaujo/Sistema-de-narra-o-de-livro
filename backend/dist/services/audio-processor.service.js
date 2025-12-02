"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioProcessorService = exports.AudioProcessorService = void 0;
const ffmpeg = require('fluent-ffmpeg');
const path_1 = __importDefault(require("path"));
class AudioProcessorService {
    async concatenateAudios(inputPaths, outputPath) {
        return new Promise((resolve, reject) => {
            if (inputPaths.length === 0) {
                return reject(new Error('No input files provided'));
            }
            const command = ffmpeg();
            inputPaths.forEach(input => {
                command.input(input);
            });
            command
                .on('error', (err) => {
                console.error('An error occurred during concatenation: ' + err.message);
                reject(err);
            })
                .on('end', () => {
                console.log('Concatenation finished successfully');
                resolve(outputPath);
            })
                .mergeToFile(outputPath, path_1.default.dirname(outputPath)); // temp dir for merge
        });
    }
    async normalizeAudio(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11')
                .on('error', (err) => {
                console.error('An error occurred during normalization: ' + err.message);
                reject(err);
            })
                .on('end', () => {
                console.log('Normalization finished successfully');
                resolve(outputPath);
            })
                .save(outputPath);
        });
    }
    async convertToFormat(inputPath, outputPath, format) {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);
            if (format === 'mp3') {
                command = command.audioCodec('libmp3lame').audioBitrate(192);
            }
            else if (format === 'aac') {
                command = command.audioCodec('aac').audioBitrate(128);
            }
            command
                .on('error', (err) => {
                console.error('An error occurred during conversion: ' + err.message);
                reject(err);
            })
                .on('end', () => {
                console.log('Conversion finished successfully');
                resolve(outputPath);
            })
                .save(outputPath);
        });
    }
}
exports.AudioProcessorService = AudioProcessorService;
exports.audioProcessorService = new AudioProcessorService();
