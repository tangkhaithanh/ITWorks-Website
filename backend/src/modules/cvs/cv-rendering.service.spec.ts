import { CvRenderingService } from './cv-rendering.service';

describe('CvRenderingService', () => {
  const service = new CvRenderingService();

  it('normalizes template and content to render model', () => {
    const model = service.normalizeModel(
      {
        id: BigInt(1),
        code: 'modern-blue',
        name: 'Modern Blue',
        version: 1,
        layout_schema: { sections: ['personal'] },
        style_tokens: { accent: '#1d4ed8' },
      },
      { personal: { fullName: 'Nguyen Van A' } },
    );

    expect(model.template.code).toBe('modern-blue');
    expect(model.content.personal).toEqual({ fullName: 'Nguyen Van A' });
  });

  it('renders HTML preview with major sections and personal info', () => {
    const model = service.normalizeModel(
      {
        id: BigInt(1),
        code: 'modern-blue',
        name: 'Modern Blue',
        version: 1,
        layout_schema: {},
        style_tokens: {},
      },
      {
        personal: {
          fullName: 'Nguyen Van A',
          email: 'a@example.com',
          phone: '0900000000',
        },
        education: [{ school: 'UIT', degree: 'Engineer' }],
        experience: [{ company: 'ITWorks', role: 'Intern' }],
        skills: ['React', 'NestJS'],
        projects: [{ name: 'CV Builder', description: 'Online CV project' }],
      },
    );

    const html = service.renderHtml(model);
    expect(html).toContain('Nguyen Van A');
    expect(html).toContain('Education');
    expect(html).toContain('Experience');
    expect(html).toContain('Skills');
    expect(html).toContain('Projects');
    expect(html).toContain('a@example.com');
  });
});
