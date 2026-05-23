import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cvTemplates = [
  {
    code: 'classic-professional',
    name: 'Classic Professional',
    version: 1,
    description: 'Clean one-column CV for business, operations, and entry-level roles.',
    preview_url:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1200&auto=format&fit=crop',
    is_active: true,
    layout_schema: {
      page: { size: 'A4', margin: '24mm' },
      layout: 'single-column',
      sections: [
        { key: 'personal', label: 'Personal Information', required: true },
        { key: 'experience', label: 'Experience', required: false },
        { key: 'education', label: 'Education', required: false },
        { key: 'skills', label: 'Skills', required: false },
        { key: 'projects', label: 'Projects', required: false },
      ],
    },
    style_tokens: {
      fontFamily: 'Arial',
      accentColor: '#334155',
      textColor: '#0f172a',
      mutedColor: '#64748b',
      borderColor: '#e2e8f0',
      headingTransform: 'uppercase',
    },
  },
  {
    code: 'modern-blue',
    name: 'Modern Blue',
    version: 1,
    description: 'Modern technology CV with a strong blue accent for developer profiles.',
    preview_url:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
    is_active: true,
    layout_schema: {
      page: { size: 'A4', margin: '22mm' },
      layout: 'single-column',
      sections: [
        { key: 'personal', label: 'Personal Information', required: true },
        { key: 'skills', label: 'Technical Skills', required: false },
        { key: 'experience', label: 'Work Experience', required: false },
        { key: 'projects', label: 'Projects', required: false },
        { key: 'education', label: 'Education', required: false },
      ],
    },
    style_tokens: {
      fontFamily: 'Arial',
      accentColor: '#1d4ed8',
      textColor: '#0f172a',
      mutedColor: '#475569',
      borderColor: '#bfdbfe',
      headingTransform: 'none',
    },
  },
  {
    code: 'minimal-gray',
    name: 'Minimal Gray',
    version: 1,
    description: 'Minimal CV focused on readable content and broad industry fit.',
    preview_url:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    is_active: true,
    layout_schema: {
      page: { size: 'A4', margin: '26mm' },
      layout: 'single-column',
      sections: [
        { key: 'personal', label: 'Personal Information', required: true },
        { key: 'education', label: 'Education', required: false },
        { key: 'experience', label: 'Experience', required: false },
        { key: 'skills', label: 'Skills', required: false },
        { key: 'projects', label: 'Projects', required: false },
      ],
    },
    style_tokens: {
      fontFamily: 'Arial',
      accentColor: '#52525b',
      textColor: '#18181b',
      mutedColor: '#71717a',
      borderColor: '#e4e4e7',
      headingTransform: 'none',
    },
  },
  {
    code: 'startup-compact',
    name: 'Startup Compact',
    version: 1,
    description: 'Compact project-first CV for startup, product, and fullstack candidates.',
    preview_url:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
    is_active: true,
    layout_schema: {
      page: { size: 'A4', margin: '20mm' },
      layout: 'single-column',
      sections: [
        { key: 'personal', label: 'Personal Information', required: true },
        { key: 'projects', label: 'Selected Projects', required: false },
        { key: 'skills', label: 'Core Skills', required: false },
        { key: 'experience', label: 'Experience', required: false },
        { key: 'education', label: 'Education', required: false },
      ],
    },
    style_tokens: {
      fontFamily: 'Arial',
      accentColor: '#059669',
      textColor: '#111827',
      mutedColor: '#6b7280',
      borderColor: '#bbf7d0',
      headingTransform: 'none',
    },
  },
];

async function main() {
  for (const template of cvTemplates) {
    await prisma.cvTemplate.upsert({
      where: { code: template.code },
      update: template,
      create: template,
    });
  }

  console.log(`Seeded ${cvTemplates.length} CV templates.`);
}

main()
  .catch((error) => {
    console.error('Failed to seed CV templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
