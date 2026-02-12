/**
 * Utility functions for transforming data between database and API formats
 */

/**
 * Calculate word count from a text string
 */
export function countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate total word count from an array of speeches
 */
export function calculateWordCountFromSpeeches(speeches: Array<{ text: string }>): number {
    if (!speeches || !Array.isArray(speeches)) return 0;
    
    return speeches.reduce((sum, speech) => {
        return sum + countWords(speech.text);
    }, 0);
}
