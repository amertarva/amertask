// Custom error class and HTTP error helpers

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  badRequest: (message: string) => new AppError(400, "BAD_REQUEST", message),
  unauthorized: (message = "Tidak terautentikasi") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Tidak memiliki akses") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message: string) => new AppError(404, "NOT_FOUND", message),
  conflict: (message: string) => new AppError(409, "CONFLICT", message),
  unprocessable: (message: string) =>
    new AppError(422, "UNPROCESSABLE", message),
  internal: (message = "Terjadi kesalahan server") =>
    new AppError(500, "INTERNAL_ERROR", message),
};
