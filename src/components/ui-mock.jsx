import { cn } from '@lib/utils'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E31837] focus-visible:ring-offset-2'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border bg-white shadow', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function Button({ className, variant, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        focusRing,
        variant === 'outline'
          ? 'border border-gray-300 bg-white hover:bg-gray-50'
          : 'bg-[#b81d24] text-white hover:bg-[#c41530]',
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border-2 border-gray-200 bg-white p-3 text-sm text-[#1a1a1a] placeholder:text-gray-400 resize-none transition-colors focus:border-[#E31837] focus:outline-none',
        className
      )}
      {...props}
    />
  )
}

export function Checkbox({ className, checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn('h-5 w-5 shrink-0 cursor-pointer rounded accent-[#E31837]', focusRing, className)}
      {...props}
    />
  )
}
