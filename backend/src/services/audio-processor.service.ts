const ffmpeg = require('fluent-ffmpeg');
import fs from 'fs';
import path from 'path';

export class AudioProcessorService {

    async concatenateAudios(inputPaths: string[], outputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (inputPaths.length === 0) {
                return reject(new Error('No input files provided'));
            }

            const command = ffmpeg();

            inputPaths.forEach(input => {
                command.input(input);
            });

            command
                .on('error', (err: any) => {
                    console.error('An error occurred during concatenation: ' + err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Concatenation finished successfully');
                    resolve(outputPath);
                })
                .mergeToFile(outputPath, path.dirname(outputPath)); // temp dir for merge
        });
    }

    async normalizeAudio(inputPath: string, outputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11')
                .on('error', (err: any) => {
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

    async convertToFormat(inputPath: string, outputPath: string, format: 'mp3' | 'aac'): Promise<string> {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);

            if (format === 'mp3') {
                command = command.audioCodec('libmp3lame').audioBitrate(192);
            } else if (format === 'aac') {
                command = command.audioCodec('aac').audioBitrate(128);
            }

            command
                .on('error', (err: any) => {
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

export const audioProcessorService = new AudioProcessorService();
