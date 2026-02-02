/**
 * Modal Component
 */
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  className?: string;
}

export const Modal = ({ open, onClose, title, children, size = 'md', footer, className }: ModalProps) => {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className={cn(
            'bg-white rounded-lg shadow-xl z-50 w-full',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
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
          <div className="p-4">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};







