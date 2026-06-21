import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-progress-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ProgressSpinnerModule, ProgressBarModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{ minWidth: '400px' }"
      [header]="titulo"
    >
      <div class="flex flex-column align-items-center gap-3 p-3">
        <p-progressSpinner *ngIf="!mostrarBarra" [styleClass]="'w-6rem h-6rem'"></p-progressSpinner>
        <p-progressBar *ngIf="mostrarBarra" [value]="progresso" [showValue]="true" styleClass="w-full"></p-progressBar>
        <div class="text-center">
          <p class="m-0">{{ mensagem }}</p>
          <small class="text-color-secondary" *ngIf="detalhe">{{ detalhe }}</small>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-dialog {
      z-index: 9999;
    }
    :host ::ng-deep .p-dialog .p-dialog-header {
      padding: 1rem;
    }
    :host ::ng-deep .p-dialog .p-dialog-content {
      padding: 0 1rem 1rem 1rem;
    }
  `]
})
export class ProgressDialogComponent {
  @Input() visible: boolean = false;
  @Input() titulo: string = 'Processando...';
  @Input() mensagem: string = 'Aguarde...';
  @Input() detalhe: string = '';
  @Input() progresso: number = 0;
  @Input() mostrarBarra: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();

  onVisibleChange(value: boolean) {
    this.visibleChange.emit(value);
  }
}