/**
 * Interface para provedores de IA de texto (correção, sugestões, enriquecimento)
 */

export interface TextGenerationOptions {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
    stream?: boolean; // Enable streaming response
}

export interface TextGenerationResult {
    text: string;
    stream?: AsyncIterable<string>; // Streaming chunks if stream=true
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
}

export interface SpellCheckOptions {
    text: string;
    language?: string;
}

export interface SpellCheckResult {
    correctedText: string;
    notes: string[];
    confidence: number;
}

export interface SuggestionOptions {
    text: string;
    context?: string;
    style?: 'formal' | 'casual' | 'narrative' | 'dialog';
}

export interface SuggestionResult {
    improvedText: string;
    suggestions: string[];
    summary: string;
}

export interface EnrichmentOptions {
    text?: string;
    characterSummary: string;
}

export interface EnrichmentResult {
    enrichedText: string;
    highlights: string[];
}

export interface TextAIProvider {
    readonly name: string;
    readonly supportedLanguages: string[];

    initialize(): Promise<void>;
    
    generateText(options: TextGenerationOptions): Promise<TextGenerationResult>;
    
    spellCheck(options: SpellCheckOptions): Promise<SpellCheckResult>;
    
    suggestImprovements(options: SuggestionOptions): Promise<SuggestionResult>;
    
    enrichWithDetails(options: EnrichmentOptions): Promise<EnrichmentResult>;
}
