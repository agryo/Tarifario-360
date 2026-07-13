import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { CriptografiaRepository } from './repositories/criptografia-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';

@Injectable({
  providedIn: 'root',
})
export class CriptografiaService {
  private readonly FILE_SECRET_KEY = 'file_secret';
  private readonly BACKUP_SECRET_KEY = 'tarifario360_backup_secret_v2';
  private readonly PBKDF2_ITERATIONS = 600000;
  private readonly KEY_SIZE = 256;

  constructor(
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {}

  private get criptografiaRepo(): CriptografiaRepository {
    return this.repoFactory.getCriptografiaRepo();
  }

  private async getFileSecret(): Promise<string> {
    // Try Supabase first if enabled
    if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
      try {
        const keyData = await this.criptografiaRepo.getKey(this.FILE_SECRET_KEY);
        if (keyData?.chave) return keyData.chave;
      } catch (error) {
        console.warn('Falha ao buscar segredo do Supabase, usando localStorage:', error);
      }
    }
    // Fallback to localStorage
    const stored = localStorage.getItem(this.FILE_SECRET_KEY);
    if (stored) return stored;
    const generated = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem(this.FILE_SECRET_KEY, generated);
    // Also try to sync to Supabase
    await this.syncFileSecretToSupabase(generated);
    return generated;
  }

