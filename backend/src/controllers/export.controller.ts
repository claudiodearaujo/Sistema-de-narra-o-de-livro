import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class ExportController {
    /**
     * GET /api/chapters/:id/export/print
     * Returns a HTML view of the chapter optimized for printing/PDF
     */
    async exportChapterPrint(req: Request, res: Response) {
        try {
            const chapterId = req.params.id as string;
            const chapter = await prisma.chapter.findUnique({
                where: { id: chapterId },
                include: { 
                    speeches: { orderBy: { orderIndex: 'asc' }, include: { character: true } },
                    book: true
                }
            });

            if (!chapter) return res.status(404).send('Capítulo não encontrado');

            // Generate HTML
            let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${chapter.book.title} - ${chapter.title}</title>
                    <style>
                        body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
                        h1 { text-align: center; margin-bottom: 10px; font-size: 2em; }
                        h2 { text-align: center; margin-bottom: 60px; font-size: 1.4em; color: #555; font-weight: normal; }
                        p { margin-bottom: 1em; text-align: justify; }
                        .speech { margin-bottom: 1.2em; }
                        .character-name { font-weight: bold; text-transform: uppercase; font-size: 0.75em; color: #666; margin-bottom: 4px; letter-spacing: 0.05em; }
                        @media print {
                            body { max-width: 100%; padding: 20px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${chapter.book.title}</h1>
                    <h2>${chapter.title}</h2>
                    <div class="content">
            `;

            for (const speech of chapter.speeches) {
                // If it's a narrator or empty character, just render text paragraph
                const isNarrator = speech.characterId === 'narrator' || speech.character.name.toLowerCase() === 'narrador';
                
                if (isNarrator) {
                    html += `<p class="speech">${speech.text}</p>`;
                } else {
                    html += `
                        <div class="speech">
                            <div class="character-name">${speech.character.name}</div>
                            <p>"${speech.text}"</p>
                        </div>
                    `;
                }
            }

            html += `
                    </div>
                    <script>
                        // Auto print after load
                        window.onload = function() { setTimeout(function() { window.print(); }, 500); }
                    </script>
                </body>
                </html>
            `;

            res.send(html);

        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao gerar exportação');
        }
    }
}

export const exportController = new ExportController();
