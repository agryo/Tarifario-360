export interface ChaveCriptografia {
  nome: string;
  chave: string;
  iv?: string;
  salt?: string;
}