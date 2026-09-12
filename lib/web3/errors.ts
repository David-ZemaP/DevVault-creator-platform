export type AppErrorCode = "rejected" | "wrong-network" | "transaction" | "rpc" | "access-denied" | "session" | "backend" | "invalid-input";

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (typeof error === "object" && error !== null && "code" in error && error.code === 4001) {
    return "The request was rejected in your wallet. Nothing was submitted. Try again when ready.";
  }
  return "We could not complete this request. Please try again.";
}
