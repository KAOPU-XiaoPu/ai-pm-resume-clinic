import { forwardRef, useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el
      if (typeof ref === 'function') {
        ref(el)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          el
      }
    }

    const resize = () => {
      const el = innerRef.current
      if (!el || !autoResize) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }

    useEffect(() => {
      resize()
    })

    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
          'placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          autoResize && 'resize-none overflow-hidden',
          className,
        )}
        ref={setRefs}
        onChange={(e) => {
          onChange?.(e)
          resize()
        }}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
