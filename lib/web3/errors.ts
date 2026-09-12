export const errorMessages = {
  rejected: "The simulated request was rejected. Nothing was submitted. You can retry.",
  "wrong-network": "Switch to the required demo network before continuing.",
  transaction: "The transaction failed. Your progress is preserved; retry the current step.",
  rpc: "Verification is unavailable. Retry verification without paying again.",
  "access-denied": "Content remains locked. A verified membership is required.",
  session: "A connected demo account is required. Use the demo wallet controls to continue.",
  backend: "Protected content delivery is not connected yet.",
  "invalid-input": "Correct the highlighted fields before continuing.",
  "membership-missing": "Membership is not detected yet. Retry verification without purchasing again.",
  "proof-missing": "No proof was found. Retry the lookup or finish proof registration.",
  "publish-failed": "Publication could not be completed. Your draft and completed steps are preserved.",
} as const;
export type AppErrorCode = keyof typeof errorMessages;

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message: string = errorMessages[code]) {
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
