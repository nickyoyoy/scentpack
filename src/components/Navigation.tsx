import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  TableProperties, 
  ClipboardCheck,
  LucideIcon
} from 'lucide-react';
import { ActiveTab } from '../types/fulfillment';

export interface NavigationProps {
  activeTab: ActiveTab | 'sop';
  onTabChange: (tab: ActiveTab | 'sop') => void;
  daysInMonth?: number;
}

interface TabItem {
  id: ActiveTab | 'sop';
  label: string;
  icon: LucideIcon;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, daysInMonth = 31 }) => {
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Ringkasan & Tren', icon: LayoutDashboard },
    { id: 'ekspedisi', label: 'Ekspedisi (18 Kurir)', icon: Truck },
    { id: 'staff', label: 'Produktivitas Staff', icon: Users },
    { id: 'matrix', label: `Spreadsheet Matrix (${daysInMonth} Hari)`, icon: TableProperties },
    { id: 'sop', label: 'SOP & Regulasi Gudang', icon: ClipboardCheck },
  ];

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

