import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProgressState {
  visible: boolean;
  titulo: string;
  mensagem: string;
  detalhe: string;
  progresso: number;
  mostrarBarra: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private state = new BehaviorSubject<ProgressState>({
    visible: false,
    titulo: 'Processando...',
    mensagem: 'Aguarde...',
    detalhe: '',
    progresso: 0,
    mostrarBarra: false,
  });

  state$ = this.state.asObservable();

  show(config: Partial<ProgressState> = {}) {
    this.state.next({
      ...this.state.value,
      ...config,
      visible: true,
    });
  }

  hide() {
    this.state.next({
      ...this.state.value,
      visible: false,
      progresso: 0,
    });
  }

  updateProgress(progresso: number, detalhe?: string) {
    this.state.next({
      ...this.state.value,
      progresso,
      detalhe: detalhe ?? this.state.value.detalhe,
    });
  }

  updateMensagem(mensagem: string, detalhe?: string) {
    this.state.next({
      ...this.state.value,
      mensagem,
      detalhe: detalhe ?? this.state.value.detalhe,
    });
  }
}