import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Airport extends Document {

    @Prop()
    name: string;

    @Prop()
    city: string;

    @Prop({ type: String, sparse: true })
    iata_faa: string;

    @Prop({ type: String, sparse: true })
    icao: string;

    @Prop()
    lat: number;

    @Prop()
    lng: number;

    @Prop()
    alt: number;

    @Prop()
    tz: string;
}

export const AirportSchema = SchemaFactory.createForClass(Airport);