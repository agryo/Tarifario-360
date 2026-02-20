import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PRIMENG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TagModule } from 'primeng/tag';

import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { TarifaService } from '../../services/tarifa';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { Temporada } from '../../models/temporada.model';
import { Comodidade } from '../../models/comodidade.model';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    TooltipModule,
    TabsModule,
    ToggleSwitchModule,
    DialogModule,
    SelectModule,
    MultiSelectModule,
    ConfirmPopupModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tarifas.html',
  styleUrls: ['./tarifas.scss'],
})
export class TarifasComponent implements OnInit {
  categorias: CategoriaQuarto[] = [];
  categoriaDialog: boolean = false;
  categoriaEdit: CategoriaQuarto = this.novaCategoria();
  submitted: boolean = false;

  temporadas: Temporada[] = [];
  temporadaDialog: boolean = false;
  temporadaEdit: Temporada = this.novaTemporada();

  comodidades: Comodidade[] = [];
  comodidadeDialog: boolean = false;
  comodidadeEdit: Comodidade = this.novaComodidade();

  config: any = {};

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    this.temporadas = this.tarifaService.getTemporadas();
    this.comodidades = this.tarifaService.getComodidades();
    this.config = this.tarifaService.getConfiguracao();
  }

  // ========== CATEGORIAS ==========
  novaCategoria(): CategoriaQuarto {
    return {
      id: '',
      nome: '',
      descricao: '',
      capacidadeMaxima: 2,
      camaCasal: 1,
      camaSolteiro: 0,
      comodidades: [],
      precoAltaTemporada: 0,
      precoBaixaTemporada: 0,
      ativo: true,
      icone: 'pi pi-building',
    };
  }

  abrirDialogCategoria(categoria?: CategoriaQuarto) {
    this.categoriaEdit = categoria ? { ...categoria } : this.novaCategoria();
    this.categoriaDialog = true;
    this.submitted = false;
  }

  salvarCategoria() {
    this.submitted = true;

    if (!this.categoriaEdit.nome || this.categoriaEdit.precoAltaTemporada <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    this.tarifaService.salvarCategoria(this.categoriaEdit);
    this.carregarDados();
    this.categoriaDialog = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Categoria salva com sucesso',
    });
  }

  excluirCategoria(categoria: CategoriaQuarto) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir "${categoria.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.tarifaService.excluirCategoria(categoria.id);
        this.carregarDados();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Categoria excluída',
        });
      },
    });
  }

  // ========== TEMPORADAS ==========
  novaTemporada(): Temporada {
    return {
      id: '',
      nome: '',
      tipo: 'alta',
      dataInicio: new Date(),
      dataFim: new Date(),
      ativo: true,
    };
  }

  abrirDialogTemporada(temporada?: Temporada) {
    this.temporadaEdit = temporada ? { ...temporada } : this.novaTemporada();
    this.temporadaDialog = true;
  }

  salvarTemporada() {
    if (!this.temporadaEdit.nome) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha o nome da temporada',
      });
      return;
    }

    this.tarifaService.salvarTemporada(this.temporadaEdit);
    this.carregarDados();
    this.temporadaDialog = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Temporada salva',
    });
  }

  // ========== COMODIDADES ==========
  novaComodidade(): Comodidade {
    return {
      id: '',
      nome: '',
      icone: 'pi pi-check',
      categoria: 'quarto',
    };
  }

  abrirDialogComodidade(comodidade?: Comodidade) {
    this.comodidadeEdit = comodidade ? { ...comodidade } : this.novaComodidade();
    this.comodidadeDialog = true;
  }

  salvarComodidade() {
    if (!this.comodidadeEdit.nome) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha o nome da comodidade',
      });
      return;
    }

    this.tarifaService.salvarComodidade(this.comodidadeEdit);
    this.carregarDados();
    this.comodidadeDialog = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Comodidade salva',
    });
  }

  salvarConfig() {
    this.tarifaService.salvarConfiguracao(this.config);
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configurações salvas com sucesso',
    });
  }

  abrirConfig() {
    console.log('Abrir configurações');
  }
}
