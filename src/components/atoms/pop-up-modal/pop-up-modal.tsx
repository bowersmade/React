import React, { ReactNode } from 'react';

export interface PopUpModalProps {
  children: ReactNode;
  onClose: () => void;
}
export default function PopUpModal({ children, onClose }: PopUpModalProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={(e) => (e.target === e.currentTarget ? onClose() : null)}
      />

      <div className="relative fixed flex items-center justify-center p-4">{children}</div>
    </div>
  );
}
