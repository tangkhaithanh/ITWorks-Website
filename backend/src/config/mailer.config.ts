import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_FROM || '"No Reply" <no-reply@example.com>',
}));
