
import * as React from "react"
import { cn } from "@/lib/utils"

export interface PillBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PillBadge = React.forwardRef<HTMLDivElement, PillBadgeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider",
          "bg-white/10 border border-white/20 text-white",
          "backdrop-blur-sm",
          className
        )}
        style={{
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.1em'
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PillBadge.displayName = "PillBadge"

export { PillBadge }
