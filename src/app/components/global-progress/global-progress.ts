import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProgressService, ProgressState } from '../../services/progress';
import { ProgressDialogComponent } from '../progress-dialog/progress-dialog';

@Component({
  selector: 'app-global-progress',
  standalone: true,
  imports: [CommonModule, ProgressDialogComponent],
  template: `
    <app-progress-dialog
      [visible]="state.visible"
      [titulo]="state.titulo"
      [mensagem]="state.mensagem"
      [detalhe]="state.detalhe"
      [progresso]="state.progresso"
      [mostrarBarra]="state.mostrarBarra"
      (visibleChange)="onVisibleChange($event)"
    ></app-progress-dialog>
  `,
})
export class GlobalProgressComponent implements OnInit, OnDestroy {
  state: ProgressState = {
    visible: false,
    titulo: 'Processando...',
    mensagem: 'Aguarde...',
    detalhe: '',
    progresso: 0,
    mostrarBarra: false,
  };

  private sub?: Subscription;

  constructor(private progressService: ProgressService) {}

  ngOnInit() {
    this.sub = this.progressService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onVisibleChange(visible: boolean) {
    if (!visible) {
      this.progressService.hide();
    }
  }
}