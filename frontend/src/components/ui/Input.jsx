import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, id, type = 'text', placeholder, error, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        className={[
          'w-full rounded-lg px-4 py-3 text-sm',
          'bg-[#191919] text-zinc-100 placeholder:text-zinc-600',
          error
            ? 'border border-red-500/50 focus:border-red-500'
            : 'border border-white/8 focus:border-white/25',
          'focus:outline-none focus:bg-[#1e1e1e]',
          'transition-all duration-200',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export default Input
