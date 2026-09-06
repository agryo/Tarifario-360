import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { ICategoriasRepository } from './repositories/repository-interfaces';
import { RepositoryFactory } from './repository-factory';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';

  constructor(
    private storage: StorageService,
    private repoFactory: RepositoryFactory,
    private configService: ConfigService,
  ) {}

  private get categoriasRepo(): ICategoriasRepository {
    return this.repoFactory.getCategoriasRepo();
  }

  async getCategorias(): Promise<CategoriaQuarto[]> {
    try {
      return await this.categoriasRepo.getAll();
    } catch (error) {
      console.warn('Falha ao buscar categorias do Supabase, usando localStorage:', error);
    }
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

  async getCategoria(id: string): Promise<CategoriaQuarto | null> {
    // Se ID não é UUID válido, não tentar Supabase (evita erro 400)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const categorias = await this.getCategorias();
      return categorias.find((c) => c.id === id) || null;
    }
    try {
      return await this.categoriasRepo.getById(id);
    } catch (error) {
      console.warn('Falha ao buscar categoria do Supabase, usando localStorage:', error);
    }
    const categorias = await this.getCategorias();
    return categorias.find((c) => c.id === id) || null;
  }

  async salvarCategoria(categoria: CategoriaQuarto): Promise<void> {
    // Validar se ID é UUID antes de consultar Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoria.id);
    try {
      if (isUuid) {
        const existing = await this.categoriasRepo.getById(categoria.id);
        if (existing) {
          await this.categoriasRepo.update(categoria.id, categoria);
        } else {
          const { id, ...categoriaSemId } = categoria;
          const created = await this.categoriasRepo.create(categoriaSemId);
          categoria.id = created.id;
        }
      } else {
        // ID não é UUID - criar novo no Supabase
        const { id, ...categoriaSemId } = categoria;
        const created = await this.categoriasRepo.create(categoriaSemId);
        categoria.id = created.id;
      }
    } catch (error) {
      console.warn('Falha ao salvar categoria no Supabase:', error);
    }
    // Fallback to localStorage
    const categorias = await this.getCategorias();
    const index = categorias.findIndex((c) => c.id === categoria.id);
    if (index >= 0) categorias[index] = categoria;
    else {
      categoria.id = this.storage.generateId();
      categorias.push(categoria);
    }
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  async excluirCategoria(id: string): Promise<void> {
    // Validar se ID é UUID antes de tentar excluir no Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    try {
      if (isUuid) {
        await this.categoriasRepo.delete(id);
      }
      // Se não é UUID, não tentar deletar no Supabase (não existe lá)
    } catch (error) {
      console.warn('Falha ao excluir categoria do Supabase:', error);
    }
    const categorias = (await this.getCategorias()).filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // Inicializa categorias padrão se não existirem
  async inicializarCategoriasPadrao(): Promise<void> {
    const categorias = await this.getCategorias();
    if (categorias.length === 0) {
      const categoriasPadrao: CategoriaQuarto[] = [
        {
          id: this.storage.generateId(),
          nome: 'Standard',
          capacidadeMaxima: 2,
          precoAltaCafe: 380,
          precoAltaSemCafe: 350,
          precoBaixaCafe: 280,
          precoBaixaSemCafe: 250,
          ativo: true,
          descricao: 'Quarto confortável',
          camasCasal: 1,
          camasSolteiro: 0,
          tipoOcupacaoPadrao: '',
          numeros: ['01', '02'],
          comodidadesSelecionadas: ['Wi-Fi', 'TV'],
        },
        {
          id: this.storage.generateId(),
          nome: 'Luxo',
          capacidadeMaxima: 3,
          precoAltaCafe: 580,
          precoAltaSemCafe: 550,
          precoBaixaCafe: 430,
          precoBaixaSemCafe: 400,
          ativo: true,
          descricao: 'Quarto com vista para o mar',
          camasCasal: 1,
          camasSolteiro: 1,
          tipoOcupacaoPadrao: '',
          numeros: ['03', '04'],
          comodidadesSelecionadas: ['Wi-Fi', 'TV', 'Frigobar'],
        },
      ];
      for (const cat of categoriasPadrao) {
        await this.salvarCategoria(cat);
      }
    }
  }
}