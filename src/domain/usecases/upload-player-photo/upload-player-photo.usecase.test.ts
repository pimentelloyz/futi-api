import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  UploadPlayerPhotoUseCase,
  PlayerNotFoundError,
  UnsupportedMediaTypeError,
} from './upload-player-photo.usecase.js';
import { FirebasePlayerPhotoService } from '../../../infra/storage/firebase-player-photo-service.js';

// Mock do Prisma
vi.mock('../../../infra/prisma/client.js', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('UploadPlayerPhotoUseCase', () => {
  let mockPhotoService: FirebasePlayerPhotoService;
  let useCase: UploadPlayerPhotoUseCase;
  const mockPrisma = vi.hoisted(() => ({
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }));

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock do photo service
    mockPhotoService = {
      validateFile: vi.fn(),
      uploadPlayerPhoto: vi.fn(),
    } as unknown as FirebasePlayerPhotoService;

    useCase = new UploadPlayerPhotoUseCase(mockPhotoService);

    // Re-importar o módulo mockado
    const { prisma } = await import('../../../infra/prisma/client.js');
    Object.assign(prisma.player, mockPrisma.player);
  });

  it('should upload photo successfully', async () => {
    const mockPlayer = { id: 'player-123', name: 'John Doe' };
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    };

    vi.mocked(mockPhotoService.validateFile).mockReturnValue({ valid: true });
    vi.mocked(mockPhotoService.uploadPlayerPhoto).mockResolvedValue({
      url: 'https://storage.firebase.com/player-123.jpg',
      path: 'players/player-123.jpg',
    });
    mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);
    mockPrisma.player.update.mockResolvedValue({ ...mockPlayer, photo: 'https://storage.firebase.com/player-123.jpg' });

    const result = await useCase.execute({
      playerId: 'player-123',
      file: mockFile,
    });

    expect(result.photoUrl).toBe('https://storage.firebase.com/player-123.jpg');
    expect(mockPhotoService.validateFile).toHaveBeenCalledWith(mockFile);
    expect(mockPhotoService.uploadPlayerPhoto).toHaveBeenCalledWith({
      file: mockFile,
      playerId: 'player-123',
      playerName: 'John Doe',
    });
    expect(mockPrisma.player.update).toHaveBeenCalledWith({
      where: { id: 'player-123' },
      data: { photo: 'https://storage.firebase.com/player-123.jpg' },
    });
  });

  it('should throw UnsupportedMediaTypeError when file type is invalid', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-data'),
      mimetype: 'application/pdf',
    };

    vi.mocked(mockPhotoService.validateFile).mockReturnValue({ valid: false });

    await expect(
      useCase.execute({
        playerId: 'player-123',
        file: mockFile,
      }),
    ).rejects.toThrow(UnsupportedMediaTypeError);

    expect(mockPrisma.player.findUnique).not.toHaveBeenCalled();
  });

  it('should throw PlayerNotFoundError when player does not exist', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/png',
    };

    vi.mocked(mockPhotoService.validateFile).mockReturnValue({ valid: true });
    mockPrisma.player.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({
        playerId: 'non-existent-player',
        file: mockFile,
      }),
    ).rejects.toThrow(PlayerNotFoundError);

    expect(mockPhotoService.uploadPlayerPhoto).not.toHaveBeenCalled();
  });

  it('should validate file before checking player existence', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-data'),
      mimetype: 'text/plain',
    };

    vi.mocked(mockPhotoService.validateFile).mockReturnValue({ valid: false });

    await expect(
      useCase.execute({
        playerId: 'player-123',
        file: mockFile,
      }),
    ).rejects.toThrow(UnsupportedMediaTypeError);

    expect(mockPrisma.player.findUnique).not.toHaveBeenCalled();
  });

  it('should use player name in upload', async () => {
    const mockPlayer = { id: 'player-456', name: 'Jane Smith' };
    const mockFile = {
      buffer: Buffer.from('image-data'),
      mimetype: 'image/jpeg',
    };

    vi.mocked(mockPhotoService.validateFile).mockReturnValue({ valid: true });
    vi.mocked(mockPhotoService.uploadPlayerPhoto).mockResolvedValue({
      url: 'https://storage.firebase.com/player-456.jpg',
      path: 'players/player-456.jpg',
    });
    mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);
    mockPrisma.player.update.mockResolvedValue({ ...mockPlayer, photo: 'https://storage.firebase.com/player-456.jpg' });

    await useCase.execute({
      playerId: 'player-456',
      file: mockFile,
    });

    expect(mockPhotoService.uploadPlayerPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: 'Jane Smith',
      }),
    );
  });
});
