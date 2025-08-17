'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UsernameInputProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string[];
  onChange?: (value: string) => void;
  className?: string;
  required?: boolean;
}

export function UsernameInput({
  id,
  name,
  label,
  placeholder = 'username',
  value,
  defaultValue,
  disabled = false,
  error,
  onChange,
  className,
  required = false,
}: UsernameInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\s/g, '');
    if (onChange) {
      onChange(newValue);
    } else {
      e.target.value = newValue;
    }
  };

  const hasError = error && error.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-muted-foreground text-sm select-none">@</span>
        </div>
        <Input
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={cn(
            'pl-8',
            hasError && 'border-destructive focus-visible:ring-destructive',
            className
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <User className="text-muted-foreground h-4 w-4" />
        </div>
      </div>
      {hasError && (
        <div id={`${id}-error`} className="text-destructive text-sm">
          {error.map((err, index) => (
            <p key={index}>{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
