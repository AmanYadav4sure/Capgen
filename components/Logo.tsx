import React from 'react';
import Link from 'next/link';

interface LogoIconProps {
  className?: string;
  size?: number;
}

/**
 * Official Capgen Scalable Vector Icon (viewBox 0 0 512 512)
 * Features outer caption brackets & central 'C' emblem in #2060F6
 */
export function LogoIcon({ className = 'w-8 h-8', size = 32 }: LogoIconProps) {
  return (
    <img
      src="/logo.png"
      alt="Capgen Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Official Capgen Full Brand Logo with Wordmark "Capgen.app"
 */
export function Logo({ href = '/', className = 'w-8 h-8' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group selection:bg-blue-500 selection:text-white">
      <LogoIcon className={className} />
      <span className="font-extrabold text-darkblue text-lg tracking-tight group-hover:text-slate-1000 transition">
        Capgen<span className="text-blue-500 font-bold">.app</span>
      </span>
    </Link>
  );
}

export default Logo;
