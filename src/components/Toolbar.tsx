import React, { useState } from 'react';
import { FolderOpen, Save, Type, Globe, RefreshCw, Mic, ChevronDown, Trash2, Sun, Moon, ZoomIn, ZoomOut, Undo2, Redo2, FileUp, Bold, Italic } from 'lucide-react';
import { ScreenplayFormat, ElementType } from '../types';

interface ToolbarProps {
  format: ScreenplayFormat;
  setFormat: (format: ScreenplayFormat) => void;
  onClearAll: () => void;
  onOpen: () => void;
  onExportPDF: () => void;
  onExportRTF: () => void;
  onExportDOCX: () => void;
  isListening: boolean;
  toggleListening: () => void;
  changeCurrentElementType: (type: ElementType) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  handleStyleChange: (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Toolbar({ 
  format, setFormat, onClearAll, onOpen, onExportPDF, onExportRTF, onExportDOCX, 
  isListening, toggleListening, changeCurrentElementType,
  theme, setTheme, fontFamily, fontSize, fontColor, handleStyleChange,
  onUndo, onRedo, canUndo, canRedo
}: ToolbarProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const elementTypes: { label: string, type: ElementType }[] = [
    { label: 'Sahne', type: 'scene' },
    { label: 'Eylem', type: 'action' },
    { label: 'Karakter', type: 'character' },
    { label: 'Diyalog', type: 'dialogue' },
    { label: 'Parantez', type: 'parenthetical' },
    { label: 'Geçiş', type: 'transition' }
  ];

  const bgClass = theme === 'dark' ? 'bg-[#1e293b] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700';
  const btnHover = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200';
  const inputBg = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white';

  return (
    <div className={`relative z-50 flex items-center px-4 py-2 border-b text-sm flex-wrap gap-y-2 no-print ${bgClass}`}>
      <div className="flex items-center space-x-2 mr-6 shrink-0">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`flex flex-col items-center justify-center p-2 rounded ${canUndo ? btnHover : 'opacity-50 cursor-not-allowed'}`}
          title="Geri Al (Ctrl+Z)"
        >
          <Undo2 size={18} className="mb-1" />
          <span className="text-[10px] font-medium">GERİ AL</span>
        </button>
        <button 
          onClick={onRedo} 
          disabled={!canRedo}
          className={`flex flex-col items-center justify-center p-2 rounded ${canRedo ? btnHover : 'opacity-50 cursor-not-allowed'}`}
          title="İleri Al (Ctrl+Y)"
        >
          <Redo2 size={18} className="mb-1" />
          <span className="text-[10px] font-medium">İLERİ AL</span>
        </button>
        <div className={`h-8 w-px mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('bold')} 
          className={`flex flex-col items-center justify-center p-2 rounded ${btnHover}`}
          title="Kalın (Ctrl+B)"
        >
          <Bold size={18} className="mb-1" />
          <span className="text-[10px] font-medium">KALIN</span>
        </button>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand('italic')} 
          className={`flex flex-col items-center justify-center p-2 rounded ${btnHover}`}
          title="İtalik (Ctrl+I)"
        >
          <Italic size={18} className="mb-1" />
          <span className="text-[10px] font-medium">İTALİK</span>
        </button>
        <div className={`h-8 w-px mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
        <button onClick={onClearAll} className={`flex flex-col items-center justify-center p-2 rounded text-red-500 ${btnHover}`}>
          <Trash2 size={18} className="mb-1" />
          <span className="text-[10px] font-medium">TEMİZLE</span>
        </button>
        <button onClick={onOpen} className={`flex flex-col items-center justify-center p-2 rounded text-amber-500 ${btnHover}`}>
          <FileUp size={18} className="mb-1" />
          <span className="text-[10px] font-medium">AÇ</span>
        </button>
        <button onClick={onExportDOCX} className={`flex flex-col items-center justify-center p-2 rounded text-emerald-500 ${btnHover}`}>
          <Save size={18} className="mb-1" />
          <span className="text-[10px] font-medium">KAYDET</span>
        </button>
        <div className="relative z-50">
          <button 
            onClick={() => setIsExportOpen(!isExportOpen)} 
            className={`flex flex-col items-center justify-center p-2 rounded text-blue-500 ${btnHover}`}
          >
            <FolderOpen size={18} className="mb-1" />
            <span className="text-[10px] font-medium">DIŞA AKTAR</span>
          </button>
          {isExportOpen && (
            <div className={`absolute top-full left-0 mt-1 w-32 border rounded shadow-xl z-50 ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
              <button onClick={() => { onExportPDF(); setIsExportOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs ${btnHover}`}>PDF Olarak</button>
              <button onClick={() => { onExportRTF(); setIsExportOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs ${btnHover}`}>RTF Olarak</button>
              <button onClick={() => { onExportDOCX(); setIsExportOpen(false); }} className={`block w-full text-left px-4 py-2 text-xs ${btnHover}`}>DOCX Olarak</button>
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center space-x-1 p-1 rounded-md mr-6 shrink-0 ${inputBg}`}>
        {elementTypes.map((item) => (
          <button 
            key={item.type} 
            onClick={() => changeCurrentElementType(item.type)}
            className={`px-3 py-1.5 rounded transition-colors ${btnHover}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-3 mr-6 shrink-0">
        <select 
          value={fontFamily} 
          onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
          className={`rounded-md px-2 py-1.5 outline-none cursor-pointer ${inputBg}`}
        >
          <option value="Courier Prime">Courier Prime</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Helvetica">Helvetica</option>
        </select>
        
        <div className={`flex items-center rounded-md px-1 py-1 ${inputBg}`}>
          <button onClick={() => handleStyleChange('fontSize', Math.max(8, fontSize - 1))} className={`px-2 rounded ${btnHover}`}>-</button>
          <span className="px-2 w-8 text-center">{fontSize}</span>
          <button onClick={() => handleStyleChange('fontSize', Math.min(36, fontSize + 1))} className={`px-2 rounded ${btnHover}`}>+</button>
        </div>

        <div className={`flex items-center rounded-md p-1 ${inputBg}`} title="Yazı Rengi">
          <input 
            type="color" 
            value={fontColor || (theme === 'dark' ? '#e2e8f0' : '#0f172a')} 
            onChange={(e) => handleStyleChange('fontColor', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-auto shrink-0">
        <button 
          className={`flex flex-col items-center justify-center p-2 rounded ${btnHover}`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Tema Değiştir"
        >
          {theme === 'dark' ? <Sun size={18} className="mb-1" /> : <Moon size={18} className="mb-1" />}
          <span className="text-[10px] font-medium">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
        </button>

        <button 
          className={`flex flex-col items-center justify-center p-2 rounded ${btnHover}`}
          onClick={() => setFormat(format === 'US' ? 'FR' : 'US')}
        >
          <Globe size={18} className="mb-1" />
          <span className="text-[10px] font-medium">{format} / {format === 'US' ? 'FR' : 'US'}</span>
        </button>
        
        <button 
          onClick={toggleListening}
          className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ml-2 transition-colors ${isListening ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          <Mic size={16} className="mr-2" />
          {isListening ? 'Dinleniyor...' : 'Dikte'}
        </button>
      </div>
    </div>
  );
}
