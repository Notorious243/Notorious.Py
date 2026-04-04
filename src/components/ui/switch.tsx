"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "defaultValue"
> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  name?: string
  value?: string
  required?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      name,
      value = "on",
      required,
      onClick,
      ...props
    },
    ref
  ) => {
    const isControlled = checked !== undefined
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const resolvedChecked = isControlled ? checked : internalChecked

    const handleToggle = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || disabled) return

        const next = !resolvedChecked
        if (!isControlled) {
          setInternalChecked(next)
        }
        onCheckedChange?.(next)
      },
      [disabled, isControlled, onCheckedChange, onClick, resolvedChecked]
    )

    return (
      <>
        <button
          type="button"
          role="switch"
          aria-checked={resolvedChecked}
          data-state={resolvedChecked ? "checked" : "unchecked"}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
            className
          )}
          disabled={disabled}
          onClick={handleToggle}
          ref={ref}
          {...props}
        >
          <span
            data-state={resolvedChecked ? "checked" : "unchecked"}
            className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          />
        </button>
        {name ? (
          <input
            aria-hidden="true"
            tabIndex={-1}
            type="checkbox"
            name={name}
            value={value}
            checked={resolvedChecked}
            required={required}
            disabled={disabled}
            readOnly
            className="pointer-events-none absolute size-0 opacity-0"
          />
        ) : null}
      </>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
