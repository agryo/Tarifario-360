import { Component, OnInit } from '@angular/core';
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
      [title]="isDarkMode ? 'Modo Claro' : 'Modo Escuro'"
    >
      <i [class]="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
    </button>
  `,
  styleUrls: ['./theme-toggle.scss'],
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode = false;

  ngOnInit() {
    // 1. Verifica se já existe preferência salva
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      // Usa a preferência salva
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Se não, detecta a preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = prefersDark;
      // Já salva para que a escolha do sistema seja persistida
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }

    // Aplica o tema
    this.applyTheme(this.isDarkMode);
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme(this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean) {
    if (dark) {
      document.documentElement.classList.add('my-app-dark');
    } else {
      document.documentElement.classList.remove('my-app-dark');
    }
  }
}