import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';

// Services
import { ConfirmationService } from 'primeng/api';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { EscalaService, EscalaConfig } from '../../services/escala';

registerLocaleData(localePt);

@Component({
  selector: 'app-painel-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    TabsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ConfirmDialogModule,
    SelectModule,
    TooltipModule,
    AccordionModule,
    DividerModule,
    FieldsetModule,
  ],
  providers: [ConfirmationService, { provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './painel-master.html',
  styleUrls: ['./painel-master.scss'],
})
export class PainelMasterComponent implements OnInit {
  @Output() onFechar = new EventEmitter<void>();
  @Output() onSalvo = new EventEmitter<void>();
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();

  // Configurações
  config: any = {
    festividade: '🎊 Evento Especial',
    valorAlmocoExtra: 30,
    valorJantaExtra: 35,
    valorLancheExtra: 20,
    valorKwh: 1.8,
    totalUhs: 10,
    comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
    altaInicio: '2025-12-15',
    altaFim: '2026-03-15',
    cafeInicio: '07:00',
    cafeFim: '10:00',
    cafeAtivo: true,
    almocoInicio: '12:00',
    almocoFim: '14:00',
    almocoAtivo: true,
    lancheTardeInicio: '15:00',
    lancheTardeFim: '17:00',
    lancheTardeAtivo: true,
    jantarInicio: '19:00',
    jantarFim: '21:00',
    jantarAtivo: true,
    promocaoAtiva: false,
    promocaoDesconto: 15,
    promocaoMinDiarias: 3,
    promocaoTexto: 'Pagamento integral via Pix ou Dinheiro',
    promocaoSomenteAlta: true,
    promocaoMsgBaixa: false,
    orcTitulo: 'Orçamento de Hospedagem',
    orcConfigTitulo: '1. Configuração de Acomodação e Valores',
    orcConfigDescricao:
      'A proposta contempla a estadia com café da manhã incluso, além de estrutura de alimentação completa e horas extras de permanência.',
    orcNotaRefeicoes:
      'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo por integrante da acomodação para o período total da estadia.',
    orcCronograma:
      'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
    orcPagamento:
      'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral}) no ato da reserva para garantia do bloqueio dos quartos.\nSaldo Restante: Deve ser quitado no momento do check-in ou conforme acordado previamente.\nValidade do Orçamento: Válido apenas para as datas especificadas.\nPrazo de Confirmação: A reserva deve ser confirmada e o sinal pago com no mínimo 10 dias de antecedência ao check-in.',
    orcObservacoes:
      'Refeições: O café da manhã é cortesia da casa e já está incluso no valor das diárias.\nAlimentação: Os almoços, lanches da tarde e jantares foram calculados para atender toda a delegação durante o período de permanência.\nValores das refeições: Almoço {valorAlmoco}, Janta {valorJanta}, Lanche {valorLanche} por pessoa.',
    orcRodape: 'Setor de Reservas - Hotel Plaza',
    orcSinalPercentual: 50,
  };

  diasSemana = [
    { nome: 'DOM', valor: 0 },
    { nome: 'SEG', valor: 1 },
    { nome: 'TER', valor: 2 },
    { nome: 'QUA', valor: 3 },
    { nome: 'QUI', valor: 4 },
    { nome: 'SEX', valor: 5 },
    { nome: 'SÁB', valor: 6 },
  ];

  escalaConfig!: EscalaConfig;

  categorias: any[] = [];
  categoriaDialog: boolean = false;
  categoriaEdit: any = {};

  promocoes: any[] = [];
  promocaoDialog: boolean = false;
  promocaoEdit: any = {};

  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  senhaAtualInput: string = '';
  novaSenhaInput: string = '';
  confirmarSenhaInput: string = '';

  constructor(
    private tarifaService: TarifaService,
    private confirmationService: ConfirmationService,
    private criptografia: CriptografiaService,
    private escalaService: EscalaService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.escalaConfig = this.escalaService.getConfiguracao();
  }

  carregarDados() {
    this.config = this.tarifaService.getConfiguracao();
    this.categorias = this.tarifaService.getCategorias();
    this.promocoes = (this.tarifaService as any).getPromocoes?.() || [];
  }

  // ===== CATEGORIAS =====
  adicionarUH() {
    this.abrirDialogCategoria();
  }

  editarUH(categoria: any) {
    this.abrirDialogCategoria(categoria);
  }

  abrirDialogCategoria(categoria?: any) {
    this.categoriaEdit = categoria
      ? { ...categoria }
      : {
          id: '',
          nome: '',
          capacidadeMaxima: 2,
          precoAltaCafe: 0,
          precoAltaSemCafe: 0,
          precoBaixaCafe: 0,
          precoBaixaSemCafe: 0,
          ativo: true,
          descricao: '',
          camasCasal: 1,
          camasSolteiro: 0,
          tipoOcupacaoPadrao: '',
          numeros: [],
          comodidadesSelecionadas: [],
        };
    this.categoriaDialog = true;
  }

  salvarCategoria() {
    if (!this.categoriaEdit.nome) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome da UH é obrigatório',
      });
      return;
    }

    this.categoriaEdit.precoAltaCafe = this.categoriaEdit.precoAltaCafe || 0;
    this.categoriaEdit.precoAltaSemCafe = this.categoriaEdit.precoAltaSemCafe || 0;
    this.categoriaEdit.precoBaixaCafe = this.categoriaEdit.precoBaixaCafe || 0;
    this.categoriaEdit.precoBaixaSemCafe = this.categoriaEdit.precoBaixaSemCafe || 0;
    this.categoriaEdit.camasCasal = this.categoriaEdit.camasCasal ?? 1;
    this.categoriaEdit.camasSolteiro = this.categoriaEdit.camasSolteiro ?? 0;
    this.categoriaEdit.numeros = this.categoriaEdit.numeros || [];
    this.categoriaEdit.comodidadesSelecionadas = this.categoriaEdit.comodidadesSelecionadas || [];

    this.tarifaService.salvarCategoria(this.categoriaEdit);
    this.carregarDados();
    this.categoriaDialog = false;
    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Categoria salva com sucesso',
    });
  }

  excluirUH(categoria: any) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a UH "${categoria.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tarifaService.excluirCategoria(categoria.id);
        this.carregarDados();
        this.onMensagem.emit({
          severity: 'success',
          summary: 'Excluído',
          detail: `UH "${categoria.nome}" removida com sucesso`,
        });
      },
    });
  }

  getListaNumeros(): string[] {
    const total = this.config.totalUhs || 50;
    const numeros: string[] = [];
    for (let i = 1; i <= total; i++) {
      numeros.push(i.toString().padStart(2, '0'));
    }
    return numeros;
  }

  getComodidadesGlobaisArray(): string[] {
    if (!this.config.comodidadesGlobais) return [];
    return this.config.comodidadesGlobais
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item);
  }

  // ===== PROMOÇÕES =====
  abrirDialogPromocao(promocao?: any) {
    this.promocaoEdit = promocao
      ? { ...promocao }
      : {
          id: '',
          nome: '',
          desconto: 0,
          diasMinimos: 1,
          aplicaAlta: true,
          mensagemBaixa: '',
        };
    this.promocaoDialog = true;
  }

  salvarPromocao() {
    this.onMensagem.emit({ severity: 'success', summary: 'Sucesso', detail: 'Promoção salva' });
    this.promocaoDialog = false;
  }

  excluirPromocao(promocao: any) {
    this.onMensagem.emit({ severity: 'info', summary: 'Excluído', detail: 'Promoção removida' });
  }

  onPromocaoSomenteAltaChange() {
    if (!this.config.promocaoSomenteAlta) {
      this.config.promocaoMsgBaixa = false;
    }
  }

  // ===== SEGURANÇA =====
  alterarSenha() {
    if (this.novaSenhaInput !== this.confirmarSenhaInput) {
      this.onMensagem.emit({
        severity: 'error',
        summary: 'Erro',
        detail: 'As senhas não conferem',
      });
      return;
    }

    if (this.novaSenhaInput.length < 3 && this.novaSenhaInput.length > 0) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha deve ter pelo menos 3 caracteres',
      });
      return;
    }

    if (this.config.senhaHash) {
      const senhaAtualCorreta = this.criptografia.verificarSenha(
        this.senhaAtualInput,
        this.config.senhaHash,
      );
      if (!senhaAtualCorreta) {
        this.onMensagem.emit({
          severity: 'error',
          summary: 'Erro',
          detail: 'Senha atual incorreta',
        });
        return;
      }
    }

    if (this.novaSenhaInput) {
      this.config.senhaHash = this.criptografia.hashSenha(this.novaSenhaInput);
    } else {
      this.config.senhaHash = ''; // senha vazia = removida
    }

    this.tarifaService.salvarConfiguracao(this.config);

    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.novaSenhaInput ? 'Senha alterada com sucesso' : 'Senha removida',
    });

    this.senhaAtualInput = '';
    this.novaSenhaInput = '';
    this.confirmarSenhaInput = '';
  }

  removerSenha() {
    if (this.config.senhaHash) {
      this.confirmationService.confirm({
        message: 'Tem certeza que deseja remover a senha de acesso? O painel ficará sem proteção!',
        header: 'Confirmar Remoção',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, Remover',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.config.senhaHash = ''; // em vez de delete
          this.config.senhaSalt = '';
          this.tarifaService.salvarConfiguracao(this.config);
          this.onMensagem.emit({
            severity: 'success',
            summary: 'Senha removida',
            detail: 'Acesso ao painel agora é livre',
          });
        },
      });
    } else {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não há senha configurada',
      });
    }
  }

  // ===== BACKUP =====
  exportarBackup() {
    const backup = this.tarifaService.exportarDados();
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.onMensagem.emit({
      severity: 'success',
      summary: 'Backup exportado',
      detail: 'Arquivo JSON gerado com sucesso',
    });
  }

  importarBackup(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        const resultado = this.tarifaService.importarDados(backup);
        if (resultado.sucesso) {
          this.onMensagem.emit({
            severity: 'success',
            summary: 'Sucesso',
            detail: resultado.mensagem,
          });
          this.carregarDados();
        } else {
          this.onMensagem.emit({ severity: 'error', summary: 'Erro', detail: resultado.mensagem });
        }
      } catch {
        this.onMensagem.emit({ severity: 'error', summary: 'Erro', detail: 'Arquivo inválido' });
      }
    };
    reader.readAsText(file);
  }

  importarBackupAntigo(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string);
        const resultado = this.tarifaService.importarBackupAntigo(dados);
        if (resultado.sucesso) {
          this.onMensagem.emit({
            severity: 'success',
            summary: 'Sucesso',
            detail: resultado.mensagem,
          });
          this.carregarDados();
        } else {
          this.onMensagem.emit({ severity: 'error', summary: 'Erro', detail: resultado.mensagem });
        }
      } catch {
        this.onMensagem.emit({ severity: 'error', summary: 'Erro', detail: 'Arquivo inválido' });
      }
    };
    reader.readAsText(file);
  }

  limparCache() {
    this.confirmationService.confirm({
      message:
        'Tem certeza que deseja limpar todo o cache do sistema? Esta ação irá restaurar todas as configurações para os valores padrão e não pode ser desfeita!',
      header: 'Confirmar Limpeza Total',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Limpar Tudo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tarifaService.limparCache();
        this.carregarDados();
        this.onMensagem.emit({
          severity: 'success',
          summary: 'Cache Limpo',
          detail: 'Todos os dados foram restaurados para as configurações padrão.',
        });
      },
    });
  }

  // ===== AÇÕES GLOBAIS =====
  salvarConfiguracoes() {
    this.tarifaService.salvarConfiguracao(this.config);
    this.escalaService.salvarConfiguracao(this.escalaConfig);
    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configurações salvas com sucesso',
    });
    this.onSalvo.emit();
    this.onFechar.emit();
  }

  fechar() {
    this.onFechar.emit();
  }
}
