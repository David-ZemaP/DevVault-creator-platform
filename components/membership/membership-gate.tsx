"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { checkUnlockMembership, getUnlockCheckoutUrl } from "@/lib/web3/unlock";
import { Button } from "@/lib/../components/ui/button";
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
    <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 text-center backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4 border border-red-500/20">
        <Lock className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold text-white">Members-Only Content</h2>
      <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
        This publication is token-gated with Unlock Protocol on Avalanche. You need an active
        membership key to unlock the full content.
      </p>

      {!isConnected ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-400">
          <ShieldAlert className="h-4 w-4" />
          <span>Connect your wallet to verify access</span>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">Unlock Access with Key</Button>
          </a>
        </div>
      )}
    </div>
  );
}
