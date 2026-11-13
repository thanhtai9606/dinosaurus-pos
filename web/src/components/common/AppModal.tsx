import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogSize,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type AppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: DialogSize
  dismissible?: boolean
  className?: string
  bodyClassName?: string
}

/**
 * Generic modal — sized layouts, click-outside to dismiss (default).
 */
export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'lg',
  dismissible = true,
  className,
  bodyClassName,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size} dismissible={dismissible} className={cn(className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className={cn('min-h-0', bodyClassName)}>{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
