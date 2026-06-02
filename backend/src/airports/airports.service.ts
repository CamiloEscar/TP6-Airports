import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisGeoService } from '../common/redis-geo.service';
import { RedisPopularityService } from '../common/redis-popularity.service';
import { CreateAirportDto } from './dto/createAirport.dto';
import { UpdateAirportDto } from './dto/updateAirport.dto';

@Injectable()
export class AirportsService {
  private readonly logger = new Logger(AirportsService.name);

  constructor(
    @InjectModel('Airport') private readonly airportModel: Model<any>,
    private readonly redisGeo: RedisGeoService,
    private readonly redisPop: RedisPopularityService,
  ) {}

  async createAirport(data: CreateAirportDto) {
    const saved = await new this.airportModel(data).save();
    const member = saved.iata_faa || saved.icao;
    if (member) {
      await this.redisGeo.geoAdd('airports-geo', saved.lng, saved.lat, member);
    }
    return saved;
  }

  async updateAirport(code: string, data: UpdateAirportDto) {
    const { iata_faa, icao, ...updateData } = data;
    const airport = await this.airportModel
      .findOneAndUpdate(
        { $or: [{ iata_faa: code.toUpperCase() }, { icao: code.toUpperCase() }] },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!airport) return null;

    const newMember = airport.iata_faa || airport.icao;
    await this.redisGeo.geoRemove('airports-geo', code.toUpperCase());
    await this.redisGeo.geoAdd('airports-geo', airport.lng, airport.lat, newMember);

    return airport;
  }

  async findAllAirports(search?: string, city?: string) {
    const query: any = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (city) query.city = { $regex: city, $options: 'i' };
    return this.airportModel.find(query).exec();
  }

  async findOne(code: string) {
    const airport = await this.airportModel
      .findOne({ $or: [{ iata_faa: code.toUpperCase() }, { icao: code.toUpperCase() }] })
      .exec();

    this.logger.log(`Buscando ${code}: ${airport ? 'encontrado' : 'no encontrado'}`);

    if (airport) {
      await this.redisPop.increment(code.toUpperCase());
    }

    return airport;
  }

  async getPopular() {
    const popularity = await this.redisPop.getTop(10);
    if (popularity.length === 0) return [];

    return Promise.all(
      popularity.map(async (item) => {
        const airport = await this.airportModel
          .findOne({ $or: [{ iata_faa: item.value }, { icao: item.value }] })
          .exec();
        return {
          code: item.value,
          score: item.score,
          name: airport?.name || item.value,
          city: airport?.city || '-',
          iata_faa: airport?.iata_faa || '-',
          icao: airport?.icao || '-',
          lat: airport?.lat,
          lng: airport?.lng,
        };
      }),
    );
  }

  async findNearby(lat: number, lng: number, radius: number) {
    const results = await this.redisGeo.geoSearch('airports-geo', lng, lat, radius);
    if (results.length === 0) return [];

    return this.airportModel
      .find({ $or: [{ iata_faa: { $in: results } }, { icao: { $in: results } }] })
      .exec();
  }

  async deleteAirport(code: string) {
    const normalizedCode = code.toUpperCase();
    const airport = await this.airportModel
      .findOneAndDelete({ $or: [{ iata_faa: normalizedCode }, { icao: normalizedCode }] })
      .exec();

    if (airport) {
      const member = airport.iata_faa || airport.icao;
      await this.redisGeo.geoRemove('airports-geo', member);
      await this.redisPop.remove(normalizedCode);
    }

    return { deleted: true, code: normalizedCode };
  }
}
