import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebasePlayerPhotoService } from './firebase-player-photo-service.js';

describe('FirebasePlayerPhotoService', () => {
  let service: FirebasePlayerPhotoService;

  beforeEach(() => {
    service = new FirebasePlayerPhotoService();
  });

  describe('validateFile', () => {
    it('should accept PNG files', () => {
      const file = { buffer: Buffer.from(''), mimetype: 'image/png' };
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept JPEG files', () => {
      const file = { buffer: Buffer.from(''), mimetype: 'image/jpeg' };
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP files', () => {
      const file = { buffer: Buffer.from(''), mimetype: 'image/webp' };
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = { buffer: Buffer.from(''), mimetype: 'image/gif' };
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('unsupported_media_type');
    });

    it('should reject PDF files', () => {
      const file = { buffer: Buffer.from(''), mimetype: 'application/pdf' };
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('uploadPlayerPhoto', () => {
    it('should throw error for invalid file type', async () => {
      const file = { buffer: Buffer.from('test'), mimetype: 'image/gif' };
      await expect(service.uploadPlayerPhoto({ file })).rejects.toThrow(
        'unsupported_media_type',
      );
    });

    // Note: Tests for actual Firebase upload would require mocking Firebase Admin SDK
    // which is complex. These are covered by E2E tests instead.
  });
});