  private async syncFileSecretToSupabase(secret: string): Promise<void> {
    if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
      try {
        await this.criptografiaRepo.setKey(this.FILE_SECRET_KEY, secret);
      } catch (error) {
        console.warn('Falha ao sincronizar segredo com Supabase:', error);
      }
    }
  }

  /**
   * Segredo fixo para backups (portável entre máquinas).
   * Diferente do segredo de arquivos locais para manter separação de contextos.
   */
  private getBackupSecret(): string {
    // Chave fixa da aplicação para backups - permite portabilidade entre máquinas
    // Em produção, idealmente seria derivada de senha do usuário
    return 'tarifario-360-backup-key-2024-fixed-portable-secret';
  }

  /**
   * Deriva chave de backup a partir de senha do usuário (PBKDF2 nativo).
   * Muito mais seguro que chave fixa no código.
   * @param senha Senha fornecida pelo usuário
   * @param salt Salt opcional (se não fornecido, gera novo)
   * @returns { key, salt } - Chave CryptoKey e salt usado
   */
  async derivarChaveBackup(senha: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(senha),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const saltBuffer = salt || crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer as BufferSource,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-CBC', length: this.KEY_SIZE },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt: saltBuffer };
  }

  /**
   * Criptografa backup usando senha do usuário (mais seguro).
   * @param dados Dados do backup
   * @param senha Senha do usuário
   * @returns String criptografada no formato: salt:iv:ciphertext
   */
  async criptografarBackupComSenha(dados: unknown, senha: string): Promise<string> {
    const jsonStr = JSON.stringify(dados);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const { key, salt } = await this.derivarChaveBackup(senha);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      data
    );

    // Cast para ArrayBuffer para evitar erro de tipo (SharedArrayBuffer vs ArrayBuffer)
    return `${this.bufferToHex(salt.buffer as ArrayBuffer)}:${this.bufferToHex(iv.buffer as ArrayBuffer)}:${this.bufferToHex(encrypted as ArrayBuffer)}`;
  }

  /**
   * Descriptografa backup usando senha do usuário.
   * @param dadosCriptografados String no formato salt:iv:ciphertext
   * @param senha Senha do usuário
   * @returns Objeto descriptografado ou null se falhar
   */
  async descriptografarBackupComSenha(dadosCriptografados: string, senha: string): Promise<unknown> {
    try {
      const parts = dadosCriptografados.split(':');
      if (parts.length !== 3) return null;

      const [saltHex, ivHex, ciphertextHex] = parts;
      const salt = this.hexToBuffer(saltHex);
      const iv = this.hexToBuffer(ivHex);
      const ciphertext = this.hexToBuffer(ciphertextHex);

      const { key } = await this.derivarChaveBackup(senha, new Uint8Array(salt));

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv as ArrayBuffer },
        key,
        ciphertext as ArrayBuffer
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Falha ao descriptografar backup com senha:', error);
      return null;
    }
  }

  /**
   * Deriva chave usando Web Crypto API (assíncrono, não bloqueia UI).
   */
  private async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.hexToBuffer(salt),
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-CBC', length: this.KEY_SIZE },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer.slice(0); // Retorna ArrayBuffer puro
  }

  private bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async cryptoKeyToHex(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', key);
    return this.bufferToHex(raw);
  }

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

  /**
   * Criptografa um objeto qualquer usando Web Crypto API (totalmente assíncrono, não bloqueia UI).
   * Usa PBKDF2 nativo + AES-CBC.
   * @param dados Objeto ou dados a serem criptografados
   * @param usarBackupSecret Se true, usa segredo fixo para backup (portável). Se false, usa segredo local (machine-specific).
   * @returns Promise com string criptografada (formato: salt:iv:ciphertext)
   */
  async criptografarDados(dados: unknown, usarBackupSecret: boolean = false): Promise<string> {
    const jsonStr = JSON.stringify(dados);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);

    // Gera salt e IV aleatórios
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Deriva chave de forma assíncrona (PBKDF2 nativo - não bloqueia)
    const secret = usarBackupSecret ? this.getBackupSecret() : await this.getFileSecret();
    const key = await this.deriveKey(secret, this.bufferToHex(salt.buffer as ArrayBuffer));

    // Criptografa com AES-CBC
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      data
    );

    return `${this.bufferToHex(salt.buffer)}:${this.bufferToHex(iv.buffer)}:${this.bufferToHex(encrypted)}`;
  }

  /**
   * Tenta descriptografar uma string para recuperar o objeto original (assíncrono nativo).
   * @param dadosCriptografados String criptografada no formato salt:iv:ciphertext
   * @param usarBackupSecret Se true, usa segredo fixo para backup (portável). Se false, usa segredo local (machine-specific).
   * @returns Promise com o objeto original ou null se falhar
   */
  async descriptografarDados(dadosCriptografados: string, usarBackupSecret: boolean = false): Promise<unknown> {
    try {
      const parts = dadosCriptografados.split(':');
      if (parts.length !== 3) {
        // Fallback para formato antigo (compatibilidade)
        return this.descriptografarDadosLegacy(dadosCriptografados);
      }

      const [saltHex, ivHex, ciphertextHex] = parts;
      const salt = this.hexToBuffer(saltHex);
      const iv = this.hexToBuffer(ivHex);
      const ciphertext = this.hexToBuffer(ciphertextHex);

      // Deriva chave de forma assíncrona
      const secret = usarBackupSecret ? this.getBackupSecret() : await this.getFileSecret();
      const key = await this.deriveKey(secret, saltHex);

      // Descriptografa com AES-CBC
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv as ArrayBuffer },
        key,
        ciphertext as ArrayBuffer
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Falha ao descriptografar dados:', error);
      return null;
    }
  }

  /**
   * Descriptografa dados no formato legado (apenas FILE_SECRET hardcoded).
   * Usado para migração de backups antigos.
   */
  private async descriptografarDadosLegacy(dadosCriptografados: string): Promise<unknown> {
    try {
      const bytes = CryptoJS.AES.decrypt(dadosCriptografados, await this.getFileSecret());
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch {
      return null;
    }
  }

  /**
   * Migra chaves de criptografia do localStorage para o Supabase
   * Útil para tornar o segredo de arquivo portável entre máquinas
   */
  async migrarChavesParaSupabase(): Promise<void> {
    const secret = localStorage.getItem(this.FILE_SECRET_KEY);
    const backend = this.configFactory.getBackend();
    if (secret && (backend === 'supabase' || backend === 'supabase-direct')) {
      await this.syncFileSecretToSupabase(secret);
    }
  }
}