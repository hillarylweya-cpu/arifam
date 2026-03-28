import React from 'react';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ClipboardList, 
  Map as MapIcon, 
  TrendingUp, 
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Sprout,
  ShieldCheck,
  Plane
} from 'lucide-react';
import AnimatedCursor from './AnimatedCursor';

interface LayoutProps {
  children: React.ReactNode;
  profile: UserProfile | null;
  onLogout: () => void;
}

export function Layout({ children, profile, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', roles: ['Farmer', 'Admin', 'Drone Operator'] },
    { icon: MessageSquare, label: 'AI Assistant', roles: ['Farmer'] },
    { icon: ClipboardList, label: 'Service Requests', roles: ['Farmer', 'Admin'] },
    { icon: MapIcon, label: 'My Fields', roles: ['Farmer'] },
    { icon: TrendingUp, label: 'Market Prices', roles: ['Farmer', 'Admin'] },
    { icon: Plane, label: 'Drone Fleet', roles: ['Admin', 'Drone Operator'] },
    { icon: User, label: 'Farmers', roles: ['Admin'] },
    { icon: ShieldCheck, label: 'Integrations', roles: ['Admin'] },
  ];

  const filteredNav = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      <AnimatedCursor enabled={profile?.settings?.animatedCursor ?? true} />
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-600" />
          <span className="font-bold text-stone-900">AgriFarm</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-stone-600">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 flex flex-col
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-stone-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="font-bold text-xl text-stone-900">AgriFarm</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNav.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors font-medium text-sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold">
              {profile?.displayName?.[0] || profile?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-stone-500 truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
