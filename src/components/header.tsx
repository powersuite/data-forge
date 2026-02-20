"use client";

import Link from "next/link";
import { Anvil } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Anvil className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Data Forge</span>
        </Link>
      </div>
    </header>
  );
}
