"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// A header link that marks the page it points to (underline and `aria-current`). A link with a `#` never counts as current.
export default function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = !href.includes("#") && pathname === href;
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="relative inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-2.5 font-medium text-foreground/80 after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:rounded-full hover:text-primary aria-[current=page]:text-primary aria-[current=page]:after:bg-primary sm:px-4 sm:after:inset-x-4"
    >
      {children}
    </Link>
  );
}
