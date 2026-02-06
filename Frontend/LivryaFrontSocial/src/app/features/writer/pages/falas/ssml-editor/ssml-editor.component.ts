import { Component, ElementRef, input, output, viewChild, model } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-ssml-editor',
    standalone: true,
    imports: [FormsModule, ButtonModule, TooltipModule, TextareaModule],
    templateUrl: './ssml-editor.component.html',
    styleUrl: './ssml-editor.component.css'
})
export class SsmEditorComponent {
    content = model<string>('');
    readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');

    onContentChange(newValue: string) {
        this.content.set(newValue);
    }

    insertTag(tag: string, attribute: string = '') {
        const textarea = this.textarea().nativeElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = this.content().substring(start, end);

        let replacement = '';

        const attrString = attribute?.trim();

        if (tag === 'break') {
            const effectiveAttr = attrString || 'time="500ms"';
            replacement = `<break ${effectiveAttr}/>`;
        } else {
            const openTag = attrString ? `<${tag} ${attrString}>` : `<${tag}>`;
            const closeTag = `</${tag}>`;
            replacement = `${openTag}${selectedText}${closeTag}`;
        }

        this.content.set(this.content().substring(0, start) + replacement + this.content().substring(end));

        // Restore focus and selection (optional, but good UX)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + replacement.length, start + replacement.length);
        }, 0);
    }
}
