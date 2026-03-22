import { History, MessageSquare, Type, Settings, HelpCircle } from 'lucide-react';

export default function RightSidebar({ theme }: { theme: 'dark' | 'light' }) {
  const bgClass = theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-slate-100 border-slate-300';
  const btnClass = theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200';

  return (
    <div className={`w-16 border-l flex flex-col items-center py-4 space-y-6 shrink-0 hidden sm:flex no-print ${bgClass}`}>
      <button className={`p-2 rounded-lg transition-colors ${btnClass}`}>
        <History size={20} />
      </button>
      <button className={`p-2 rounded-lg transition-colors ${btnClass}`}>
        <MessageSquare size={20} />
      </button>
      <button className={`p-2 rounded-lg transition-colors ${btnClass}`}>
        <Type size={20} />
      </button>
      
      <div className="flex-1"></div>
      
      <button className={`p-2 rounded-lg transition-colors ${btnClass}`}>
        <Settings size={20} />
      </button>
      <button className={`p-2 rounded-lg transition-colors ${btnClass}`}>
        <HelpCircle size={20} />
      </button>
    </div>
  );
}
