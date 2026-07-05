import { Link } from 'react-router-dom'

export default function Logo({ size = 'md', linkTo = '/', className = '' }) {
  const s = {
    sm: { box: 'w-6 h-6', text: 'text-base' },
    md: { box: 'w-8 h-8', text: 'text-xl' },
    lg: { box: 'w-10 h-10', text: 'text-2xl' },
  }[size] ?? { box: 'w-8 h-8', text: 'text-xl' }

  return (
    <Link to={linkTo} className={`flex items-center gap-2.5 no-underline group ${className}`}>
      <div className={`${s.box} rounded-lg bg-white flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-zinc-100`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-4/6 h-4/6" strokeWidth={2.2} stroke="#000">
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M15.5 15.5L20 20" strokeLinecap="round" />
          <path d="M8 10.5h5M10.5 8v5" strokeLinecap="round" />
        </svg>
      </div>
      <span className={`${s.text} font-bold tracking-tight text-white leading-none group-hover:text-zinc-100 transition-colors`}>
        Find<span className="text-zinc-400">it</span>
      </span>
    </Link>
  )
}
