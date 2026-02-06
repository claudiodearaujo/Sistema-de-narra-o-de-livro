import { Component, inject } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterModule, MenubarModule, AvatarModule, ButtonModule],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
    private router = inject(Router);

    menuItems: MenuItem[] = [];

    constructor() {
        this.menuItems = [
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                command: () => this.router.navigate(['/'])
            },
            {
                label: 'Livros',
                icon: 'pi pi-book',
                items: [
                    {
                        label: 'Ver Todos',
                        icon: 'pi pi-list',
                        command: () => this.router.navigate(['/books'])
                    },
                    {
                        label: 'Novo Livro',
                        icon: 'pi pi-plus',
                        command: () => this.router.navigate(['/books/new'])
                    }
                ]
            },
            {
                label: 'Personagens',
                icon: 'pi pi-users',
                command: () => this.router.navigate(['/characters'])
            },
            {
                label: 'Vozes',
                icon: 'pi pi-volume-up',
                command: () => this.router.navigate(['/voices'])
            }
        ];
    }
}
