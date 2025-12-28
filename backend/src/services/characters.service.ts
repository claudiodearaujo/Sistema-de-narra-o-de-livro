import { PrismaClient, Character } from '@prisma/client';

const prisma = new PrismaClient();

// DTOs para as tabelas auxiliares
export interface CharacterIdentityDto {
    gender?: string;
    age?: number;
    nationality?: string;
}

export interface CharacterPhysiqueDto {
    height?: string;
    bodyType?: string;
    waist?: string;
    posture?: string;
}

export interface CharacterFaceDto {
    faceShape?: string;
    forehead?: string;
    cheeks?: string;
    chin?: string;
    nose?: string;
    lips?: string;
    expression?: string;
    skinTone?: string;
}

export interface CharacterEyesDto {
    size?: string;
    shape?: string;
    color?: string;
    eyelashes?: string;
    makeup?: string;
    eyebrows?: string;
}

export interface CharacterHairDto {
    cut?: string;
    length?: string;
    parting?: string;
    texture?: string;
    color?: string;
    finishing?: string;
}

export interface CharacterWardrobeDto {
    dressBrand?: string;
    dressModel?: string;
    dressColor?: string;
    dressFabric?: string;
    dressFit?: string;
    dressLength?: string;
    dressNeckline?: string;
    dressDetails?: string;
    shoeBrand?: string;
    shoeModel?: string;
    shoeColor?: string;
    shoeHeel?: string;
    shoeToe?: string;
    shoeStyle?: string;
    earrings?: string;
    ring?: string;
    necklace?: string;
    bracelet?: string;
    nails?: string;
}

export interface CreateCharacterDto {
    bookId: string;
    name: string;
    voiceId: string;
    voiceDescription?: string;
    previewAudioUrl?: string;
    identity?: CharacterIdentityDto;
    physique?: CharacterPhysiqueDto;
    face?: CharacterFaceDto;
    eyes?: CharacterEyesDto;
    hair?: CharacterHairDto;
    wardrobe?: CharacterWardrobeDto;
}

export interface UpdateCharacterDto {
    name?: string;
    voiceId?: string;
    voiceDescription?: string;
    previewAudioUrl?: string;
    identity?: CharacterIdentityDto;
    physique?: CharacterPhysiqueDto;
    face?: CharacterFaceDto;
    eyes?: CharacterEyesDto;
    hair?: CharacterHairDto;
    wardrobe?: CharacterWardrobeDto;
}

export class CharactersService {
    // Calcula o percentual de preenchimento da ficha do personagem
    private calculateCompletionPercentage(character: any): number {
        let totalFields = 0;
        let filledFields = 0;

        // Campos básicos (6 campos, sendo 3 obrigatórios)
        totalFields += 6;
        if (character.name) filledFields++;
        if (character.voiceId) filledFields++;
        if (character.bookId) filledFields++;
        if (character.voiceDescription) filledFields++;
        if (character.previewAudioUrl) filledFields++;

        // Identidade (3 campos)
        if (character.identity) {
            totalFields += 3;
            if (character.identity.gender) filledFields++;
            if (character.identity.age) filledFields++;
            if (character.identity.nationality) filledFields++;
        }

        // Físico (4 campos)
        if (character.physique) {
            totalFields += 4;
            if (character.physique.height) filledFields++;
            if (character.physique.bodyType) filledFields++;
            if (character.physique.waist) filledFields++;
            if (character.physique.posture) filledFields++;
        }

        // Rosto (8 campos)
        if (character.face) {
            totalFields += 8;
            if (character.face.faceShape) filledFields++;
            if (character.face.forehead) filledFields++;
            if (character.face.cheeks) filledFields++;
            if (character.face.chin) filledFields++;
            if (character.face.nose) filledFields++;
            if (character.face.lips) filledFields++;
            if (character.face.expression) filledFields++;
            if (character.face.skinTone) filledFields++;
        }

        // Olhos (6 campos)
        if (character.eyes) {
            totalFields += 6;
            if (character.eyes.size) filledFields++;
            if (character.eyes.shape) filledFields++;
            if (character.eyes.color) filledFields++;
            if (character.eyes.eyelashes) filledFields++;
            if (character.eyes.makeup) filledFields++;
            if (character.eyes.eyebrows) filledFields++;
        }

        // Cabelo (6 campos)
        if (character.hair) {
            totalFields += 6;
            if (character.hair.cut) filledFields++;
            if (character.hair.length) filledFields++;
            if (character.hair.parting) filledFields++;
            if (character.hair.texture) filledFields++;
            if (character.hair.color) filledFields++;
            if (character.hair.finishing) filledFields++;
        }

        // Vestuário (19 campos)
        if (character.wardrobe) {
            totalFields += 19;
            if (character.wardrobe.dressBrand) filledFields++;
            if (character.wardrobe.dressModel) filledFields++;
            if (character.wardrobe.dressColor) filledFields++;
            if (character.wardrobe.dressFabric) filledFields++;
            if (character.wardrobe.dressFit) filledFields++;
            if (character.wardrobe.dressLength) filledFields++;
            if (character.wardrobe.dressNeckline) filledFields++;
            if (character.wardrobe.dressDetails) filledFields++;
            if (character.wardrobe.shoeBrand) filledFields++;
            if (character.wardrobe.shoeModel) filledFields++;
            if (character.wardrobe.shoeColor) filledFields++;
            if (character.wardrobe.shoeHeel) filledFields++;
            if (character.wardrobe.shoeToe) filledFields++;
            if (character.wardrobe.shoeStyle) filledFields++;
            if (character.wardrobe.earrings) filledFields++;
            if (character.wardrobe.ring) filledFields++;
            if (character.wardrobe.necklace) filledFields++;
            if (character.wardrobe.bracelet) filledFields++;
            if (character.wardrobe.nails) filledFields++;
        }

        return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    }

