export interface UploadPlayerPhotoInput {
  playerId: string;
  file: {
    buffer: Buffer;
    mimetype: string;
  };
}

export interface UploadPlayerPhotoOutput {
  photoUrl: string;
}
