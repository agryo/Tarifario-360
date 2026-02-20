export interface Comodidade {
  id: string;
  nome: string;
  icone?: string;
  descricao?: string;
  categoria?: 'quarto' | 'lazer' | 'alimentacao' | 'outros';
  ordem?: number;
}

export const COMODIDADES_PADRAO: Comodidade[] = [
  { id: 'wifi', nome: 'Wi-Fi', icone: 'pi pi-wifi', categoria: 'quarto' },
  { id: 'ar', nome: 'Ar-condicionado', icone: 'pi pi-snow', categoria: 'quarto' },
  { id: 'tv', nome: 'TV', icone: 'pi pi-desktop', categoria: 'quarto' },
  { id: 'frigobar', nome: 'Frigobar', icone: 'pi pi-box', categoria: 'quarto' },
  { id: 'piscina', nome: 'Piscina', icone: 'pi pi-sun', categoria: 'lazer' },
  { id: 'cafe', nome: 'Café da manhã', icone: 'pi pi-coffee', categoria: 'alimentacao' },
];
