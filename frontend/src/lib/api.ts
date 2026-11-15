export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function clientApi(path: string) {
  return `/backend-api/v1${path}`;
}
