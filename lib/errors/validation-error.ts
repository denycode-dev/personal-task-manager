import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(message = "Data tidak valid.") {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}