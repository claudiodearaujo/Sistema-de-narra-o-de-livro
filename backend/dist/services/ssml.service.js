"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssmlService = exports.SSMLService = void 0;
class SSMLService {
    validate(ssml) {
        const errors = [];
        // Basic XML structure check
        if (!ssml.startsWith('<speak>') || !ssml.endsWith('</speak>')) {
            errors.push('SSML must be wrapped in <speak> tags.');
        }
        // Check for unclosed tags (simple regex check, not a full XML parser for now)
        const tags = ['break', 'emphasis', 'prosody', 'say-as', 'sub'];
        tags.forEach(tag => {
            const openCount = (ssml.match(new RegExp(`<${tag}`, 'g')) || []).length;
            const closeCount = (ssml.match(new RegExp(`</${tag}>`, 'g')) || []).length;
            // Self-closing tags like <break/> don't need a closing tag
            if (tag === 'break') {
                // Break can be self-closing <break/> or <break></break>
                // This simple check might be insufficient but good for a start
                return;
            }
            if (openCount !== closeCount) {
                errors.push(`Mismatched tags for <${tag}>.`);
            }
        });
        // Check for supported attributes (basic check)
        // Gemini TTS supports specific SSML tags.
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.SSMLService = SSMLService;
exports.ssmlService = new SSMLService();
