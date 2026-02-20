import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  ngOnInit() {
    // Aplica o tema assim que a aplicação inicia, antes de qualquer componente
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('my-app-dark');
      }
    } else {
      // Se não houver tema salvo, detecta preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('my-app-dark');
      }
      // Não salvamos aqui para não sobrescrever uma futura escolha manual;
      // o ThemeToggleComponent salvará quando o usuário interagir.
    }
  }
}