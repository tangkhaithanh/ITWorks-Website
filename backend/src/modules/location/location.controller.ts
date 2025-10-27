import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('geocode')
  async getCoordinates(@Query('address') address: string) {
    return await this.locationService.geocodeAddress(address);
  }
}
