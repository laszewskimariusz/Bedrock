import { cn } from '../../app/lib/utils';
import { forwardRef } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<string, string> = {
  default: 'bg-black text-white hover:bg-black/90',
  outline: 'border border-input bg-white hover:bg-gray-100',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
