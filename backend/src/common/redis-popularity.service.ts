import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisPopularityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPopularityService.name);
  private client: RedisClientType;
  private _connected = false;

  constructor() {
    this.client = createClient({ url: process.env.REDIS_POP_URL || 'redis://redis-pop:6379' });
    this.client.on('error', (err) => {
      this.logger.error(`Redis POP error: ${err.message}`);
      this._connected = false;
    });
    this.client.on('connect', () => {
      this.logger.log('Redis Popularidad conectado');
      this._connected = true;
    });
  }

  get connected() { return this._connected; }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Redis POP no disponible: ${err.message}`);
      this._connected = false;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async increment(member: string) {
    if (!this._connected) return;
    try {
      await this.client.zIncrBy('airport_popularity', 1, member);
      await this.client.expire('airport_popularity', 86400);
    } catch (err) {
      this.logger.error(`Error al incrementar popularidad: ${err.message}`);
    }
  }

  async getTop(limit: number = 10) {
    if (!this._connected) return [];
    try {
      return await this.client.zRangeWithScores('airport_popularity', 0, limit - 1, { REV: true });
    } catch (err) {
      this.logger.error(`Error al obtener popularidad: ${err.message}`);
      return [];
    }
  }

  async remove(member: string) {
    if (!this._connected) return;
    try {
      await this.client.zRem('airport_popularity', member);
    } catch (err) {
      this.logger.error(`Error al eliminar de popularidad: ${err.message}`);
    }
  }
}
