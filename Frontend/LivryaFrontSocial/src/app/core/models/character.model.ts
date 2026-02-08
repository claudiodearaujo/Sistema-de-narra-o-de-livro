import { Voice } from './voice.model';

// ========== Interfaces da Ficha Completa ==========

export interface CharacterIdentity {
    id?: string;
    characterId?: string;
    gender?: string;
    age?: number;
    nationality?: string;
    occupation?: string;
    birthDate?: string;
    birthPlace?: string;
    personality?: string;
    background?: string;
}

export interface CharacterPhysique {
    id?: string;
    characterId?: string;
    height?: string;
    weight?: string;
    bodyType?: string;
    waist?: string;
    posture?: string;
    skinTone?: string;
    skinTexture?: string;
    scars?: string;
    tattoos?: string;
    birthmarks?: string;
}

export interface CharacterFace {
    id?: string;
    characterId?: string;
    faceShape?: string;
    forehead?: string;
    cheekbones?: string;
    chin?: string;
    jaw?: string;
    nose?: string;
    lips?: string;
    expression?: string;
    beard?: string;
    mustache?: string;
    wrinkles?: string;
    dimples?: string;
    freckles?: string;
}

export interface CharacterEyes {
    id?: string;
    characterId?: string;
    eyeSize?: string;
    eyeShape?: string;
    eyeColor?: string;
    eyeSpacing?: string;
    eyelashes?: string;
    eyebrowShape?: string;
    eyebrowColor?: string;
    eyebrowThickness?: string;
    glasses?: string;
    makeup?: string;
}

export interface CharacterHair {
    id?: string;
    characterId?: string;
    haircut?: string;
    hairLength?: string;
    hairColor?: string;
    hairTexture?: string;
    hairVolume?: string;
    hairStyle?: string;
    hairPart?: string;
    hairShine?: string;
    dyedColor?: string;
    highlights?: string;
}

export interface CharacterWardrobe {
    id?: string;
    characterId?: string;
    clothingStyle?: string;
    topwear?: string;
    topwearColor?: string;
    topwearBrand?: string;
    bottomwear?: string;
    bottomwearColor?: string;
    bottomwearBrand?: string;
    dress?: string;
    dressColor?: string;
    dressBrand?: string;
    footwear?: string;
    footwearColor?: string;
    footwearBrand?: string;
    heelHeight?: string;
    earrings?: string;
    necklace?: string;
    rings?: string;
    bracelets?: string;
    watch?: string;
    bag?: string;
    hat?: string;
    scarf?: string;
    nails?: string;
    perfume?: string;
}

// ========== Interface Principal ==========

export interface Character {
    id: string;
    bookId: string;
    name: string;
    voiceId: string;
    voiceDescription?: string;
    previewAudioUrl?: string;
    voice?: Voice;
    createdAt?: string;
    updatedAt?: string;
    
    // Ficha completa
    identity?: CharacterIdentity;
    physique?: CharacterPhysique;
    face?: CharacterFace;
    eyes?: CharacterEyes;
    hair?: CharacterHair;
    wardrobe?: CharacterWardrobe;
    
    // Percentual de preenchimento (calculado pelo backend)
    completionPercentage?: number;
}
