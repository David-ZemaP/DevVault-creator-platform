"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { checkUnlockMembership, getUnlockCheckoutUrl } from "@/lib/web3/unlock";
import { Button } from "@/components/ui/button";
import { Lock, ShieldAlert } from "lucide-react";

interface MembershipGateProps {
  lockAddress?: string;
  isGated: boolean;
  children: React.ReactNode;
}

export function MembershipGate({ lockAddress, isGated, children }: MembershipGateProps) {
  const { address, isConnected } = useAccount();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!isGated) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (!isConnected || !address || !lockAddress) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      const access = await checkUnlockMembership({
        lockAddress: lockAddress as `0x${string}`,
        userAddress: address,
      });
      setHasAccess(access);
      setLoading(false);
    }

    verify();
  }, [address, isConnected, isGated, lockAddress]);

  if (!isGated || hasAccess) {
    return <>{children}</>;
  }

  const checkoutUrl = lockAddress
    ? getUnlockCheckoutUrl({
        lockAddress,
        name: "DevVault Content Pass",
      })
    : "#";

  return (
    <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3">
        <Lock className="h-5 w-5" />
      </div>

      <h2 className="text-lg font-bold text-white">Members-Only Content</h2>
      <p className="mt-1.5 text-xs text-zinc-400 max-w-md mx-auto">
        This publication is token-gated with Unlock Protocol on HashKey Chain (HSK). You need an active
        membership key on HSK to unlock the full content.
      </p>

      {!isConnected ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-400">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Connect your wallet to verify access on HashKey</span>
        </div>
      ) : (
        <div className="mt-5 flex justify-center">
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">Unlock Access with HSK Key</Button>
          </a>
        </div>
      )}
    </div>
  );
}