    async getByBookId(bookId: string) {
        const characters = await prisma.character.findMany({
            where: { bookId },
            orderBy: { name: 'asc' },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });

        // Buscar informações das vozes para cada personagem e calcular percentual
        const charactersWithVoice = await Promise.all(
            characters.map(async (character) => {
                const voice = await prisma.customVoice.findUnique({
                    where: { id: character.voiceId },
                });
                return {
                    ...character,
                    voice: voice || undefined,
                    completionPercentage: this.calculateCompletionPercentage(character),
                };
            })
        );

        return charactersWithVoice;
    }

    async getAll() {
        const characters = await prisma.character.findMany({
            orderBy: { name: 'asc' },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });

        const charactersWithVoice = await Promise.all(
            characters.map(async (character) => {
                const voice = await prisma.customVoice.findUnique({
                    where: { id: character.voiceId },
                });
                return {
                    ...character,
                    voice: voice || undefined,
                    completionPercentage: this.calculateCompletionPercentage(character),
                };
            })
        );

        return charactersWithVoice;
    }

    async getById(id: string) {
        const character = await prisma.character.findUnique({
            where: { id },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });

        if (!character) {
            throw new Error('Character not found');
        }

        return {
            ...character,
            completionPercentage: this.calculateCompletionPercentage(character),
        };
    }

    async create(data: CreateCharacterDto) {
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

        return await prisma.character.create({
            data: {
                bookId: data.bookId,
                name: data.name.trim(),
                voiceId: data.voiceId,
                voiceDescription: data.voiceDescription?.trim(),
                previewAudioUrl: data.previewAudioUrl,
                identity: data.identity ? {
                    create: data.identity,
                } : undefined,
                physique: data.physique ? {
                    create: data.physique,
                } : undefined,
                face: data.face ? {
                    create: data.face,
                } : undefined,
                eyes: data.eyes ? {
                    create: data.eyes,
                } : undefined,
                hair: data.hair ? {
                    create: data.hair,
                } : undefined,
                wardrobe: data.wardrobe ? {
                    create: data.wardrobe,
                } : undefined,
            },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });
    }

    async update(id: string, data: UpdateCharacterDto) {
        const character = await prisma.character.findUnique({ 
            where: { id },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });
        if (!character) {
            throw new Error('Character not found');
        }

        return await prisma.character.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.voiceId && { voiceId: data.voiceId }),
                ...(data.voiceDescription !== undefined && { voiceDescription: data.voiceDescription?.trim() }),
                ...(data.previewAudioUrl !== undefined && { previewAudioUrl: data.previewAudioUrl }),
                identity: data.identity ? {
                    upsert: {
                        create: data.identity,
                        update: data.identity,
                    },
                } : undefined,
                physique: data.physique ? {
                    upsert: {
                        create: data.physique,
                        update: data.physique,
                    },
                } : undefined,
                face: data.face ? {
                    upsert: {
                        create: data.face,
                        update: data.face,
                    },
                } : undefined,
                eyes: data.eyes ? {
                    upsert: {
                        create: data.eyes,
                        update: data.eyes,
                    },
                } : undefined,
                hair: data.hair ? {
                    upsert: {
                        create: data.hair,
                        update: data.hair,
                    },
                } : undefined,
                wardrobe: data.wardrobe ? {
                    upsert: {
                        create: data.wardrobe,
                        update: data.wardrobe,
                    },
                } : undefined,
            },
            include: {
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true,
            },
        });
    }

    async delete(id: string) {
        const character = await prisma.character.findUnique({ where: { id } });
        if (!character) {
            throw new Error('Character not found');
        }

        await prisma.character.delete({ where: { id } });
        return { message: 'Character deleted successfully' };
    }
}

export const charactersService = new CharactersService();
