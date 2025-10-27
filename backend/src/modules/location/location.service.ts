import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GeocodeResponse {
  status: string;
  results: {
    geometry: {
      location: { lat: number; lng: number };
    };
  }[];
}

@Injectable()
export class LocationService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  async geocodeAddress(address: string) {
    try {
      if (!address) return { latitude: null, longitude: null };

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${this.apiKey}`;

      const { data } = await axios.get<GeocodeResponse>(url);

      if (data.status !== 'OK' || !data.results.length) {
        throw new Error('Không tìm thấy tọa độ cho địa chỉ này');
      }

      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } catch (error: any) {
      Logger.error('🔥 Lỗi geocoding:', error.message);
      throw new InternalServerErrorException('Không thể lấy tọa độ địa chỉ');
    }
  }
}
