'use client';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  style,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const opener = useRef<HTMLElement | null>(
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement),
  );
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md" />
        <Dialog.Viewport
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <Dialog.Popup
            aria-label={title}
            className={className}
            style={style}
            finalFocus={() => opener.current}
          >
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
