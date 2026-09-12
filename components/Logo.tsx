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
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="128" fill="#0F172A" />
      <rect width="512" height="512" rx="128" fill="url(#capgen-bg-grad)" />

      {/* Left Caption Bracket [ */}
      <path
        d="M136 150C136 136.745 146.745 126 160 126H200C211.046 126 220 117.046 220 106C220 94.9543 211.046 86 200 86H160C124.654 86 96 114.654 96 150V362C96 397.346 124.654 426 160 426H200C211.046 426 220 417.046 220 406C220 394.954 211.046 386 200 386H160C146.745 386 136 375.255 136 362V150Z"
        fill="#2060F6"
      />

      {/* Right Caption Bracket ] */}
      <path
        d="M376 150C376 136.745 365.255 126 352 126H312C300.954 126 292 117.046 292 106C292 94.9543 300.954 86 312 86H352C387.346 86 416 114.654 416 150V362C416 397.346 387.346 426 352 426H312C300.954 426 292 417.046 292 406C292 394.954 300.954 386 312 386H352C365.255 386 376 375.255 376 362V150Z"
        fill="#2060F6"
      />

      {/* Center 'C' Emblem */}
      <path
        d="M310 190C296 176 276 168 252 168C204 168 170 206 170 256C170 306 204 344 252 344C276 344 296 336 310 322C318 314 318 300 310 292C302 284 288 284 280 292C272 300 262 304 252 304C224 304 206 282 206 256C206 230 224 208 252 208C262 208 272 212 280 220C288 228 302 228 310 220C318 212 318 198 310 190Z"
        fill="url(#capgen-c-grad)"
      />

      <defs>
        <linearGradient id="capgen-bg-grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B132B" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="capgen-c-grad" x1="170" y1="168" x2="310" y2="344" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2060F6" />
        </linearGradient>
      </defs>
    </svg>
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
