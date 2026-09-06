import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { IEscalaRepository } from './repository-interfaces';
import { EscalaConfig } from '../../models/escala-config.model';

@Injectable({ providedIn: 'root' })
export class EscalaRepository implements IEscalaRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  async get(): Promise<EscalaConfig | null> {
    return this.strategy.getEscala();
  }

  async update(config: Partial<EscalaConfig>): Promise<EscalaConfig> {
    return this.strategy.updateEscala(config);
  }
}