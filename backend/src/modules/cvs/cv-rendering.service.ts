import { Injectable } from '@nestjs/common';

type CvSections = Record<string, unknown>;

@Injectable()
export class CvRenderingService {
  normalizeModel(template: any, content: CvSections) {
    return {
      template: {
        id: template.id,
        code: template.code,
        name: template.name,
        version: template.version,
        layout_schema: template.layout_schema,
        style_tokens: template.style_tokens ?? {},
      },
      content,
    };
  }

  renderHtml(model: ReturnType<CvRenderingService['normalizeModel']>) {
    const personal = (model.content.personal as Record<string, string>) ?? {};
    const education = (model.content.education as Array<Record<string, string>>) ?? [];
    const experience = (model.content.experience as Array<Record<string, string>>) ?? [];
    const projects = (model.content.projects as Array<Record<string, string>>) ?? [];
    const skills = (model.content.skills as string[]) ?? [];

    const section = (title: string, body: string) =>
      `<section><h2>${title}</h2>${body || '<p>-</p>'}</section>`;

    const asList = (items: string[]) =>
      items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '<p>-</p>';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${personal.fullName || 'Online CV'}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
    h1 { margin: 0; font-size: 24px; }
    h2 { margin: 16px 0 8px; font-size: 16px; color: #334155; }
    p, li { font-size: 14px; line-height: 1.45; margin: 0 0 6px; }
    .sub { color: #64748b; margin-top: 6px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
  </style>
</head>
<body>
  <h1>${personal.fullName || ''}</h1>
  <p class="sub">${[personal.email, personal.phone].filter(Boolean).join(' | ')}</p>
  <hr />
  ${section(
    'Education',
    asList(education.map((e) => `${e.school || ''} - ${e.degree || ''} (${e.startDate || ''} - ${e.endDate || ''})`)),
  )}
  ${section(
    'Experience',
    asList(experience.map((e) => `${e.company || ''} - ${e.role || ''}: ${e.description || ''}`)),
  )}
  ${section('Skills', asList(skills))}
  ${section(
    'Projects',
    asList(projects.map((p) => `${p.name || ''}: ${p.description || ''}`)),
  )}
</body>
</html>`;
  }
}
