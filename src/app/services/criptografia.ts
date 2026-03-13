import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class CriptografiaService {
  constructor() {}

  /**
   * Gera um salt aleatório para ser usado no hash da senha.
   * @returns O salt gerado.
   */
  gerarSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * Gera um hash SHA256 para uma senha usando um salt.
   * @param senha A senha em texto plano.
   * @param salt O salt para usar no hash.
   * @returns O hash da senha.
   */
  hashSenha(senha: string, salt: string): string {
    return CryptoJS.SHA256(salt + senha).toString();
  }

  /**
   * Verifica se uma senha em texto plano corresponde a um hash existente.
   * Lida com hashes antigos (sem salt) para migração.
   * @param senha A senha em texto plano para verificar.
   * @param hash O hash armazenado.
   * @param salt O salt usado para criar o hash (opcional para compatibilidade com versões anteriores).
   * @returns True se a senha corresponder, caso contrário, false.
   */
  verificarSenha(senha: string, hash: string, salt?: string): boolean {
    if (salt) {
      // Novo sistema com salt
      return this.hashSenha(senha, salt) === hash;
    }
    // Sistema antigo sem salt (para migração)
    return CryptoJS.SHA256(senha).toString() === hash;
  }

  /**
   * Gera um hash SHA256 para uma string de dados (para verificação de integridade).
   * @param dados A string para gerar o hash.
   * @returns O hash SHA256 gerado.
   */
  gerarHash(dados: string): string {
    return CryptoJS.SHA256(dados).toString();
  }
}
