import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

@Injectable()
export class AttachmentsService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.cloudName = this.config.get('CLOUDINARY_CLOUD_NAME') ?? '';
    this.uploadPreset = this.config.get('CLOUDINARY_UPLOAD_PRESET') ?? 'tickets_tic';
    this.apiKey = this.config.get('CLOUDINARY_API_KEY') ?? '';
    this.apiSecret = this.config.get('CLOUDINARY_API_SECRET') ?? '';
  }

  private get cloudinaryConfigured() {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  }

  async upload(ticketId: string, file: Express.Multer.File) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB');
    }

    let url: string;

    if (this.cloudinaryConfigured) {
      url = await this.uploadToCloudinary(file);
    } else {
      // Fallback: store as base64 data URL (dev only)
      const b64 = file.buffer.toString('base64');
      url = `data:${file.mimetype};base64,${b64}`;
    }

    return this.prisma.attachment.create({
      data: {
        nombre: file.originalname,
        url,
        tipo: file.mimetype,
        tamanio: file.size,
        ticketId,
      },
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'tickets-tic');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      { method: 'POST', body: formData },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Cloudinary error: ${err}`);
    }

    const data = (await res.json()) as { secure_url: string };
    return data.secure_url;
  }

  findByTicket(ticketId: string) {
    return this.prisma.attachment.findMany({ where: { ticketId } });
  }
}
