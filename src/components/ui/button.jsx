import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import PropTypes from 'prop-types';

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // --- Core Theme Variants (Cyan/Purple/Slate) ---
        default:
          "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-purple-500",
        destructive:
          "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm hover:from-red-500 hover:to-rose-500",
        outline:
          "border border-slate-700 bg-slate-800/50 text-slate-300 shadow-sm hover:bg-slate-700/50 hover:text-white",
        secondary:
          "bg-slate-700 text-white shadow-sm hover:bg-slate-600",
        ghost: "hover:bg-slate-800/50 hover:text-white",
        link: "text-cyan-400 underline-offset-4 hover:underline",

        // --- Custom Color Variants (for context buttons) ---
        cyan: "bg-cyan-600 text-white shadow hover:bg-cyan-500",
        cyanOutline: "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm hover:bg-cyan-500/20 hover:text-cyan-300",
        purple: "bg-purple-600 text-white shadow hover:bg-purple-500",
        purpleOutline: "border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-sm hover:bg-purple-500/20 hover:text-purple-300",
        green: "bg-green-600 text-white shadow hover:bg-green-500",
        greenOutline: "border border-green-500/30 bg-green-500/10 text-green-400 shadow-sm hover:bg-green-500/20 hover:text-green-300",
        orange: "bg-orange-600 text-white shadow hover:bg-orange-500",
        orangeOutline: "border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-sm hover:bg-orange-500/20 hover:text-orange-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'cyan', 'cyanOutline', 'purple', 'purpleOutline', 'green', 'greenOutline', 'orange', 'orangeOutline']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  asChild: PropTypes.bool,
};

export { Button, buttonVariants }
