import React from 'react';
import { Menu } from 'antd';
import { Bell, ChevronRight } from 'lucide-react';

interface ConDigitalHeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export default function ConDigitalHeader({ currentTab, setCurrentTab, activeSubTab, setActiveSubTab }: ConDigitalHeaderProps) {
  const menuItems = [
    { name: 'Project' },
    { name: 'Human Resource' },
    { name: 'Procurement' },
    { name: 'Inventory' },
    { name: 'Site Visit' },
    { name: 'Fixed Asset' },
    { name: 'Task' },
    { name: 'EVM Dashboard' },
  ];

  const subTabs = [
    'Material',
    'Supplier',
    'Store Requisition',
    'Purchase Requisition',
    'PR Purchaser',
    'Inter-store Transfer',
    'Purchase Evaluation',
    'Purchase Order',
    'Voucher Validation',
  ];

  return (
    <header className="w-full bg-white select-none" id="condigital-header">
      {/* Top Banner with Brand Logo and Main Tabs - Match theme perfectly */}
      <div className="mx-auto px-6 h-16 flex items-center justify-between border-b border-slate-100">
        {/* Brand Logo - ConDigital Green & Blue representation */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Elegant SVG isometric cube representing the ConDigital logo */}
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#0052cc" fill="#0052cc" fillOpacity="0.1" />
              <path d="M2 17l10 5 10-5" stroke="#00b894" />
              <path d="M2 12l10 5 10-5" stroke="#0052cc" />
              <path d="M12 22V12" stroke="#0052cc" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight font-display">
            ConDigital
          </span>
        </div>

        {/* Global Navigation - Ant Design Menu mode="horizontal" */}
        <div className="hidden xl:block flex-1 max-w-4xl px-8">
          <Menu
            mode="horizontal"
            selectedKeys={[currentTab]}
            onClick={(info) => setCurrentTab(info.key)}
            className="border-none text-[13px] font-semibold text-slate-605"
            style={{ borderBottom: 'none' }}
            items={menuItems.map((item) => ({
              key: item.name,
              label: item.name,
            }))}
          />
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 relative cursor-pointer">
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            <Bell size={18} />
          </button>

          {/* User profile dropdown representing "NT" with "1" pending action as shown in Screenshot 2 */}
          <div className="flex items-center space-x-3 border-l border-slate-100 pl-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-blue-800 text-white font-sans text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm ring-2 ring-blue-100">
                  NT
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  1
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-none">Nahom T.</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">nahom@condigital.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub tabs navigation seamlessly below top brand header */}

      {/* Procurement Sub Navigation Tab list block - EXACT replica of Screenshot 3 / 4 via AntD Menu */}
      <div className="bg-white border-b border-slate-200 px-6">
        <Menu
          mode="horizontal"
          selectedKeys={[activeSubTab]}
          onClick={(info) => setActiveSubTab(info.key)}
          className="text-[13px] font-semibold border-none"
          style={{ borderBottom: 'none' }}
          items={subTabs.map((tab) => ({
            key: tab,
            label: tab,
          }))}
        />
      </div>
    </header>
  );
}
