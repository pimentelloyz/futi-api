import { CreateMyPlayerUploadController } from '../../presentation/controllers/create-my-player-upload-controller.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { FirebasePlayerPhotoService } from '../../infra/storage/firebase-player-photo-service.js';

export function makeCreateMyPlayerController() {
  const repo = new PrismaPlayerRepository();
  const photoService = new FirebasePlayerPhotoService();
  return new CreateMyPlayerUploadController(repo, photoService);
}
