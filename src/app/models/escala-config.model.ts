export interface EscalaConfig {
  p1: string;
  p2: string;
  folgas: number[]; // dias da semana (0=domingo, 6=sábado)
  quemFolgaPrimeiro: 'p1' | 'p2';
  dataInicioFolgas: string; // Data de início das folgas (formato ISO)
}