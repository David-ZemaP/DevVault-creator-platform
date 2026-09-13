import type { Creator } from "@/types/creator";

export const mockCreators = [
  {
    address: "0x1111111111111111111111111111111111111111",
    name: "Valeria Rojas",
    bio: "Frontend engineer exploring thoughtful experiences for on-chain communities.",
    initials: "VR",
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    name: "Andrés Flores",
    bio: "Building tools and writing practical guides for independent creators.",
    initials: "AF",
  },
  {
    address: "0x3333333333333333333333333333333333333333",
    name: "Camila Vargas",
    bio: "Notes on digital ownership, provenance, and the creative process.",
    initials: "CV",
  },
  {
    address: "0x4444444444444444444444444444444444444444",
    name: "Diego López",
    bio: "Preparing my first publication. Come back soon.",
    initials: "DL",
  },
] as const satisfies readonly Creator[];
