import { FirebasePlayerPhotoService } from '../../../infra/storage/firebase-player-photo-service.js';
import { prisma } from '../../../infra/prisma/client.js';
import { UploadPlayerPhotoInput, UploadPlayerPhotoOutput } from './upload-player-photo.dto.js';

export class PlayerNotFoundError extends Error {
  constructor(playerId: string) {
    super(`Player with id ${playerId} not found`);
    this.name = 'PlayerNotFoundError';
  }
}

export class UnsupportedMediaTypeError extends Error {
  constructor(mimetype: string) {
    super(`Unsupported media type: ${mimetype}`);
    this.name = 'UnsupportedMediaTypeError';
  }
}

export class UploadPlayerPhotoUseCase {
  private photoService: FirebasePlayerPhotoService;

  constructor(photoService?: FirebasePlayerPhotoService) {
    this.photoService = photoService || new FirebasePlayerPhotoService();
  }

  async execute(input: UploadPlayerPhotoInput): Promise<UploadPlayerPhotoOutput> {
    // Validate file type
    const validation = this.photoService.validateFile({
      buffer: input.file.buffer,
      mimetype: input.file.mimetype,
    });

    if (!validation.valid) {
      throw new UnsupportedMediaTypeError(input.file.mimetype);
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: input.playerId },
      select: { id: true, name: true },
    });

    if (!player) {
      throw new PlayerNotFoundError(input.playerId);
    }

    // Upload photo to Firebase
    const uploadResult = await this.photoService.uploadPlayerPhoto({
      file: input.file,
      playerId: input.playerId,
      playerName: player.name,
    });

    // Update player record with photo URL
    await prisma.player.update({
      where: { id: input.playerId },
      data: { photo: uploadResult.url },
    });

    return {
      photoUrl: uploadResult.url,
    };
  }
}
