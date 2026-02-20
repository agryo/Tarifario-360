import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class CriptografiaService {
  // Chave secreta para criptografia (em produção, viria de variável de ambiente)
  private readonly SECRET_KEY = 'Tarifario360-Secret-Key-2026';

  constructor() {}

  /**
   * Gera um hash SHA256 da senha (não reversível, para armazenamento)
   */
  hashSenha(senha: string): string {
    return CryptoJS.SHA256(senha).toString();
  }

  /**
   * Verifica se a senha corresponde ao hash armazenado
   */
  verificarSenha(senha: string, hash: string): boolean {
    const hashCalculado = this.hashSenha(senha);
    return hashCalculado === hash;
  }

  /**
   * Criptografa um texto (para dados sensíveis que precisam ser recuperados)
   */
  criptografar(texto: string): string {
    return CryptoJS.AES.encrypt(texto, this.SECRET_KEY).toString();
  }

  /**
   * Descriptografa um texto
   */
  descriptografar(textoCriptografado: string): string {
    const bytes = CryptoJS.AES.decrypt(textoCriptografado, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Gera um salt aleatório
   */
  gerarSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  /**
   * Hash com salt (mais seguro)
   */
  hashComSalt(senha: string, salt: string): string {
    return CryptoJS.SHA256(senha + salt).toString();
  }
}
