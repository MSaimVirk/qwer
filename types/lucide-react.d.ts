declare module 'lucide-react' {
    import { ComponentProps, FC } from 'react'
    
    export interface IconProps extends ComponentProps<'svg'> {
      size?: number | string
      absoluteStrokeWidth?: boolean
    }
    
    export const PlusIcon: FC<IconProps>
    export const MessageSquareIcon: FC<IconProps>
    export const PanelLeftCloseIcon: FC<IconProps>
    export const PanelLeftIcon: FC<IconProps>
  }