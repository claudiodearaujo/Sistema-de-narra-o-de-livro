import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-ssml-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TooltipModule, TextareaModule],
    templateUrl: './ssml-editor.component.html',
    styleUrl: './ssml-editor.component.css'
})
export class SsmEditorComponent {
    @Input() content: string = '';
    @Output() contentChange = new EventEmitter<string>();
    @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

    onContentChange(newValue: string) {
        this.content = newValue;
        this.contentChange.emit(this.content);
    }

    insertTag(tag: string, attribute: string = '') {
        const textarea = this.textarea.nativeElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = this.content.substring(start, end);

        let replacement = '';

        if (tag === 'break') {
            replacement = `<break time="${attribute || '500ms'}"/>`;
        } else {
            const openTag = attribute ? `<${tag} ${attribute}>` : `<${tag}>`;
            const closeTag = `</${tag}>`;
            replacement = `${openTag}${selectedText}${closeTag}`;
        }

        this.content = this.content.substring(0, start) + replacement + this.content.substring(end);
        this.contentChange.emit(this.content);

        // Restore focus and selection (optional, but good UX)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + replacement.length, start + replacement.length);
        }, 0);
    }
}
