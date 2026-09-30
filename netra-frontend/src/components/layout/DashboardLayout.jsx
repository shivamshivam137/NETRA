import { useState } from 'react'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { useSidebar } from '../../context/SidebarContext'

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area — Automatically expands when sidebar is collapsed */}
      <div 
        className={`flex-1 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        } flex flex-col min-w-0 transition-all duration-300 ease-in-out`}
      >
        {/* Top Header */}
        <TopHeader title={title} onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
