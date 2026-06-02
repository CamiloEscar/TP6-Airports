import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisGeoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisGeoService.name);
  private client: RedisClientType;
  private _connected = false;

  constructor() {
    this.client = createClient({ url: process.env.REDIS_GEO_URL || 'redis://redis-geo:6379' });
    this.client.on('error', (err) => {
      this.logger.error(`Redis GEO error: ${err.message}`);
      this._connected = false;
    });
    this.client.on('connect', () => {
      this.logger.log('Redis GEO conectado');
      this._connected = true;
    });
  }

  get connected() { return this._connected; }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Redis GEO no disponible: ${err.message}`);
      this._connected = false;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async geoAdd(key: string, longitude: number, latitude: number, member: string) {
    if (!this._connected) return;
    try {
      await this.client.geoAdd(key, { longitude, latitude, member });
    } catch (err) {
      this.logger.error(`geoAdd error: ${err.message}`);
    }
  }

  async geoRemove(key: string, member: string) {
    if (!this._connected) return;
    try {
      await this.client.zRem(key, member);
    } catch (err) {
      this.logger.error(`geoRemove error: ${err.message}`);
    }
  }

  async geoSearch(key: string, longitude: number, latitude: number, radius: number): Promise<string[]> {
    if (!this._connected) return [];
    try {
      return await this.client.geoSearch(key, { longitude, latitude }, { radius, unit: 'km' });
    } catch (err) {
      this.logger.error(`geoSearch error: ${err.message}`);
      return [];
    }
  }

  async cardinality(key: string): Promise<number> {
    if (!this._connected) return 0;
    try {
      return await this.client.zCard(key);
    } catch (err) {
      return 0;
    }
  }
}
