import { PartialType } from '@nestjs/mapped-types';
import { CreateAirportDto } from './createAirport.dto';

export class UpdateAirportDto extends PartialType(CreateAirportDto) {}
