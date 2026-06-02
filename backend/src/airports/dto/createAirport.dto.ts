import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAirportDto {
  @ApiPropertyOptional({ description: 'Nombre del aeropuerto', example: 'Aeropuerto Internacional de Ezeiza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Ciudad del aeropuerto', example: 'Buenos Aires' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: 'Código IATA/FAA del aeropuerto', example: 'EZE' })
  @IsString()
  @IsNotEmpty()
  iata_faa: string;

  @ApiPropertyOptional({ description: 'Código ICAO del aeropuerto', example: 'SABE' })
  @IsString()
  @IsNotEmpty()
  icao: string;

  @ApiPropertyOptional({ description: 'Latitud del aeropuerto', example: -34.8222 })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiPropertyOptional({ description: 'Longitud del aeropuerto', example: -58.5358 })
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @ApiPropertyOptional({ description: 'Altitud del aeropuerto', example: 25 })
  @IsNumber()
  @IsOptional()
  alt?: number;

  @ApiPropertyOptional({ description: 'Zona horaria del aeropuerto', example: 'America/Argentina/Buenos_Aires' })
  @IsString()
  @IsOptional()
  tz?: string;
}
