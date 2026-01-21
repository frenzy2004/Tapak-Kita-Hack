import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[20px] text-sm font-bold font-heading tracking-wide transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 active:scale-[0.92] active:shadow-clayPressed",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton hover:shadow-clayButtonHover hover:-translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground shadow-clayButton hover:bg-destructive/90 hover:shadow-clayButtonHover hover:-translate-y-1",
        outline:
          "border-2 border-clay-accent/20 bg-transparent text-clay-accent shadow-none hover:border-clay-accent hover:bg-clay-accent/5 hover:-translate-y-0.5",
        secondary:
          "bg-white text-clay-foreground shadow-clayButton hover:shadow-clayButtonHover hover:-translate-y-1",
        ghost:
          "text-clay-foreground shadow-none hover:bg-clay-accent/10 hover:text-clay-accent active:shadow-none active:scale-95",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:scale-100",
      },
      size: {
        default: "h-14 px-8",
        sm: "h-11 rounded-2xl px-6 text-xs",
        lg: "h-16 px-10 text-base",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
