import { PrismaClient, Role, CompanyStatus, EmploymentType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchJobService } from '../src/modules/elasticsearch/job.elasticsearch.service';

const prisma = new PrismaClient();

// ✅ Tạo client ES thật
const es = new Client({ node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200' });
const esJob = new ElasticsearchJobService(es);

// =======================
// Config constants
// =======================
const cities = [
  { city: 'TP.HCM', district: 'Quận 1', ward: 'Phường Đa Kao', lat: 10.7769, lon: 106.7009 },
  { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng Hậu', lat: 21.0285, lon: 105.804 },
  { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang', lat: 16.0471, lon: 108.206 },
];

const jobTemplates = [
  { title: 'Frontend Developer (ReactJS)', category: 'Frontend Developer', skills: ['React', 'JavaScript', 'TypeScript'] },
  { title: 'Backend Developer (Node.js, NestJS)', category: 'Backend Developer', skills: ['Node.js', 'NestJS', 'MySQL'] },
  { title: 'Fullstack Developer', category: 'Fullstack Developer', skills: ['React', 'Node.js', 'MySQL', 'Docker'] },
  { title: 'DevOps Engineer', category: 'DevOps Engineer', skills: ['Docker', 'AWS', 'GCP'] },
  { title: 'Mobile Developer (Flutter)', category: 'Mobile Developer', skills: ['Flutter', 'Kotlin'] },
  { title: 'QA Engineer', category: 'QA Engineer', skills: ['Jest', 'Cypress', 'Git'] },
];

async function main() {
console.log('🚀 Bắt đầu seed dữ liệu...');
await esJob.createIndexIfNotExists();


  // 1️⃣ Clear dữ liệu cũ (theo thứ tự tránh lỗi FK)
await prisma.jobSkill.deleteMany();
await prisma.jobDetail.deleteMany();
await prisma.job.deleteMany();

await prisma.companySkill.deleteMany();
await prisma.companyIndustry.deleteMany();
await prisma.company.deleteMany();

await prisma.candidateSkill?.deleteMany?.().catch(() => {}); // nếu có
await prisma.candidate?.deleteMany?.().catch(() => {});      // nếu có
await prisma.user?.deleteMany?.().catch(() => {});           // nếu có

await prisma.skill.deleteMany();
await prisma.jobCategory.deleteMany();
await prisma.industry.deleteMany();

await prisma.account.deleteMany(); // ⬅️ Xóa Account cuối cùn

  // 2️⃣ Accounts
  const recruiters = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.account.create({
        data: {
          email: `recruiter${i + 1}@example.com`,
          password: 'hashed_password',
          role: Role.recruiter,
        },
      }),
    ),
  );

  await Promise.all(
    Array.from({ length: 6 }).map((_, i) =>
      prisma.account.create({
        data: {
          email: `candidate${i + 1}@example.com`,
          password: 'hashed_password',
          role: Role.candidate,
        },
      }),
    ),
  );

  await prisma.account.create({
    data: { email: 'admin@example.com', password: 'hashed_password', role: Role.admin },
  });

  // 3️⃣ Industries, Skills, Categories
  await prisma.industry.createMany({
    data: [
      { name: 'Software Development' },
      { name: 'Fintech' },
      { name: 'E-commerce' },
      { name: 'Edtech' },
      { name: 'AI & Data' },
    ],
  });

  await prisma.skill.createMany({
  data: [
    { name: 'JavaScript' },
    { name: 'TypeScript' },
    { name: 'React' },
    { name: 'Node.js' },
    { name: 'NestJS' },
    { name: 'MySQL' },
    { name: 'Docker' },
    { name: 'AWS' },
    { name: 'Python' },
    { name: 'Django' },
    { name: 'Java' },
    { name: 'Spring' },
    { name: 'Flutter' },
    { name: 'Kotlin' },
    { name: 'GCP' },
    { name: 'Git' },
    { name: 'Jest' },
    { name: 'Cypress' },
    { name: 'Dart' },
  ],
});

  await prisma.jobCategory.createMany({
    data: [
      { name: 'Frontend Developer' },
      { name: 'Backend Developer' },
      { name: 'Fullstack Developer' },
      { name: 'DevOps Engineer' },
      { name: 'Mobile Developer' },
      { name: 'QA Engineer' },
    ],
  });

  const allSkills = await prisma.skill.findMany();
  const allCategories = await prisma.jobCategory.findMany();
  const allIndustries = await prisma.industry.findMany();

  // 4️⃣ Companies
  const companies = [
    {
      account: recruiters[0],
      name: 'TechVision JSC',
      headquarters: 'TP.HCM',
      industry: allIndustries.find((i) => i.name === 'Software Development')!,
      tech: ['Node.js', 'NestJS', 'React'],
    },
    {
      account: recruiters[1],
      name: 'FinMate Co.',
      headquarters: 'Hà Nội',
      industry: allIndustries.find((i) => i.name === 'Fintech')!,
      tech: ['Java', 'Spring', 'AWS'],
    },
    {
      account: recruiters[2],
      name: 'EduNext Ltd.',
      headquarters: 'Đà Nẵng',
      industry: allIndustries.find((i) => i.name === 'Edtech')!,
      tech: ['Python', 'Django', 'React', 'GCP'],
    },
  ];

  const createdCompanies: any[] = [];
  for (const c of companies) {
    const company = await prisma.company.create({
      data: {
        account_id: c.account.id,
        name: c.name,
        logo_url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg',
        logo_public_id: 'companies/logos/sample',
        website: faker.internet.url(),
        description: faker.company.catchPhrase(),
        headquarters: c.headquarters,
        address: faker.location.streetAddress(),
        size: faker.helpers.arrayElement(['small', 'medium', 'large']),
        status: CompanyStatus.approved,
        contact_email: faker.internet.email(),
        contact_phone: faker.phone.number(),
        industry_info: { create: [{ industry_id: c.industry.id }] },
        skills: {
          create: c.tech.map((t) => ({
            skill_id: allSkills.find((s) => s.name === t)!.id,
          })),
        },
      },
    });
    createdCompanies.push(company);
  }

  // 5️⃣ Jobs
  const jobs: any[] = [];
  for (const company of createdCompanies) {
    for (let i = 0; i < 20; i++) {
      const tmpl = faker.helpers.arrayElement(jobTemplates);
      const city = faker.helpers.arrayElement(cities);

      // 💰 Salary VN (triệu đồng)
      const expLevel = faker.helpers.arrayElement(['fresher', 'junior', 'mid', 'senior', 'lead']);
      const ranges: Record<string, [number, number]> = {
        fresher: [8, 15],
        junior: [15, 25],
        mid: [25, 40],
        senior: [40, 60],
        lead: [60, 90],
      };
      const [min, max] = ranges[expLevel];
      const salary_min = faker.number.float({ min, max: max - 3, multipleOf: 0.1 });
      const salary_max = faker.number.float({ min: salary_min + 1, max, multipleOf: 0.1 });

      const job = await prisma.job.create({
      data: {
        company_id: company.id,
        category_id: allCategories.find((c) => c.name === tmpl.category)!.id,
        title: tmpl.title,
        salary_min,
        salary_max,
        negotiable: faker.datatype.boolean(),
        location_city: city.city,
        location_district: city.district,
        location_ward: city.ward,
        location_street: faker.location.street(),
        location_full: `${city.city}, ${city.district}, ${city.ward}`,
        latitude: city.lat,
        longitude: city.lon,

        // ✅ JSON chuẩn
        work_modes: faker.helpers.arrayElements(['onsite', 'remote', 'hybrid'], 1),
        experience_levels: [expLevel],
        employment_type: faker.helpers.arrayElement(Object.values(EmploymentType)),

        status: 'active',
        deadline: faker.date.soon({ days: faker.number.int({ min: 10, max: 60 }) }),

        details: {
          create: {
            description: faker.helpers.arrayElement([
              'Tham gia phát triển và bảo trì hệ thống web hiện đại.',
              'Xây dựng REST API bằng NestJS và MySQL.',
              'Tối ưu hiệu năng backend, đảm bảo bảo mật dữ liệu.',
            ]),
            requirements: faker.helpers.arrayElement([
              '- Có ít nhất 1 năm kinh nghiệm với JavaScript / TypeScript.\n- Kỹ năng teamwork tốt.\n- Ưu tiên biết Docker hoặc AWS.',
              '- Tốt nghiệp ngành CNTT hoặc liên quan.\n- Có tinh thần học hỏi và trách nhiệm trong công việc.',
            ]),
          },
        },

        skills: {
          create: faker.helpers
            .arrayElements(tmpl.skills, faker.number.int({ min: 2, max: tmpl.skills.length }))
            .map((s) => {
              const skill = allSkills.find((sk) => sk.name === s);
              return skill ? { skill_id: skill.id } : undefined;
            })
            .filter(Boolean),
        },
      } as any,
      include: {
        company: {
          include: {
            industry_info: { include: { industry: true } },
            skills: { include: { skill: true } },
          },
        },
        category: true,
        details: true,
        skills: { include: { skill: true } },
      },
    });
          // ✅ Index vào Elasticsearch
          await esJob.indexJob(job);
          jobs.push(job);
        }
      }

  console.log(`✅ Seed thành công ${jobs.length} job.`);
  console.table(jobs.slice(0, 5).map((j) => ({ id: j.id, title: j.title, city: j.location_city })));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
