import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="toggleDarkMode()"
      [attr.aria-label]="isDarkMode ? 'Modo Claro' : 'Modo Escuro'"
      title="{{ isDarkMode ? 'Modo Claro' : 'Modo Escuro' }}"
    >
      <i [class]="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
    </button>
  `,
  styleUrls: ['./theme-toggle.scss'],
})
export class ThemeToggleComponent {
  isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;

    const element = document.documentElement;

    if (this.isDarkMode) {
      element.classList.add('my-app-dark');
    } else {
      element.classList.remove('my-app-dark');
    }
  }
}
