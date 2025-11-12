export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ClientError extends AppError {
  constructor(statusCode: number, code: string, message?: string, details?: unknown) {
    super(statusCode, code, message, details);
    if (statusCode < 400 || statusCode > 499) {
      throw new Error('ClientError must use 4xx status code');
    }
  }
}

export class ServerError extends AppError {
  constructor(statusCode = 500, code = 'internal_error', message?: string, details?: unknown) {
    super(statusCode, code, message, details);
    if (statusCode < 500 || statusCode > 599) {
      throw new Error('ServerError must use 5xx status code');
    }
  }
}

export class BadRequestError extends ClientError {
  constructor(code = 'bad_request', message?: string, details?: unknown) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends ClientError {
  constructor(code = 'unauthorized', message?: string, details?: unknown) {
    super(401, code, message, details);
  }
}

export class ForbiddenError extends ClientError {
  constructor(code = 'forbidden', message?: string, details?: unknown) {
    super(403, code, message, details);
  }
}

export class NotFoundError extends ClientError {
  constructor(code = 'not_found', message?: string, details?: unknown) {
    super(404, code, message, details);
  }
}

export class ConflictError extends ClientError {
  constructor(code = 'conflict', message?: string, details?: unknown) {
    super(409, code, message, details);
  }
}

export class UnprocessableEntityError extends ClientError {
  constructor(code = 'unprocessable_entity', message?: string, details?: unknown) {
    super(422, code, message, details);
  }
}
