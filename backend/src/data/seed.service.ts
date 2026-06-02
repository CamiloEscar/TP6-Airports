import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisGeoService } from '../common/redis-geo.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel('Airport') private readonly airportModel: Model<any>,
    private readonly redisGeo: RedisGeoService,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  async seedData() {
    const mongoCount = await this.airportModel.countDocuments();
    const redisCount = await this.redisGeo.cardinality('airports-geo');

    if (mongoCount > 0 && redisCount > 0) {
      this.logger.log('Datos ya existentes. Saltando carga.');
      return;
    }

    this.logger.log('Iniciando carga de datos...');

    const dataPath = path.join(__dirname, '..', 'data', 'data_trasport.json');
    const airports = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const airport of airports) {
      await new this.airportModel(airport).save();

      const member = airport.iata_faa ?? airport.icao;
      const valid = airport.lng != null && airport.lat != null
        && airport.lng >= -180 && airport.lng <= 180
        && airport.lat > -85.05 && airport.lat < 85.05;

      if (valid && member) {
        await this.redisGeo.geoAdd('airports-geo', airport.lng, airport.lat, member);
      }
    }

    this.logger.log(`Carga completada: ${airports.length} aeropuertos.`);
  }
}
