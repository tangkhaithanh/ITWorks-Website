import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { Public } from '@/common/decorators/public.decorator';
@Controller('locations')
@Public()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('geocode')
  async getCoordinates(@Query('address') address: string) {
    return await this.locationService.geocodeAddress(address);
  }
  // Lấy tất cả các thành phố:
  @Get('cities')
  async getCities() {
    return this.locationService.getCities();
  }

  // Lấy tất cả
  @Get('wards')
  async getWards(@Query('city_id') cityId: string) {
    if (!cityId) return [];
    return this.locationService.getWardsByCity(Number(cityId));
  }
}
