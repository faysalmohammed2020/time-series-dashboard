"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  LineChart,
  ScatterChart,
  Table,
  Home,
  Settings,
  Download,
  Calendar,
  RefreshCw,
  CloudRain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false)
  const pathname = usePathname()

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar>
            <SidebarHeader className="flex items-center px-4 py-2">
              <div className="flex items-center space-x-2">
                <CloudRain className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Weather Dashboard</h1>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                        <Link href="/dashboard">
                          <Home />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/bar-charts"}>
                        <Link href="/bar-charts">
                          <BarChart3 />
                          <span>Bar Charts</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/line-charts"}>
                        <Link href="/line-charts">
                          <LineChart />
                          <span>Line Charts</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/scatter-plots"}>
                        <Link href="/scatter-plots">
                          <ScatterChart />
                          <span>Scatter Plots</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/data-table"}>
                        <Link href="/data-table">
                          <Table />
                          <span>Data Table</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Calendar />
                        <span>Date Range</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Download />
                        <span>Export Data</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <ModeToggle />
              </div>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 border-b bg-background">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <h1 className="text-xl font-semibold">Weather Station Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </div>
              </div>
            </header>

            <main className="p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
