import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { BadRequestError } from '../errors/http-errors.js';
import {
  UploadPlayerPhotoUseCase,
  PlayerNotFoundError,
  UnsupportedMediaTypeError,
} from '../../domain/usecases/upload-player-photo/upload-player-photo.usecase.js';
import { ERROR_CODES } from '../../domain/constants.js';

export interface UploadPlayerPhotoRequest extends HttpRequest {
  params?: { id?: string };
  file?: {
    buffer: Buffer;
    mimetype: string;
  };
}

export class UploadPlayerPhotoController implements Controller {
  private useCase: UploadPlayerPhotoUseCase;

  constructor(useCase?: UploadPlayerPhotoUseCase) {
    this.useCase = useCase || new UploadPlayerPhotoUseCase();
  }

  async handle(request: UploadPlayerPhotoRequest): Promise<HttpResponse> {
    try {
      const playerId = request.params?.id;
      if (!playerId) {
        throw new BadRequestError(ERROR_CODES.INVALID_PLAYER_ID);
      }

      const file = request.file;
      if (!file) {
        throw new BadRequestError(ERROR_CODES.INVALID_MULTIPART);
      }

      const result = await this.useCase.execute({
        playerId,
        file: {
          buffer: file.buffer,
          mimetype: file.mimetype,
        },
      });

      return {
        statusCode: 200,
        body: { photoUrl: result.photoUrl },
      };
    } catch (err) {
      if (err instanceof BadRequestError) {
        return { statusCode: err.statusCode, body: { error: err.code } };
      }

      if (err instanceof UnsupportedMediaTypeError) {
        return { statusCode: 415, body: { error: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE } };
      }

      if (err instanceof PlayerNotFoundError) {
        return { statusCode: 404, body: { error: ERROR_CODES.PLAYER_NOT_FOUND } };
      }

      // Firebase configuration errors
      const message = (err as Error).message || '';
      if (message.includes('Environment validation failed') || message.includes('firebase')) {
        return { statusCode: 500, body: { error: ERROR_CODES.FIREBASE_CONFIG_ERROR } };
      }

      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}
