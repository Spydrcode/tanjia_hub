'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
};

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact 
    ? pathname === href 
    : pathname === href || (href !== "/tanjia" && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-neutral-100 text-neutral-950"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}
