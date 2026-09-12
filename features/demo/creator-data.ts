import { listPublications } from "../publications/repository";
import { AppError } from "../../lib/web3/errors";

export type ResourceScenario = "success" | "loading" | "error" | "empty";
export async function loadCreatorPublications(address: string, scenario: ResourceScenario) {
  await new Promise<void>((resolve) => setTimeout(resolve, scenario === "loading" ? 1800 : 250));
  if (scenario === "error") throw new AppError("rpc", "Publications could not be loaded. Retry the demo query.");
  return scenario === "empty" ? [] : listPublications(address);
}
export function creatorMetrics(address: string) {
  const fixtures: Record<string, { members: number; revenue: string }> = {
    "0x1111111111111111111111111111111111111111": { members: 12, revenue: "24.00" },
    "0x2222222222222222222222222222222222222222": { members: 8, revenue: "16.00" },
    "0x3333333333333333333333333333333333333333": { members: 5, revenue: "10.00" },
  };
  return fixtures[address.toLowerCase()] ?? { members: 0, revenue: "0.00" };
}
