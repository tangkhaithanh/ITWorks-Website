import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocations() {
  const res = await axios.get('https://provinces.open-api.vn/api/v2/?depth=2');

  const cities = res.data as any[];

  for (const city of cities) {
    // 1️⃣ Seed City
    await prisma.locationCity.upsert({
      where: { id: city.code },
      update: { name: city.name },
      create: {
        id: city.code,
        name: city.name,
      },
    });

    // 2️⃣ Seed Ward (nằm trực tiếp trong city)
    for (const ward of city.wards || []) {
      await prisma.locationWard.upsert({
        where: { id: ward.code },
        update: {
          name: ward.name,
          city_id: city.code,
        },
        create: {
          id: ward.code,
          name: ward.name,
          city_id: city.code,
        },
      });
    }
  }

  console.log('✅ Seed tỉnh/thành + phường/xã (API v2)');
}

seedLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
