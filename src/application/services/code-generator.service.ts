export interface ICodeGenerator {
  generate(): string;
}

export class AlphanumericCodeGenerator implements ICodeGenerator {
  generate(): string {
    return Math.random().toString(36).slice(2, 9).toUpperCase();
  }
}

export class SecureCodeGenerator implements ICodeGenerator {
  generate(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove confusing chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
