import * as React from "react"

import { cn } from "../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-16 w-full rounded-2xl border-0 bg-[#EFEBF5] px-6 py-4 text-lg text-clay-foreground shadow-clayPressed ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-clay-muted focus:bg-white focus:shadow-none focus:ring-4 focus:ring-clay-accent/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-body",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
