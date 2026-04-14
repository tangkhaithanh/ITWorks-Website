export const MESSAGE_BODY_MAX_LENGTH = 8000;
export const MESSAGES_PAGE_SIZE = 30;
export const MESSAGE_ATTACHMENTS_MAX_FILES = 5;
export const MESSAGE_ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
