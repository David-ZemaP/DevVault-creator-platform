import { AppError } from "../../lib/web3/errors";

export async function withDeadline<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new AppError("rpc", "The operation timed out. Your progress is preserved; retry when ready.")), timeoutMs);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
