import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AirportsService } from './airports.service';
import { CreateAirportDto } from './dto/createAirport.dto';
import { UpdateAirportDto } from './dto/updateAirport.dto';

@ApiTags('airports')
@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo aeropuerto' })
  @ApiResponse({ status: 201, description: 'Aeropuerto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  createAirport(@Body() data: CreateAirportDto) {
    return this.airportsService.createAirport(data);
  }

  @Put(':code')
  @ApiOperation({ summary: 'Actualizar un aeropuerto por código IATA/ICAO' })
  @ApiParam({ name: 'code', description: 'Código IATA o ICAO del aeropuerto', example: 'EZE' })
  @ApiResponse({ status: 200, description: 'Aeropuerto actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Aeropuerto no encontrado' })
  async updateAirport(@Param('code') code: string, @Body() data: UpdateAirportDto) {
    const updatedAirport = await this.airportsService.updateAirport(code, data);
    if (!updatedAirport) {
      throw new NotFoundException(`No se encontró el aeropuerto con código ${code}`);
    }
    return {
      message: 'Aeropuerto actualizado correctamente',
      airport: updatedAirport,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Obtener los 10 aeropuertos más populares' })
  @ApiResponse({ status: 200, description: 'Lista de aeropuertos populares con detalles' })
  getPopular() {
    return this.airportsService.getPopular();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los aeropuertos con filtros opcionales' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre del aeropuerto' })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por ciudad' })
  @ApiResponse({ status: 200, description: 'Lista de aeropuertos' })
  findAllAirports(@Query('search') search?: string, @Query('city') city?: string) {
    return this.airportsService.findAllAirports(search, city);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener aeropuertos cercanos a una coordenada' })
  @ApiQuery({ name: 'lat', description: 'Latitud', example: -34.8222 })
  @ApiQuery({ name: 'lng', description: 'Longitud', example: -58.5358 })
  @ApiQuery({ name: 'radius', description: 'Radio en kilómetros', example: 50 })
  @ApiResponse({ status: 200, description: 'Aeropuertos dentro del radio especificado' })
  getNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius: string) {
    return this.airportsService.findNearby(Number(lat), Number(lng), Number(radius));
  }

  @Get(':code')
  @ApiOperation({ summary: 'Obtener un aeropuerto por código IATA/ICAO' })
  @ApiParam({ name: 'code', description: 'Código IATA o ICAO del aeropuerto', example: 'EZE' })
  @ApiResponse({ status: 200, description: 'Detalles del aeropuerto' })
  @ApiResponse({ status: 404, description: 'Aeropuerto no encontrado' })
  findOne(@Param('code') code: string) {
    return this.airportsService.findOne(code);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Eliminar un aeropuerto por código IATA/ICAO' })
  @ApiParam({ name: 'code', description: 'Código IATA o ICAO del aeropuerto', example: 'EZE' })
  @ApiResponse({ status: 200, description: 'Aeropuerto eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Aeropuerto no encontrado' })
  deleteAirport(@Param('code') code: string) {
    return this.airportsService.deleteAirport(code);
  }
}
