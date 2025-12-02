"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleDriveService = exports.GoogleDriveService = void 0;
const { google } = require('googleapis');
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class GoogleDriveService {
    constructor() {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to service account json
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        this.rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID || '';
    }
    async uploadFile(filePath, fileName, mimeType, folderId) {
        try {
            const requestBody = {
                name: fileName,
                parents: [folderId || this.rootFolderId],
            };
            const media = {
                mimeType: mimeType,
                body: fs_1.default.createReadStream(filePath),
            };
            const response = await this.drive.files.create({
                requestBody,
                media: media,
                fields: 'id, name, webViewLink, webContentLink',
            });
            return response.data;
        }
        catch (error) {
            console.error('Error uploading file to Drive:', error);
            throw error;
        }
    }
    async createFolder(folderName, parentId) {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId || this.rootFolderId],
            };
            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });
            return response.data.id || '';
        }
        catch (error) {
            console.error('Error creating folder in Drive:', error);
            throw error;
        }
    }
    // Helper to check if folder exists
    async findFolder(folderName, parentId) {
        try {
            const parent = parentId || this.rootFolderId;
            const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parent}' in parents and trashed=false`;
            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
            });
            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0].id || null;
            }
            return null;
        }
        catch (error) {
            console.error('Error finding folder in Drive:', error);
            return null;
        }
    }
}
exports.GoogleDriveService = GoogleDriveService;
exports.googleDriveService = new GoogleDriveService();
