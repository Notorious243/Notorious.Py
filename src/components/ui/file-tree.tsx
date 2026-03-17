"use client"

import React, {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronRight, FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type TreeViewElement = {
    id: string
    name: string
    isSelectable?: boolean
    children?: TreeViewElement[]
}

type TreeContextProps = {
    selectedId: string | undefined
    expandedItems: string[] | undefined
    indicator: boolean
    handleExpand: (id: string) => void
    selectItem: (id: string) => void
    setExpandedItems?: React.Dispatch<React.SetStateAction<string[] | undefined>>
    openIcon?: React.ReactNode
    closeIcon?: React.ReactNode
    direction: "rtl" | "ltr"
}

const TreeContext = createContext<TreeContextProps | null>(null)

const useTree = () => {
    const context = useContext(TreeContext)
    if (!context) {
        throw new Error("useTree must be used within a TreeProvider")
    }
    return context
}

type Direction = "rtl" | "ltr" | undefined

type TreeViewProps = {
    initialSelectedId?: string
    indicator?: boolean
    elements?: TreeViewElement[]
    initialExpandedItems?: string[]
    openIcon?: React.ReactNode
    closeIcon?: React.ReactNode
    onSelectChange?: (id: string | undefined) => void
} & React.HTMLAttributes<HTMLDivElement>

const Tree = forwardRef<HTMLDivElement, TreeViewProps>(
    (
        {
            className,
            elements,
            initialSelectedId,
            initialExpandedItems,
            children,
            indicator = true,
            openIcon,
            closeIcon,
            dir,
            onSelectChange,
            ...props
        },
        ref
    ) => {
        const [selectedId, setSelectedId] = useState<string | undefined>(
            initialSelectedId
        )
        const [expandedItems, setExpandedItems] = useState<string[] | undefined>(
            initialExpandedItems
        )

        const selectItem = useCallback((id: string) => {
            setSelectedId(id)
            onSelectChange?.(id)
        }, [onSelectChange])

        const handleExpand = useCallback((id: string) => {
            setExpandedItems((prev) => {
                if (prev?.includes(id)) {
                    return prev.filter((item) => item !== id)
                }
                return [...(prev ?? []), id]
            })
        }, [])

        const expandSpecificTargetedElements = useCallback(
            (elements?: TreeViewElement[], selectId?: string) => {
                if (!elements || !selectId) return
                const findParent = (
                    currentElement: TreeViewElement,
                    currentPath: string[] = []
                ) => {
                    const isSelectable = currentElement.isSelectable ?? true
                    const newPath = [...currentPath, currentElement.id]
                    if (currentElement.id === selectId) {
                        if (isSelectable) {
                            setExpandedItems((prev) => Array.from(new Set([...(prev ?? []), ...newPath])))
                        } else {
                            if (newPath.includes(currentElement.id)) {
                                newPath.pop()
                                setExpandedItems((prev) => Array.from(new Set([...(prev ?? []), ...newPath])))
                            }
                        }
                        return
                    }
                    if (
                        isSelectable &&
                        currentElement.children &&
                        currentElement.children.length > 0
                    ) {
                        currentElement.children.forEach((child) => {
                            findParent(child, newPath)
                        })
                    }
                }
                elements.forEach((element) => {
                    findParent(element)
                })
            },
            []
        )

        useEffect(() => {
            if (initialSelectedId) {
                expandSpecificTargetedElements(elements, initialSelectedId)
            }
        }, [initialSelectedId, elements])

        const direction = dir === "rtl" ? "rtl" : "ltr"

        return (
            <TreeContext.Provider
                value={{
                    selectedId,
                    expandedItems,
                    handleExpand,
                    selectItem,
                    setExpandedItems,
                    indicator,
                    openIcon,
                    closeIcon,
                    direction,
                }}
            >
                <div className={cn("size-full", className)}>
                    <ScrollArea
                        ref={ref}
                        className="relative h-full"
                        dir={dir as Direction}
                    >
                        <AccordionPrimitive.Root
                            {...props}
                            type="multiple"
                            defaultValue={expandedItems}
                            value={expandedItems}
                            className="flex flex-col"
                            onValueChange={(value) =>
                                setExpandedItems((prev) => Array.from(new Set([...(prev ?? []), value[0]])))
                            }
                            dir={dir as Direction}
                        >
                            {children}
                        </AccordionPrimitive.Root>
                    </ScrollArea>
                </div>
            </TreeContext.Provider>
        )
    }
)

Tree.displayName = "Tree"

const TreeIndicator = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { direction } = useTree()

    return (
        <div
            dir={direction}
            ref={ref}
            className={cn(
                "bg-border/60 absolute left-[7px] h-full w-px py-3 rtl:right-[7px]",
                className
            )}
            {...props}
        />
    )
})

