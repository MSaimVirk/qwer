'use client'

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { PlusIcon, MessageSquareIcon, PanelLeftCloseIcon } from "lucide-react"

type ChatHead = { id: string; title: string }

interface AppSidebarProps {
  chatHeads: ChatHead[]
  selectedChatHead: string | null
  onSelectChatHead: (id: string) => void
  onCreateNewChat: () => void
}

export function AppSidebar({
  chatHeads,
  selectedChatHead,
  onSelectChatHead,
  onCreateNewChat,
}: AppSidebarProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="w-64">
      <SidebarHeader className="border-b border-[#3A3A3A] bg-[#2C2C2C]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#10A37F]">
              <MessageSquareIcon className="h-3 w-3 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-semibold text-[#E6E6E6]">Mental Health AI</h1>
              <p className="text-xs text-[#A0A0A0]">Your AI companion</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-6 w-6 text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#343541]"
          >
            <PanelLeftCloseIcon className="h-3 w-3" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#2C2C2C]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#A0A0A0] text-xs">New Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <Button
              onClick={onCreateNewChat}
              className="w-48 bg-[#10A37F] hover:bg-[#18C999] text-white border-0 text-xs"
              size="sm"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#A0A0A0] text-xs">Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatHeads.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectChatHead(chat.id)}
                    isActive={selectedChatHead === chat.id}
                    className="text-[#E6E6E6] hover:bg-[#343541] hover:text-white data-[active=true]:bg-[#343541] data-[active=true]:text-white text-xs bg-transparent"
                    tooltip={chat.title}
                  >
                    <MessageSquareIcon className="h-3 w-3" />
                    <span className="truncate group-data-[collapsible=icon]:hidden text-xs">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {chatHeads.length === 0 && (
                <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                  <p className="text-xs text-[#6B6B6B]">No chats yet. Start a new conversation!</p>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
} 