/**
 * Drawer Component
 */
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export const Drawer = ({ open, onClose, title, children, side = 'right', className }: DrawerProps) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transition-transform duration-300',
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};







