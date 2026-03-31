import { cva } from "class-variance-authority"

export const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-destructive/5 border-destructive/20 [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        warning:
          "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-950/50 dark:border-amber-800/40 [&>svg]:text-current *:data-[slot=alert-description]:text-amber-700 dark:*:data-[slot=alert-description]:text-amber-300/90",
        success:
          "text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800/40 [&>svg]:text-current *:data-[slot=alert-description]:text-emerald-700 dark:*:data-[slot=alert-description]:text-emerald-300/90",
        info:
          "text-blue-800 bg-blue-50 border-blue-200 dark:text-blue-200 dark:bg-blue-950/50 dark:border-blue-800/40 [&>svg]:text-current *:data-[slot=alert-description]:text-blue-700 dark:*:data-[slot=alert-description]:text-blue-300/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
