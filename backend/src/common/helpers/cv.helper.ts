import { CvType } from '@prisma/client';
export class CvHelper {
  static format(cv: any) {
    if (!cv) return null;

    // ====== CV FILE ======
    if (cv.type === CvType.FILE) {
      return {
        type: 'file',
        id: cv.id,
        title: cv.title,
        file_url: cv.file_url,
        file_public_id: cv.file_public_id, // 🔥 thêm dòng này
        created_at: cv.created_at,
        updated_at: cv.updated_at,
      };
    }

    // ====== CV ONLINE ======
    if (cv.type === CvType.ONLINE) {
      return {
        type: 'online',
        id: cv.id,
        title: cv.title,
        template_id: cv.template_id,
        template: cv.template
          ? {
              id: cv.template.id,
              name: cv.template.name,
              preview_url: cv.template.preview_url,
            }
          : null,
        content: cv.content,
        created_at: cv.created_at,
        updated_at: cv.updated_at,
      };
    }

    // ====== Trường hợp UNKNOWN ======
    return {
      type: 'UNKNOWN',
      id: cv.id,
      title: cv.title,
    };
  }
}
