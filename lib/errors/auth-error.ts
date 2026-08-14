import { AppError } from "./app-error";

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi tidak valid. Silakan login kembali.") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}