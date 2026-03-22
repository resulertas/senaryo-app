import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ScreenplayElement, ScreenplayFormat, ElementType, CoverPageData } from '../types';

interface EditorProps {
  elements: ScreenplayElement[];
  format: ScreenplayFormat;
  onChange: (id: string, content: string) => void;
  onAdd: (afterId: string, type: ElementType, initialContent?: string) => void;
  onRemove: (id: string, focusId: string) => void;
  onRemoveMultiple: (ids: string[], focusId: string) => void;
  onChangeType: (id: string, type: ElementType) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>, id: string, index: number) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  characters: string[];
  scenes: string[];
  theme: 'dark' | 'light';
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  zoom: number;
  coverPage?: CoverPageData;
  setCoverPage?: (data: CoverPageData) => void;
}

export default function Editor({ 
  elements, format, onChange, onAdd, onRemove, onRemoveMultiple, onChangeType, onPaste,
  focusedId, setFocusedId, characters, scenes, theme, fontFamily, fontSize, fontColor, zoom,
  coverPage, setCoverPage
}: EditorProps) {
  const inputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const wrapperRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [numPages, setNumPages] = useState(1);
  const [pageBreaks, setPageBreaks] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [dismissedSuggestionsId, setDismissedSuggestionsId] = useState<string | null>(null);

  useEffect(() => {
    setSuggestionIndex(0);
    setDismissedSuggestionsId(null);
  }, [focusedId]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setIsDragging(false);
      setDragStartId(null);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey && focusedId) {
      const startIndex = elements.findIndex(el => el.id === focusedId);
      const currentIndex = elements.findIndex(el => el.id === id);
      if (startIndex !== -1 && currentIndex !== -1) {
        const min = Math.min(startIndex, currentIndex);
        const max = Math.max(startIndex, currentIndex);
        const newSelectedIds = elements.slice(min, max + 1).map(el => el.id);
        setSelectedIds(newSelectedIds);
      }
    } else {
      setIsDragging(true);
      setDragStartId(id);
      setSelectedIds([id]);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, id: string) => {
    if (isDragging && dragStartId) {
      const startIndex = elements.findIndex(el => el.id === dragStartId);
      const currentIndex = elements.findIndex(el => el.id === id);
      if (startIndex !== -1 && currentIndex !== -1) {
        const min = Math.min(startIndex, currentIndex);
        const max = Math.max(startIndex, currentIndex);
        const newSelectedIds = elements.slice(min, max + 1).map(el => el.id);
        setSelectedIds(newSelectedIds);
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    setIsDragging(false);
    setDragStartId(null);
  };

  useEffect(() => {
    if (focusedId && inputRefs.current[focusedId]) {
      const el = inputRefs.current[focusedId];
      el?.focus();
      // Move cursor to end for contentEditable
      if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [focusedId]);

  useLayoutEffect(() => {
    const PAGE_HEIGHT = 1123; // A4 height at 96dpi (297mm)
    const BOTTOM_MARGIN = 96; // 1 inch bottom padding
    const USABLE_HEIGHT = PAGE_HEIGHT - BOTTOM_MARGIN;
    
    // 1. Reset all classes
    elements.forEach(el => {
      const node = wrapperRefs.current[el.id];
      if (node) {
        node.classList.remove('print-page-break', 'visual-page-break');
        node.style.removeProperty('--visual-mt');
        node.style.removeProperty('--print-mt');
      }
    });

    // 2. Read all heights (single reflow)
    const metrics = elements.map(el => {
      const node = wrapperRefs.current[el.id];
      if (!node) return { height: 0, mt: 0, mb: 0 };
      const style = window.getComputedStyle(node);
      return {
        height: node.offsetHeight,
        mt: parseFloat(style.marginTop) || 0,
        mb: parseFloat(style.marginBottom) || 0
      };
    });

    // 3. Calculate pages without mutating DOM margins
    let currentY = 96; // 1 inch top padding
    let pages = 1;
    const newPageBreaks: Record<string, number> = {};

    if (coverPage) {
      currentY += PAGE_HEIGHT;
      pages++;
    }

    if (elements.length > 0) {
      newPageBreaks[elements[0].id] = coverPage ? 2 : 1;
      if (coverPage) {
        const node = wrapperRefs.current[elements[0].id];
        if (node) {
          node.classList.add('print-page-break');
          const mt = metrics[0]?.mt || 0;
          node.style.setProperty('--print-mt', `${96 + mt}px`);
        }
      }
    }

    elements.forEach((el, i) => {
      const { height, mt, mb } = metrics[i];
      const totalElHeight = height + mt + mb;
      
      const pageTopY = coverPage ? (pages - 1) * PAGE_HEIGHT : (pages - 1) * PAGE_HEIGHT;
      const relativeY = currentY - pageTopY;
      
      if (relativeY + totalElHeight > USABLE_HEIGHT && i > 0) {
        pages++;
        newPageBreaks[el.id] = pages;
        const node = wrapperRefs.current[el.id];
        if (node) {
          node.classList.add('print-page-break', 'visual-page-break');
          const jump = (pages - 1) * PAGE_HEIGHT + 96 - currentY;
          node.style.setProperty('--visual-mt', `${jump + mt}px`);
          node.style.setProperty('--print-mt', `${96 + mt}px`);
        }
        currentY = (pages - 1) * PAGE_HEIGHT + 96; // Jump to new page top margin
      }
      currentY += totalElHeight;
    });
    
    setNumPages(Math.max(pages, Math.ceil(currentY / PAGE_HEIGHT)));
    setPageBreaks(newPageBreaks);
  }, [elements, format, zoom, coverPage]);

  const handleInput = (content: string, id: string) => {
    if (dismissedSuggestionsId === id) {
      setDismissedSuggestionsId(null);
    }
    onChange(id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number, element: ScreenplayElement) => {
    const plainContent = element.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    const matchingChars = element.type === 'character' && plainContent 
      ? characters.filter(c => c.toLowerCase().startsWith(plainContent.toLowerCase()) && c !== plainContent)
      : [];
    const matchingScenes = element.type === 'scene' && plainContent
      ? scenes.filter(s => s.toLowerCase().startsWith(plainContent.toLowerCase()) && s !== plainContent)
      : [];
    const currentSuggestions = dismissedSuggestionsId === element.id ? [] : (matchingChars.length > 0 ? matchingChars : matchingScenes);

    if (e.key === 'Escape' && currentSuggestions.length > 0) {
      e.preventDefault();
      setDismissedSuggestionsId(element.id);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const cycle: ElementType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
      const nextIndex = (cycle.indexOf(element.type) + 1) % cycle.length;
      onChangeType(element.id, cycle[nextIndex]);
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow default behavior (insert newline)
        return;
      }
      e.preventDefault();
      
      if (currentSuggestions.length > 0) {
         const selected = currentSuggestions[suggestionIndex] || currentSuggestions[0];
         onChange(element.id, selected);
         onAdd(element.id, matchingChars.length > 0 ? 'dialogue' : 'action');
         return;
      }

      let textBeforeCursor = element.content;
      let textAfterCursor = '';

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Extract text after cursor
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.currentTarget);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        
        const div = document.createElement('div');
        div.appendChild(postCaretRange.cloneContents());
        textAfterCursor = div.innerHTML;

        // Extract text before cursor
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.currentTarget);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        const div2 = document.createElement('div');
        div2.appendChild(preCaretRange.cloneContents());
        textBeforeCursor = div2.innerHTML;
      }

      // Update current element with text before cursor
      if (textBeforeCursor !== element.content) {
        onChange(element.id, textBeforeCursor);
      }

      let nextType: ElementType = 'action';
      if (element.type === 'character') nextType = 'dialogue';
      else if (element.type === 'dialogue') nextType = 'character';
      else if (element.type === 'scene') nextType = 'action';
      else if (element.type === 'transition') nextType = 'scene';
      else if (element.type === 'parenthetical') nextType = 'dialogue';

      onAdd(element.id, nextType, textAfterCursor);
    } else if (selectedIds.length > 1 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onChange(selectedIds[0], e.key);
      onRemoveMultiple(selectedIds.slice(1), selectedIds[0]);
      setSelectedIds([]);
      
      setTimeout(() => {
        const el = inputRefs.current[selectedIds[0]];
        if (el) {
          el.focus();
          if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 0);
      return;
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedIds.length > 1) {
        e.preventDefault();
        const firstSelectedIndex = elements.findIndex(el => el.id === selectedIds[0]);
        const focusId = firstSelectedIndex > 0 ? elements[firstSelectedIndex - 1].id : (elements.length > selectedIds.length ? elements[selectedIds.length].id : '');
        
        if (elements.length === selectedIds.length) {
          onChange(selectedIds[0], '');
          onRemoveMultiple(selectedIds.slice(1), selectedIds[0]);
        } else {
          onRemoveMultiple(selectedIds, focusId);
        }
        setSelectedIds([]);
        return;
      }

      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(e.currentTarget);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          
          if (preCaretRange.toString().length === 0) {
            e.preventDefault();
            if (index > 0) {
              const prevElement = elements[index - 1];
              const currentContent = element.content === '<br>' ? '' : element.content;
              const prevContent = prevElement.content === '<br>' ? '' : prevElement.content;
              const newContent = prevContent + currentContent;
              
              onChange(prevElement.id, newContent);
              onRemove(element.id, prevElement.id);
              
              // Focus previous element and set cursor to the merge point
              setTimeout(() => {
                const el = inputRefs.current[prevElement.id];
                if (el) {
                  el.focus();
                  // Try to set cursor to the end of the previous content
                  if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false); // Default to end
                    
                    // If we merged text, we ideally want to put the cursor exactly where the merge happened.
                    // For simplicity, putting it at the end of the merged text is usually acceptable,
                    // but since we are pressing backspace, the user expects the cursor at the merge point.
                    // We'll just let it go to the end for now, or if currentContent is empty, it goes to the end of prevContent.
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                }
              }, 0);
            }
          }
        }
      } else if (e.key === 'Delete') {
        const sel = window.getSelection();
        if (sel && sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const postCaretRange = range.cloneRange();
          postCaretRange.selectNodeContents(e.currentTarget);
          postCaretRange.setStart(range.endContainer, range.endOffset);
          
          if (postCaretRange.toString().length === 0) {
            e.preventDefault();
            if (index < elements.length - 1) {
              const nextElement = elements[index + 1];
              const currentContent = element.content === '<br>' ? '' : element.content;
              const nextContent = nextElement.content === '<br>' ? '' : nextElement.content;
              const newContent = currentContent + nextContent;
              
              onChange(element.id, newContent);
              onRemove(nextElement.id, element.id);
            }
          }
        }
      }
    } else if (e.key === 'ArrowDown' && currentSuggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(s => Math.min(s + 1, currentSuggestions.length - 1));
    } else if (e.key === 'ArrowUp' && currentSuggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(s => Math.max(s - 1, 0));
    } else if (e.key === 'ArrowDown' && e.shiftKey) {
      // Shift+ArrowDown
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.currentTarget);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        
        if (postCaretRange.toString().length === 0) {
          e.preventDefault();
          if (index < elements.length - 1) {
            const nextId = elements[index + 1].id;
            if (selectedIds.length === 0) {
              setSelectedIds([element.id, nextId]);
            } else if (!selectedIds.includes(nextId)) {
              setSelectedIds([...selectedIds, nextId]);
            }
            setFocusedId(nextId);
          }
        }
      }
    } else if (e.key === 'ArrowUp' && e.shiftKey) {
      // Shift+ArrowUp
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.currentTarget);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        if (preCaretRange.toString().length === 0) {
          e.preventDefault();
          if (index > 0) {
            const prevId = elements[index - 1].id;
            if (selectedIds.length === 0) {
              setSelectedIds([prevId, element.id]);
            } else if (!selectedIds.includes(prevId)) {
              setSelectedIds([prevId, ...selectedIds]);
            }
            setFocusedId(prevId);
          }
        }
      }
    } else if (!e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
      }
    }
  };

  const getStyle = (type: ElementType, format: ScreenplayFormat) => {
    const placeholderColor = theme === 'dark' ? 'placeholder-slate-600' : 'placeholder-slate-400';
    const base = `bg-transparent outline-none resize-none overflow-hidden block leading-[1.2] whitespace-pre-wrap break-words ${placeholderColor}`;
    
    if (format === 'US') {
      switch (type) {
        case 'scene': return `${base} w-full font-bold uppercase mt-6`;
        case 'action': return `${base} w-full mt-2`;
        case 'character': return `${base} uppercase mt-4 w-[60%] ml-[36.6%] font-bold`;
        case 'dialogue': return `${base} w-[58.3%] ml-[16.6%]`;
        case 'parenthetical': return `${base} w-[33.3%] ml-[26.6%] italic`;
        case 'transition': return `${base} w-full uppercase mt-4 text-right`;
        default: return `${base} w-full`;
      }
    } else {
      // FR Format: Action left, Dialogue right
      switch (type) {
        case 'scene': return `${base} w-full font-bold uppercase mt-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} pb-1`;
        case 'action': return `${base} mt-2 w-[45%]`;
        case 'character': return `${base} uppercase mt-4 w-[45%] ml-[50%] font-bold`;
        case 'dialogue': return `${base} w-[45%] ml-[50%]`;
        case 'parenthetical': return `${base} w-[45%] ml-[50%] italic`;
        case 'transition': return `${base} w-full uppercase mt-4 text-right`;
        default: return `${base} w-full`;
      }
    }
  };

  const getPlaceholder = (type: ElementType) => {
    switch(type) {
      case 'scene': return 'SAHNE BAŞLIĞI';
      case 'action': return 'Eylem...';
      case 'character': return 'KARAKTER';
      case 'dialogue': return 'Diyalog...';
      case 'parenthetical': return '(parantez içi)';
      case 'transition': return 'KESME:';
      default: return '';
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-200';
  const paperClass = theme === 'dark' ? 'bg-[#162032] shadow-2xl' : 'bg-white shadow-xl';
  const defaultTextColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';

  return (
    <div className={`flex-1 overflow-y-auto flex justify-center p-4 md:p-8 ${bgClass}`} id="print-area-container">
      <div 
        id="print-area" 
        className={`w-[794px] max-w-none relative shrink-0`}
        style={{ 
          transform: `scale(${zoom / 100})`, 
          transformOrigin: 'top center', 
          transition: 'transform 0.2s ease', 
          marginBottom: `${(zoom / 100 - 1) * (numPages * 1123)}px`,
          minHeight: `${numPages * 1123}px`
        }}
      >
        <div className="absolute inset-0 z-0 flex flex-col pointer-events-none no-print" style={{ gap: '0px' }}>
          {Array.from({ length: numPages }).map((_, i) => (
            <div key={i} className={`w-full h-[1123px] relative shrink-0 ${paperClass} border-b border-dashed ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
              {i > 0 && (
                <div 
                  className="absolute right-8 md:right-16 font-mono text-sm opacity-50"
                  style={{ top: '48px', fontFamily: 'Courier Prime, monospace' }}
                >
                  {i + (coverPage ? 0 : 1)}.
                </div>
              )}
            </div>
          ))}
        </div>

        <div 
          className="relative z-10 w-full pt-[96px] print:pb-0"
          style={{
            paddingLeft: format === 'US' ? '144px' : '120px',
            paddingRight: '96px',
          }}
        >
          {coverPage && (
            <div className="w-full flex flex-col items-center justify-center h-[931px] mb-[192px]">
              <div className="flex-1 flex flex-col items-center justify-center w-full space-y-8">
                <input
                  type="text"
                  value={coverPage.title}
                  onChange={(e) => setCoverPage?.({ ...coverPage, title: e.target.value })}
                  className="w-full text-center bg-transparent outline-none font-bold uppercase print:text-black"
                  style={{ fontSize: '20pt', fontFamily }}
                  placeholder="SENARYO ADI"
                />
                <input
                  type="text"
                  value={coverPage.author}
                  onChange={(e) => setCoverPage?.({ ...coverPage, author: e.target.value })}
                  className="w-full text-center bg-transparent outline-none print:text-black"
                  style={{ fontSize: '15pt', fontFamily }}
                  placeholder="Yazar adı"
                />
              </div>
              <div className="w-full flex flex-col items-end px-12 pb-12 space-y-1">
                <input
                  type="text"
                  value={coverPage.version}
                  onChange={(e) => setCoverPage?.({ ...coverPage, version: e.target.value })}
                  className="bg-transparent outline-none w-48 text-right print:text-black"
                  style={{ fontSize: '12pt', fontFamily }}
                  placeholder="v.01."
                />
                <input
                  type="text"
                  value={coverPage.date}
                  onChange={(e) => setCoverPage?.({ ...coverPage, date: e.target.value })}
                  className="bg-transparent outline-none w-48 text-right print:text-black"
                  style={{ fontSize: '12pt', fontFamily }}
                  placeholder="Tarih"
                />
              </div>
            </div>
          )}
          {elements.map((el, index) => {
            const plainContent = el.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            const matchingChars = el.type === 'character' && plainContent && focusedId === el.id
              ? characters.filter(c => c.toLowerCase().startsWith(plainContent.toLowerCase()) && c !== plainContent)
              : [];
            const matchingScenes = el.type === 'scene' && plainContent && focusedId === el.id
              ? scenes.filter(s => s.toLowerCase().startsWith(plainContent.toLowerCase()) && s !== plainContent)
              : [];
            const currentSuggestions = dismissedSuggestionsId === el.id ? [] : (matchingChars.length > 0 ? matchingChars : matchingScenes);
            const safeSuggestionIndex = Math.min(suggestionIndex, Math.max(0, currentSuggestions.length - 1));

            const suggestionMargin = format === 'US' ? 'ml-[40%]' : 'ml-[50%]';
            const elFontFamily = el.fontFamily || fontFamily;
            const elFontSize = el.fontSize || fontSize;
            const elFontColor = el.fontColor || fontColor || defaultTextColor;
            const pageNum = pageBreaks[el.id];
            const displayPageNum = coverPage && pageNum ? pageNum - 1 : pageNum;

            return (
              <div 
                key={el.id} 
                className="relative group flow-root"
                ref={ref => { wrapperRefs.current[el.id] = ref; }}
              >
                {displayPageNum > 0 && (
                  <div 
                    className="absolute right-0 font-mono text-sm hidden print:block print:text-black"
                    style={{ 
                      top: '-48px',
                      fontFamily: elFontFamily 
                    }}
                  >
                    {displayPageNum}.
                  </div>
                )}
                {el.type === 'scene' && (
                  <span 
                    className="absolute -left-12 top-6 font-mono font-bold hidden md:inline print:inline select-none opacity-50 print:opacity-100 print:text-black leading-[1.2]"
                    style={{ fontFamily: elFontFamily, fontSize: `${elFontSize}pt`, color: elFontColor }}
                  >
                    {el.sceneNumber}.
                  </span>
                )}
                <ContentBlock
                  el={el}
                  inputRef={ref => {
                    inputRefs.current[el.id] = ref;
                  }}
                  onChange={(content) => handleInput(content, el.id)}
                  onKeyDown={(e) => handleKeyDown(e, index, el)}
                  onPaste={(e) => onPaste(e, el.id, index)}
                  onFocus={() => setFocusedId(el.id)}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onMouseEnter={(e) => handleMouseEnter(e, el.id)}
                  onMouseUp={handleMouseUp}
                  isSelected={selectedIds.includes(el.id)}
                  placeholder={getPlaceholder(el.type)}
                  className={`${getStyle(el.type, format)} print-break-${el.type}`}
                  style={{ 
                    fontFamily: elFontFamily, 
                    fontSize: `${elFontSize}pt`, 
                    color: elFontColor 
                  }}
                  dataType={el.type}
                />
                
                {currentSuggestions.length > 0 && (
                  <div className={`absolute z-10 w-48 border rounded shadow-lg mt-1 ${matchingChars.length > 0 ? suggestionMargin : ''} ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}>
                    {currentSuggestions.map((c, i) => (
                      <div 
                        key={c} 
                        className={`px-3 py-1 text-sm cursor-pointer ${i === safeSuggestionIndex ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100')}`}
                        onClick={() => {
                          onChange(el.id, c);
                          onAdd(el.id, matchingChars.length > 0 ? 'dialogue' : 'action');
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ContentBlockProps {
  el: ScreenplayElement;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className: string;
  style: React.CSSProperties;
  placeholder: string;
  inputRef: (ref: HTMLDivElement | null) => void;
  dataType?: string;
  isSelected?: boolean;
}

function ContentBlock({ el, onChange, onKeyDown, onPaste, onFocus, onMouseDown, onMouseEnter, onMouseUp, className, style, placeholder, inputRef, dataType, isSelected }: ContentBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== el.content) {
      ref.current.innerHTML = el.content;
    }
  }, [el.content]);

  return (
    <div
      ref={(r) => {
        ref.current = r;
        inputRef(r);
      }}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => {
        if (e.currentTarget.innerHTML !== el.content) {
          onChange(e.currentTarget.innerHTML);
        }
      }}
      onBlur={(e) => {
        if (e.currentTarget.innerHTML !== el.content) {
          onChange(e.currentTarget.innerHTML);
        }
      }}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={onFocus}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      className={`${className} ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 outline-none print:bg-transparent' : ''}`}
      style={style}
      data-placeholder={placeholder}
      data-type={dataType}
    />
  );
}
