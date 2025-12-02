const { google } = require('googleapis');
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class GoogleDriveService {
    private drive;
    private rootFolderId: string;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to service account json
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        this.drive = google.drive({ version: 'v3', auth });
        this.rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID || '';
    }

    async uploadFile(filePath: string, fileName: string, mimeType: string, folderId?: string): Promise<any> {
        try {
            const requestBody = {
                name: fileName,
                parents: [folderId || this.rootFolderId],
            };
            const media = {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            };

            const response = await this.drive.files.create({
                requestBody,
                media: media,
                fields: 'id, name, webViewLink, webContentLink',
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading file to Drive:', error);
            throw error;
        }
    }

    async createFolder(folderName: string, parentId?: string): Promise<string> {
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
        } catch (error) {
            console.error('Error creating folder in Drive:', error);
            throw error;
        }
    }

    // Helper to check if folder exists
    async findFolder(folderName: string, parentId?: string): Promise<string | null> {
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
        } catch (error) {
            console.error('Error finding folder in Drive:', error);
            return null;
        }
    }
}

export const googleDriveService = new GoogleDriveService();
