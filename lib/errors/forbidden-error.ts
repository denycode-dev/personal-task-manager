import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(message = "Akses ditolak.") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}