import Link from 'next/link';

interface LogoIconProps {
  className?: string;
  size?: number;
}

/** Supplied transparent Capgen ribbon mark, shared across all brand placements. */
export function LogoIcon({ className = 'w-8 h-8', size = 32 }: LogoIconProps) {
  return (
    <img
      src="/logo-icon.webp?v=20261015"
      alt="Capgen"
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
    <Link
      href={href}
      className="flex items-center gap-2.5 group selection:bg-blue-500 selection:text-white"
    >
      <LogoIcon className={className} />
      <span className="font-extrabold text-slate-900 text-lg tracking-tight transition">
        Capgen<span className="text-blue-600 font-bold">.app</span>
      </span>
    </Link>
  );
}

export default Logo;
