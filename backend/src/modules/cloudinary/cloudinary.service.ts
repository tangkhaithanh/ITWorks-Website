import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  // Upload hình ảnh lên Cloudinary
  async uploadImage(
    file: Express.Multer.File,
    folder = 'recruitment',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'auto' }, // ép logo thành 300x300
            { fetch_format: 'auto', quality: 'auto' }, // Cloudinary tự tối ưu format & chất lượng
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed, no result returned'));
          resolve(result as UploadApiResponse);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  // Upload File tài liệu lên Cloudinary
    async uploadDocument(
  file: Express.Multer.File,
  folder = 'cvs',
): Promise<UploadApiResponse> {
  if (!file) throw new BadRequestException('Không có file nào được tải lên.');

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      'Chỉ hỗ trợ upload file PDF hoặc Word (.doc, .docx)',
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',   // ✅ định dạng file tài liệu
        type: 'upload',         // ✅ bắt buộc để file là PUBLIC raw
        use_filename: true,
        unique_filename: true,// tránh đè file nếu trùng tên
        access_mode: 'public',
        public_id: file.originalname
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error('Upload CV thất bại, không có kết quả.'));
        resolve(result as UploadApiResponse);
      },
    );

    uploadStream.end(file.buffer);
  });
}

  async deleteFile(publicId: string): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse | UploadApiErrorResponse);
      });
    });
  }
}
