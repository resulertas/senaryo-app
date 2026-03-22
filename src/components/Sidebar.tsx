import React, { useState } from 'react';
import { ChevronLeft, List, GripVertical } from 'lucide-react';
import { ScreenplayElement } from '../types';

interface SidebarProps {
  elements: ScreenplayElement[];
  setFocusedId: (id: string) => void;
  theme: 'dark' | 'light';
  onReorderScenes: (sourceId: string, targetId: string) => void;
}

export default function Sidebar({ elements, setFocusedId, theme, onReorderScenes }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const scenes = elements.filter(e => e.type === 'scene');

  const bgClass = theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-slate-100 border-slate-300';
  const textClass = theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200';
  const headerClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (draggedId && draggedId !== targetId) {
      onReorderScenes(draggedId, targetId);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className={`border-r flex flex-col overflow-y-auto shrink-0 hidden md:flex no-print transition-all duration-300 ${isOpen ? 'w-64' : 'w-12'} ${bgClass}`}>
      <div className={`p-3 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} border-b border-slate-700/50`}>
        {isOpen && <h3 className={`text-xs font-bold tracking-wider ${headerClass}`}>SAHNELER</h3>}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 rounded ${textClass}`}
          title={isOpen ? "Paneli Gizle" : "Sahneleri Göster"}
        >
          {isOpen ? <ChevronLeft size={16} /> : <List size={16} />}
        </button>
      </div>
      {isOpen && (
        <div className="p-4 space-y-1">
          {scenes.map((scene, index) => (
            <div 
              key={scene.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, scene.id)}
              onDragEnd={handleDragEnd}
              onClick={() => setFocusedId(scene.id)}
              className={`px-3 py-2 rounded text-sm cursor-pointer truncate flex items-center gap-2 ${textClass} 
                ${draggedId === scene.id ? 'opacity-50' : ''} 
                ${dragOverId === scene.id ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent'}
              `}
            >
              <GripVertical size={14} className="opacity-30 shrink-0" />
              <span className="truncate">{scene.sceneNumber}. {scene.content || 'YENİ SAHNE'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
