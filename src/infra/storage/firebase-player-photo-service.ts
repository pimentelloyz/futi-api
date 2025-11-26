import path from 'node:path';

/**
 * Serviço para upload de fotos de jogadores no Firebase Storage
 */
export interface FileUpload {
  buffer: Buffer;
  mimetype: string;
}

export interface UploadPlayerPhotoInput {
  file: FileUpload;
  playerName?: string;
  playerId?: string;
}

export interface UploadPlayerPhotoOutput {
  url: string;
  path: string;
}

export class FirebasePlayerPhotoService {
  private readonly allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  private getFileExtension(mimetype: string): string {
    if (mimetype === 'image/png') return 'png';
    if (mimetype === 'image/webp') return 'webp';
    return 'jpg';
  }

  private sanitizeName(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '')
        .substring(0, 50) || 'player'
    );
  }

  /**
   * Valida se o arquivo é uma imagem permitida
   */
  validateFile(file: FileUpload): { valid: boolean; error?: string } {
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      return { valid: false, error: 'unsupported_media_type' };
    }
    return { valid: true };
  }

  /**
   * Faz upload de foto de jogador no Firebase Storage
   * Se playerId for fornecido, usa nome determinístico (sobrescreve arquivo anterior)
   * Se não, usa timestamp para criar novo arquivo
   */
  async uploadPlayerPhoto(input: UploadPlayerPhotoInput): Promise<UploadPlayerPhotoOutput> {
    const validation = this.validateFile(input.file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const ext = this.getFileExtension(input.file.mimetype);
    const { getDefaultBucket } = await import('../firebase/admin.js');
    const bucket = getDefaultBucket();

    let objectPath: string;
    let folderPrefix: string | undefined;

    if (input.playerId) {
      // Upload para player existente: usa ID como nome (sobrescreve)
      objectPath = path.posix.join('players', input.playerId, `${input.playerId}.${ext}`);
      folderPrefix = path.posix.join('players', input.playerId, '/');
    } else {
      // Upload para novo player: usa nome + timestamp
      const safeName = this.sanitizeName(input.playerName ?? 'player');
      const timestamp = Date.now();
      objectPath = path.posix.join('players', 'new', `${safeName}_${timestamp}.${ext}`);
    }

    // Remove arquivos anteriores se for update de player existente
    if (folderPrefix) {
      try {
        const [existingFiles] = await bucket.getFiles({ prefix: folderPrefix });
        if (existingFiles && existingFiles.length > 0) {
          await Promise.allSettled(existingFiles.map((f) => f.delete()));
        }
      } catch (error) {
        // Ignora erros ao deletar arquivos antigos
        console.warn('[FirebasePlayerPhotoService] Error deleting old files:', error);
      }
    }

    // Upload do novo arquivo
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(input.file.buffer, {
      contentType: input.file.mimetype,
      resumable: false,
      metadata: {
        cacheControl: input.playerId ? 'no-cache, max-age=0' : 'public,max-age=3600',
      },
    });

    // Torna arquivo público
    try {
      await gcsFile.makePublic();
    } catch (error) {
      // Ignora erros ao tornar público (pode já ser público)
      console.warn('[FirebasePlayerPhotoService] Error making file public:', error);
    }

    const url = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;

    return { url, path: objectPath };
  }

  /**
   * Deleta foto de jogador do Firebase Storage
   */
  async deletePlayerPhoto(playerId: string): Promise<void> {
    const { getDefaultBucket } = await import('../firebase/admin.js');
    const bucket = getDefaultBucket();
    const folderPrefix = path.posix.join('players', playerId, '/');

    try {
      const [files] = await bucket.getFiles({ prefix: folderPrefix });
      if (files && files.length > 0) {
        await Promise.allSettled(files.map((f) => f.delete()));
      }
    } catch (error) {
      console.error('[FirebasePlayerPhotoService] Error deleting files:', error);
      throw error;
    }
  }
}
