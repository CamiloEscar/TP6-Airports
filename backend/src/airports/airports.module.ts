import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AirportSchema } from 'src/schemas/airport.schema';
import { RedisGeoService } from 'src/common/redis-geo.service';
import { RedisPopularityService } from 'src/common/redis-popularity.service';
import { AirportsService } from './airports.service';
import { AirportsController } from './airports.controller';
import { SeedService } from 'src/data/seed.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Airport', schema: AirportSchema }])],
  controllers: [AirportsController],
  providers: [AirportsService, SeedService, RedisGeoService, RedisPopularityService],
  exports: [MongooseModule],
})
export class AirportsModule {}
