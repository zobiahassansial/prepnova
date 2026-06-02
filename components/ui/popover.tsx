"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
    open: false,
    setOpen: () => { },
})

const Popover = ({
    children,
    open: controlledOpen,
    onOpenChange,
}: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
        if (!isControlled) setInternalOpen(value)
        onOpenChange?.(value)
    }
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <PopoverContext.Provider value={{ open, setOpen }}>
            <div ref={ref} className="relative inline-block text-left">
                {children}
            </div>
        </PopoverContext.Provider>
    )
}

const PopoverTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)

    if (asChild) {
        const child = React.Children.only(children) as React.ReactElement<any>
        return React.cloneElement(child, {
            onClick: (e: React.MouseEvent) => {
                child.props.onClick?.(e)
                setOpen(!open)
            },
        })
    }

    return (
        <button
            ref={ref}
            className={className}
            onClick={() => setOpen(!open)}
            {...props}
        >
            {children}
        </button>
    )
})
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: "center" | "start" | "end"
    sideOffset?: number
}

const PopoverContent = React.forwardRef<
    HTMLDivElement,
    PopoverContentProps
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const { open } = React.useContext(PopoverContext)

    if (!open) return null

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
                "top-full mt-2 left-0",
                className
            )}
            {...props}
        />
    )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