TreeIndicator.displayName = "TreeIndicator"

type FolderProps = {
    expandedItems?: string[]
    element: string | React.ReactNode
    isSelectable?: boolean
    isSelect?: boolean
    folderIcon?: React.ReactNode
    folderOpenIcon?: React.ReactNode
} & React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>

const Folder = forwardRef<
    HTMLDivElement,
    FolderProps & React.HTMLAttributes<HTMLDivElement>
>(
    (
        {
            className,
            element,
            value,
            isSelectable = true,
            isSelect,
            folderIcon,
            folderOpenIcon,
            children,
            ...props
        },
        ref
    ) => {
        const {
            direction,
            handleExpand,
            expandedItems,
            indicator,
            setExpandedItems,
            openIcon,
            closeIcon,
            selectItem,
        } = useTree()

        return (
            <AccordionPrimitive.Item
                {...props}
                ref={ref}
                value={value}
                className="relative h-full overflow-hidden"
            >
                <AccordionPrimitive.Trigger
                    className={cn(
                        `flex w-full min-w-0 items-center gap-1 rounded-sm px-1 py-[3px] text-[13px] select-none overflow-hidden`,
                        className,
                        {
                            "bg-primary/10 text-primary": isSelect && isSelectable,
                            "hover:bg-muted/80": !isSelect && isSelectable,
                            "cursor-pointer": isSelectable,
                            "cursor-not-allowed opacity-50": !isSelectable,
                        }
                    )}
                    disabled={!isSelectable}
                    onClick={() => {
                        selectItem(value);
                        handleExpand(value);
                    }}
                >
                    <ChevronRight className={cn(
                        "size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200",
                        expandedItems?.includes(value) && "rotate-90"
                    )} />
                    {expandedItems?.includes(value)
                        ? (folderOpenIcon ?? openIcon ?? <FolderOpenIcon className="size-4 shrink-0 text-amber-500" />)
                        : (folderIcon ?? closeIcon ?? <FolderIcon className="size-4 shrink-0 text-amber-500" />)}
                    <span className="truncate min-w-0 ml-0.5">{element}</span>
                </AccordionPrimitive.Trigger>
                <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down relative h-full overflow-hidden text-[13px]">
                    {element && indicator && <TreeIndicator aria-hidden="true" />}
                    <AccordionPrimitive.Root
                        dir={direction}
                        type="multiple"
                        className="ml-3 flex flex-col pl-2.5 rtl:mr-3 rtl:pl-0 rtl:pr-2.5"
                        defaultValue={expandedItems}
                        value={expandedItems}
                        onValueChange={(value) => {
                            setExpandedItems?.((prev) => Array.from(new Set([...(prev ?? []), value[0]])))
                        }}
                    >
                        {children}
                    </AccordionPrimitive.Root>
                </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
        )
    }
)

Folder.displayName = "Folder"

