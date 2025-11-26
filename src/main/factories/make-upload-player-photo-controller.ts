import { UploadPlayerPhotoController } from '../../presentation/controllers/upload-player-photo-controller.js';
import { UploadPlayerPhotoUseCase } from '../../domain/usecases/upload-player-photo/upload-player-photo.usecase.js';
import { FirebasePlayerPhotoService } from '../../infra/storage/firebase-player-photo-service.js';

export function makeUploadPlayerPhotoController(): UploadPlayerPhotoController {
  const photoService = new FirebasePlayerPhotoService();
  const useCase = new UploadPlayerPhotoUseCase(photoService);
  return new UploadPlayerPhotoController(useCase);
}
