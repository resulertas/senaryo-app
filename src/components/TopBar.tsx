import { Share2, User, Minus, Plus, Hexagon } from 'lucide-react';
import { ScreenplayElement } from '../types';

interface TopBarProps {
  elements: ScreenplayElement[];
  theme: 'dark' | 'light';
  zoom: number;
  setZoom: (zoom: number) => void;
}

export default function TopBar({ elements, theme, zoom, setZoom }: TopBarProps) {
  const wordCount = elements.reduce((acc, el) => acc + el.content.split(/\s+/).filter(Boolean).length, 0);
  const pageCount = Math.max(1, Math.ceil(elements.length / 45));

  const bgClass = theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-slate-100 border-slate-300';
  const textClass = theme === 'dark' ? 'text-slate-300' : 'text-slate-800';
  const inputBg = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white';
  const btnHover = theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900';

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b no-print flex-wrap gap-y-2 ${bgClass}`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-blue-500 font-bold text-xl">
          <Hexagon className="mr-2 text-yellow-500 fill-yellow-500/20" size={24} /> ScriptHive
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className={`flex items-center rounded-md px-2 py-1 ${inputBg}`}>
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className={`p-1 ${btnHover}`}><Minus size={16} /></button>
          <span className="px-3 text-sm">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className={`p-1 ${btnHover}`}><Plus size={16} /></button>
        </div>
        
        <div className="text-sm text-slate-500 hidden md:block">
          Kelime Sayısı: <span className={`font-medium ${textClass}`}>{wordCount}</span>
        </div>
        <div className="text-sm text-slate-500 hidden md:block">
          Sayfa: <span className={`font-medium ${textClass}`}>{pageCount} / {pageCount}</span>
        </div>
      </div>
    </div>
  );
}