const File = forwardRef<
    HTMLButtonElement,
    {
        value: string
        handleSelect?: (id: string) => void
        isSelectable?: boolean
        isSelect?: boolean
        fileIcon?: React.ReactNode
    } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(
    (
        {
            value,
            className,
            handleSelect,
            isSelectable = true,
            isSelect,
            fileIcon,
            children,
            ...props
        },
        ref
    ) => {
        const { direction, selectedId, selectItem } = useTree()
        const isSelected = isSelect ?? selectedId === value
        return (
            <button
                ref={ref}
                type="button"
                disabled={!isSelectable}
                className={cn(
                    "flex w-full min-w-0 items-center gap-1 rounded-sm px-1 py-[3px] text-[13px] select-none overflow-hidden",
                    {
                        "bg-primary/10 text-primary": isSelected && isSelectable,
                        "hover:bg-muted/80": !isSelected && isSelectable,
                    },
                    isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                    direction === "rtl" ? "rtl" : "ltr",
                    className
                )}
                onClick={() => selectItem(value)}
                {...props}
            >
                <span className="size-3.5 shrink-0" />
                {fileIcon ?? <FileIcon className="size-4 shrink-0 text-muted-foreground" />}
                <span className="truncate min-w-0 ml-0.5">{children}</span>
            </button>
        )
    }
)

File.displayName = "File"

const CollapseButton = forwardRef<
    HTMLButtonElement,
    {
        elements: TreeViewElement[]
        expandAll?: boolean
    } & React.HTMLAttributes<HTMLButtonElement>
>(({ className, elements, expandAll = false, children, ...props }, ref) => {
    const { expandedItems, setExpandedItems } = useTree()

    const expendAllTree = useCallback((elements: TreeViewElement[]) => {
        const expandTree = (element: TreeViewElement) => {
            const isSelectable = element.isSelectable ?? true
            if (isSelectable && element.children && element.children.length > 0) {
                setExpandedItems?.((prev) => [...(prev ?? []), element.id])
                element.children.forEach(expandTree)
            }
        }

        elements.forEach(expandTree)
    }, [])

    const closeAll = useCallback(() => {
        setExpandedItems?.([])
    }, [])

    useEffect(() => {
        
        if (expandAll) {
            expendAllTree(elements)
        }
    }, [expandAll])

    return (
        <Button
            variant={"ghost"}
            className="absolute right-2 bottom-1 h-8 w-fit p-1"
            onClick={
                expandedItems && expandedItems.length > 0
                    ? closeAll
                    : () => expendAllTree(elements)
            }
            ref={ref}
            {...props}
        >
            {children}
            <span className="sr-only">Basculer</span>
        </Button>
    )
})

CollapseButton.displayName = "CollapseButton"


const TreeInput = forwardRef<
    HTMLInputElement,
    {
        value: string
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
        onBlur: () => void
        fileIcon?: React.ReactNode
        isFolder?: boolean
    } & React.InputHTMLAttributes<HTMLInputElement>
>(({ value, onChange, onKeyDown, onBlur, fileIcon, isFolder, className, ...props }, ref) => {
    const { direction } = useTree()
    return (
        <div className={cn(
            "flex w-full min-w-0 items-center gap-1 rounded-sm px-1 py-[3px] text-[13px] overflow-hidden",
            direction === "rtl" ? "rtl" : "ltr",
            className
        )}>
            <span className="size-3.5 shrink-0" />
            {fileIcon ?? (isFolder ? <FolderIcon className="size-4 shrink-0 text-amber-500/80" /> : <FileIcon className="size-4 shrink-0 text-muted-foreground" />)}
            <input
                ref={ref}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                autoFocus
                className="flex-1 bg-background border border-primary/40 rounded-[3px] px-1.5 h-[22px] outline-none min-w-0 text-[13px] transition-all"
                {...props}
            />
        </div>
    )
})

TreeInput.displayName = "TreeInput"

export { CollapseButton, File, Folder, Tree, TreeInput, type TreeViewElement }
