import { Routes } from '@angular/router';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BookListComponent } from './features/books/book-list/book-list.component';
import { BookFormComponent } from './features/books/book-form/book-form.component';
import { BookDetailComponent } from './features/books/book-detail/book-detail.component';
import { ChapterDetailComponent } from './features/chapters/chapter-detail/chapter-detail.component';
import { CharacterListComponent } from './features/characters/character-list/character-list.component';
import { VoiceListComponent } from './features/voices/voice-list/voice-list.component';
import { VoiceFormComponent } from './features/voices/voice-form/voice-form.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', component: DashboardComponent },
            { path: 'books', component: BookListComponent },
            { path: 'books/new', component: BookFormComponent },
            { path: 'books/:id', component: BookDetailComponent },
            { path: 'books/:id/edit', component: BookFormComponent },
            { path: 'books/:id/characters', component: CharacterListComponent },
            { path: 'chapters/:id', component: ChapterDetailComponent },
            { path: 'characters', component: CharacterListComponent },
            { path: 'voices', component: VoiceListComponent },
            { path: 'voices/new', component: VoiceFormComponent },
            { path: 'voices/edit/:id', component: VoiceFormComponent }
        ]
    }
];
