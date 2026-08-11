"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function SidePanel({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="side-panel" {...props} />
}

function SidePanelTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="side-panel-trigger" {...props} />
}

function SidePanelPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="side-panel-portal" {...props} />
}

function SidePanelClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="side-panel-close" {...props} />
}

function SidePanelOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="side-panel-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/12 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SidePanelContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  "aria-describedby": ariaDescribedBy,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "left" | "right"
  showCloseButton?: boolean
}) {
  return (
    <SidePanelPortal>
      <SidePanelOverlay />
      <DialogPrimitive.Content
        data-slot="side-panel-content"
        data-side={side}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-full max-w-[46rem] flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-[var(--shadow-lg)] outline-none duration-150 data-open:animate-in data-closed:animate-out sm:w-[min(46rem,100vw)]",
          side === "left"
            ? "left-0 border-r border-border/80 data-open:slide-in-from-left data-closed:slide-out-to-left"
            : "right-0 border-l border-border/80 data-open:slide-in-from-right data-closed:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close data-slot="side-panel-close" asChild>
            <Button
              variant="ghost"
              className="absolute right-4 top-4 z-10"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Fechar painel</span>
            </Button>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </SidePanelPortal>
  )
}

function SidePanelHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-panel-header"
      className={cn(
        "border-b border-border/70 px-5 py-5 md:px-6",
        className
      )}
      {...props}
    />
  )
}

function SidePanelBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-panel-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className
      )}
      {...props}
    />
  )
}

function SidePanelFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-panel-footer"
      className={cn(
        "border-t border-border/70 bg-muted/35 px-5 py-4 md:px-6",
        className
      )}
      {...props}
    />
  )
}

function SidePanelTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="side-panel-title"
      className={cn(
        "pr-12 text-xl leading-8 font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SidePanelDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="side-panel-description"
      className={cn(
        "mt-2 max-w-2xl text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelOverlay,
  SidePanelPortal,
  SidePanelTitle,
  SidePanelTrigger,
}
