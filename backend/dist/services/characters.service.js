"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charactersService = exports.CharactersService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Contagem de campos por categoria para cálculo de percentual
const FIELD_COUNTS = {
    identity: 8, // gender, age, nationality, occupation, birthDate, birthPlace, personality, background
    physique: 10, // height, weight, bodyType, waist, posture, skinTone, skinTexture, scars, tattoos, birthmarks
    face: 13, // faceShape, forehead, cheekbones, chin, jaw, nose, lips, expression, beard, mustache, wrinkles, dimples, freckles
    eyes: 10, // eyeSize, eyeShape, eyeColor, eyeSpacing, eyelashes, eyebrowShape, eyebrowColor, eyebrowThickness, glasses, makeup
    hair: 10, // haircut, hairLength, hairColor, hairTexture, hairVolume, hairStyle, hairPart, hairShine, dyedColor, highlights
    wardrobe: 24 // todos os campos de vestuário
};
const TOTAL_FIELDS = Object.values(FIELD_COUNTS).reduce((a, b) => a + b, 0); // 75 campos
function countFilledFields(obj) {
    if (!obj)
        return 0;
    return Object.entries(obj).filter(([key, value]) => {
        // Ignora campos de controle do Prisma
        if (['id', 'characterId'].includes(key))
            return false;
        return value !== null && value !== undefined && value !== '';
    }).length;
}
function calculateCompletionPercentage(character) {
    const identityFilled = countFilledFields(character.identity);
    const physiqueFilled = countFilledFields(character.physique);
    const faceFilled = countFilledFields(character.face);
    const eyesFilled = countFilledFields(character.eyes);
    const hairFilled = countFilledFields(character.hair);
    const wardrobeFilled = countFilledFields(character.wardrobe);
    const totalFilled = identityFilled + physiqueFilled + faceFilled + eyesFilled + hairFilled + wardrobeFilled;
    return Math.round((totalFilled / TOTAL_FIELDS) * 100);
}
class CharactersService {
    constructor() {
        this.includeFullProfile = {
            identity: true,
            physique: true,
            face: true,
            eyes: true,
            hair: true,
            wardrobe: true
        };
    }
    async getByBookId(bookId) {
        const characters = await prisma.character.findMany({
            where: { bookId },
            orderBy: { name: 'asc' },
            include: this.includeFullProfile
        });
        // Buscar informações das vozes e calcular percentual
        const charactersWithVoice = await Promise.all(characters.map(async (character) => {
            const voice = await prisma.customVoice.findUnique({
                where: { id: character.voiceId },
            });
            return {
                ...character,
                voice: voice || undefined,
                completionPercentage: calculateCompletionPercentage(character)
            };
        }));
        return charactersWithVoice;
    }
    async getAll() {
        const characters = await prisma.character.findMany({
            orderBy: { name: 'asc' },
            include: this.includeFullProfile
        });
        const charactersWithVoice = await Promise.all(characters.map(async (character) => {
            const voice = await prisma.customVoice.findUnique({
                where: { id: character.voiceId },
            });
            return {
                ...character,
                voice: voice || undefined,
                completionPercentage: calculateCompletionPercentage(character)
            };
        }));
        return charactersWithVoice;
    }
    async getById(id) {
        const character = await prisma.character.findUnique({
            where: { id },
            include: this.includeFullProfile
        });
        if (!character) {
            throw new Error('Character not found');
        }
        const voice = await prisma.customVoice.findUnique({
            where: { id: character.voiceId },
        });
        return {
            ...character,
            voice: voice || undefined,
            completionPercentage: calculateCompletionPercentage(character)
        };
    }
    async create(data) {
        // Validation
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Name is required');
        }
        if (!data.voiceId) {
            throw new Error('Voice ID is required');
        }
        // Verify book exists
        const book = await prisma.book.findUnique({ where: { id: data.bookId } });
        if (!book) {
            throw new Error('Book not found');
        }
        const character = await prisma.character.create({
            data: {
                bookId: data.bookId,
                name: data.name.trim(),
                voiceId: data.voiceId,
                voiceDescription: data.voiceDescription?.trim(),
                previewAudioUrl: data.previewAudioUrl,
                identity: data.identity ? { create: data.identity } : undefined,
                physique: data.physique ? { create: data.physique } : undefined,
                face: data.face ? { create: data.face } : undefined,
                eyes: data.eyes ? { create: data.eyes } : undefined,
                hair: data.hair ? { create: data.hair } : undefined,
                wardrobe: data.wardrobe ? { create: data.wardrobe } : undefined,
            },
            include: this.includeFullProfile
        });
        return {
            ...character,
            completionPercentage: calculateCompletionPercentage(character)
        };
    }
    async update(id, data) {
        const character = await prisma.character.findUnique({
            where: { id },
            include: this.includeFullProfile
        });
        if (!character) {
            throw new Error('Character not found');
        }
        // Update main character data
        const updatedCharacter = await prisma.character.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.voiceId && { voiceId: data.voiceId }),
                ...(data.voiceDescription !== undefined && { voiceDescription: data.voiceDescription?.trim() }),
                ...(data.previewAudioUrl !== undefined && { previewAudioUrl: data.previewAudioUrl }),
            },
            include: this.includeFullProfile
        });
        // Update or create profile sections
        if (data.identity) {
            if (character.identity) {
                await prisma.characterIdentity.update({
                    where: { characterId: id },
                    data: data.identity
                });
            }
            else {
                await prisma.characterIdentity.create({
                    data: { ...data.identity, characterId: id }
                });
            }
        }
        if (data.physique) {
            if (character.physique) {
                await prisma.characterPhysique.update({
                    where: { characterId: id },
                    data: data.physique
                });
            }
            else {
                await prisma.characterPhysique.create({
                    data: { ...data.physique, characterId: id }
                });
            }
        }
        if (data.face) {
            if (character.face) {
                await prisma.characterFace.update({
                    where: { characterId: id },
                    data: data.face
                });
            }
            else {
                await prisma.characterFace.create({
                    data: { ...data.face, characterId: id }
                });
            }
        }
        if (data.eyes) {
            if (character.eyes) {
                await prisma.characterEyes.update({
                    where: { characterId: id },
                    data: data.eyes
                });
            }
            else {
                await prisma.characterEyes.create({
                    data: { ...data.eyes, characterId: id }
                });
            }
        }
        if (data.hair) {
            if (character.hair) {
                await prisma.characterHair.update({
                    where: { characterId: id },
                    data: data.hair
                });
            }
            else {
                await prisma.characterHair.create({
                    data: { ...data.hair, characterId: id }
                });
            }
        }
        if (data.wardrobe) {
            if (character.wardrobe) {
                await prisma.characterWardrobe.update({
                    where: { characterId: id },
                    data: data.wardrobe
                });
            }
            else {
                await prisma.characterWardrobe.create({
                    data: { ...data.wardrobe, characterId: id }
                });
            }
        }
        // Fetch updated character with all relations
        const finalCharacter = await prisma.character.findUnique({
            where: { id },
            include: this.includeFullProfile
        });
        return {
            ...finalCharacter,
            completionPercentage: calculateCompletionPercentage(finalCharacter)
        };
    }
    async delete(id) {
        const character = await prisma.character.findUnique({ where: { id } });
        if (!character) {
            throw new Error('Character not found');
        }
        await prisma.character.delete({ where: { id } });
        return { message: 'Character deleted successfully' };
    }
}
exports.CharactersService = CharactersService;
exports.charactersService = new CharactersService();
