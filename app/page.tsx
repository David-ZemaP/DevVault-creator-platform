import Link from "next/link";
import { ContentCard } from "@/components/content/content-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Compass } from "lucide-react";

const SAMPLE_PUBLICATIONS = [
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000001",
    title: "Building High-Throughput Subnets on Avalanche",
    description:
      "A deep architectural dive into customizing EVM execution runtimes and gas parameters on dedicated Avalanche subnets.",
    author: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    isGated: false,
  },
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000002",
    title: "Token-Gated Creator Monetization with Unlock Protocol",
    description:
      "Full guide and contract templates to tokenize your newsletter or video vault with self-sovereign NFT keys.",
    author: "0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isGated: true,
    lockAddress: "0x1234567890123456789012345678901234567890",
  },
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000003",
    title: "Content Provenance & Proof Registries on EVM",
    description:
      "How keccak256 hashes anchored on-chain protect creators against unauthorized AI scrapers and impersonation.",
    author: "0x3344556677889900112233445566778899001122",
    createdAt: Math.floor(Date.now() / 1000) - 172800,
    isGated: false,
  },
];

export default function ExplorePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-red-500 uppercase">
            <Compass className="h-4 w-4" />
            Decentralized Feed
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Explore Publications
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Verifiable on-chain creator proofs and token-gated content powered by Avalanche.
          </p>
        </div>

        <div>
          <Link href="/create">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Publish Content
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_PUBLICATIONS.map((pub) => (
          <ContentCard key={pub.id} {...pub} />
        ))}
      </div>
    </div>
  );
}
