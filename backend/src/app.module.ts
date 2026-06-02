import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirportsModule } from './airports/airports.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://mongodb:27017/airport_db'), AirportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
