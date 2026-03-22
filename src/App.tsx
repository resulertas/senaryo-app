/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import TopBar from './components/TopBar';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import { ScreenplayElement, ScreenplayFormat, ElementType, CoverPageData } from './types';

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const initialElements: ScreenplayElement[] = [
  { id: generateId(), type: 'scene', content: 'İÇ. BAR - GECE' },
  { id: generateId(), type: 'action', content: 'Mekan loş. Sigara dumanı havada asılı kalmış. MURAT (30) barın köşesinde tek başına oturuyor. Önündeki bardak yarım. Kapı açılır, soğuk rüzgar içeri dalar.' },
  { id: generateId(), type: 'character', content: 'MURAT' },
  { id: generateId(), type: 'parenthetical', content: '(Kendi kendine, fısıltıyla) Neden hep en zor olanı seçeriz ki?' },
  { id: generateId(), type: 'action', content: 'SELIN içeri girer. Üzerindeki palto sırılsıklam. Murat\'ı fark eder ama bakışlarını kaçırır. Tezgaha doğru yürür.' },
  { id: generateId(), type: 'character', content: 'SELIN' },
  { id: generateId(), type: 'dialogue', content: 'Gelmeni beklemiyordum.' },
  { id: generateId(), type: 'scene', content: 'DIŞ. SOKAK - GECE' },
  { id: generateId(), type: 'action', content: 'Yağmur şiddetini artırır. Sokak lambaları titrek bir ışık saçar. Uzaktan bir siren sesi duyulur.' },
  { id: generateId(), type: 'character', content: 'MURAT' },
  { id: generateId(), type: 'dialogue', content: 'Biliyorum. Ama buradayım işte.' },
  { id: generateId(), type: 'transition', content: 'SAHNE SONU' },
];

const parseTextToElements = (text: string): ScreenplayElement[] => {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const elements: ScreenplayElement[] = [];
  let lastType: ElementType = 'action';
  
  for (const line of lines) {
    if (!line) {
      lastType = 'action';
      continue;
    }
    
    let type: ElementType = 'action';
    const upperLine = line.toLocaleUpperCase('tr-TR');
    if (line.match(/^(\d+\.\s*)?(İÇ\.|DIŞ\.|EXT\.|INT\.)/i)) {
      type = 'scene';
    } else if (line.match(/^(KESME:|GEÇİŞ:|CUT TO:|FADE OUT\.)/i)) {
      type = 'transition';
    } else if (line.startsWith('(') && line.endsWith(')')) {
      type = 'parenthetical';
    } else if (line === upperLine && line.length < 60 && !line.match(/^\d+$/)) {
      type = 'character';
    } else if (lastType === 'character' || lastType === 'parenthetical' || lastType === 'dialogue') {
      type = 'dialogue';
    }
    lastType = type;
    
    let content = line;
    if (type === 'scene') {
      content = content.replace(/^\d+\.\s*/, '');
    }
    
    elements.push({ id: generateId(), type, content });
  }
  
  return elements;
};

export default function App() {
  const [format, setFormat] = useState<ScreenplayFormat>('US');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontFamily, setFontFamily] = useState<string>('Courier Prime');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontColor, setFontColor] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  
  const [elements, setElements] = useState<ScreenplayElement[]>(() => {
    const saved = localStorage.getItem('scriptHive_elements');
    if (saved) return JSON.parse(saved);
    return initialElements;
  });
  const [coverPage, setCoverPage] = useState<CoverPageData>(() => {
    const saved = localStorage.getItem('scriptHive_coverPage');
    if (saved) return JSON.parse(saved);
    return {
      title: 'SENARYO ADI',
      author: 'Yazar adı',
      version: 'v.01.',
      date: new Date().toLocaleDateString('tr-TR')
    };
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const [history, setHistory] = useState<ScreenplayElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedo = React.useRef(false);
  const [docxFileHandle, setDocxFileHandle] = useState<any>(null);
  const [rtfFileHandle, setRtfFileHandle] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        if (JSON.stringify(newHistory[newHistory.length - 1]) !== JSON.stringify(elements)) {
          setHistoryIndex(newHistory.length);
          return [...newHistory, elements];
        }
        return newHistory;
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [elements, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const numberedElements = useMemo(() => {
    let count = 0;
    return elements.map(el => {
      if (el.type === 'scene') {
        count++;
        return { ...el, sceneNumber: count };
      }
      return el;
    });
  }, [elements]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const characters = useMemo(() => {
    const chars = elements.filter(e => e.type === 'character').map(e => stripHtml(e.content));
    return Array.from(new Set(chars)).filter(Boolean);
  }, [elements]);

  const scenes = useMemo(() => {
    const scns = elements.filter(e => e.type === 'scene').map(e => stripHtml(e.content));
    return Array.from(new Set(scns)).filter(Boolean);
  }, [elements]);

  useEffect(() => {
    localStorage.setItem('scriptHive_elements', JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    localStorage.setItem('scriptHive_coverPage', JSON.stringify(coverPage));
  }, [coverPage]);

  const handleElementChange = (id: string, content: string) => {
    setElements(els => els.map(e => e.id === id ? { ...e, content } : e));
  };

  const handleStyleChange = (prop: 'fontFamily' | 'fontSize' | 'fontColor', value: any) => {
    if (focusedId) {
      setElements(els => els.map(e => e.id === focusedId ? { ...e, [prop]: value } : e));
    } else {
      if (prop === 'fontFamily') setFontFamily(value);
      if (prop === 'fontSize') setFontSize(value);
      if (prop === 'fontColor') setFontColor(value);
    }
  };

  const handleAddElement = (afterId: string, type: ElementType, initialContent: string = '') => {
    const newId = generateId();
    setElements(els => {
      const index = els.findIndex(e => e.id === afterId);
      const newElements = [...els];
      newElements.splice(index + 1, 0, { id: newId, type, content: initialContent });
      return newElements;
    });
    setFocusedId(newId);
  };

  const handleRemoveElement = (id: string, focusId: string) => {
    setElements(els => els.filter(e => e.id !== id));
    setFocusedId(focusId);
  };

  const handleRemoveElements = (ids: string[], focusId: string) => {
    setElements(els => els.filter(e => !ids.includes(e.id)));
    setFocusedId(focusId);
  };

  const handleReorderScenes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setElements(els => {
      const sourceIndex = els.findIndex(e => e.id === sourceId);
      const targetIndex = els.findIndex(e => e.id === targetId);
      
      if (sourceIndex === -1 || targetIndex === -1) return els;

      // Find the end of the source scene
      let sourceEndIndex = sourceIndex + 1;
      while (sourceEndIndex < els.length && els[sourceEndIndex].type !== 'scene') {
        sourceEndIndex++;
      }

      // Extract the source scene block
      const sceneBlock = els.slice(sourceIndex, sourceEndIndex);
      
      // Remove the source scene block from elements
      const newElements = els.filter((_, i) => i < sourceIndex || i >= sourceEndIndex);
      
      // Find the new target index in the modified array
      const newTargetIndex = newElements.findIndex(e => e.id === targetId);
      
      // Insert the scene block before the target scene
      newElements.splice(newTargetIndex, 0, ...sceneBlock);
      
      return newElements;
    });
  };

  const handleChangeType = (id: string, type: ElementType) => {
    setElements(els => els.map(e => e.id === id ? { ...e, type } : e));
  };

  const changeCurrentElementType = (type: ElementType) => {
    if (focusedId) {
      handleChangeType(focusedId, type);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm senaryoyu silmek istediğinize emin misiniz?')) {
      const newId = generateId();
      setElements([{ id: newId, type: 'scene', content: '' }]);
      setFocusedId(newId);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleOpenDOCX = () => {
    fileInputRef.current?.click();
  };

  const handleFileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    let newElements: ScreenplayElement[] = [];

    try {
      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        // @ts-ignore
        const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join('\n');
          fullText += pageText + '\n';
        }
        newElements = parseTextToElements(fullText);
      } else if (extension === 'docx') {
        const text = await file.text();
        if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE html')) {
          // It's actually an HTML file renamed to .docx
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const divs = doc.querySelectorAll('div');
          
          divs.forEach(div => {
            const type = div.className as ElementType;
            if (['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'].includes(type)) {
              let content = div.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
              if (type === 'scene') {
                content = content.replace(/^\d+\.\s*/, '');
              }
              newElements.push({
                id: generateId(),
                type,
                content
              });
            }
          });

          if (newElements.length === 0) {
            const docCopy = doc.cloneNode(true) as Document;
            docCopy.querySelectorAll('style, script').forEach(el => el.remove());
            const bodyText = docCopy.body?.innerText || docCopy.body?.textContent || '';
            newElements = parseTextToElements(bodyText);
          }
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });
          newElements = parseTextToElements(result.value);
        }
      } else if (extension === 'txt' || extension === 'rtf') {
        // Basic text reading for txt and rtf
        const text = await file.text();
        // Very basic RTF stripping if it's RTF
        const cleanText = extension === 'rtf' ? text.replace(/{\\[^}]+}/g, '').replace(/\\[a-z]+\d*\s?/g, '') : text;
        newElements = parseTextToElements(cleanText);
      } else if (extension === 'doc' || extension === 'html') {
        // Our exported .doc is actually HTML
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const divs = doc.querySelectorAll('div');
        
        divs.forEach(div => {
          const type = div.className as ElementType;
          if (['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'].includes(type)) {
            let content = div.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
            if (type === 'scene') {
              content = content.replace(/^\d+\.\s*/, '');
            }
            newElements.push({
              id: generateId(),
              type,
              content
            });
          }
        });

        // Fallback if it's a real binary .doc (which we can't parse easily)
        if (newElements.length === 0) {
          // Remove style and script tags before getting text content
          const docCopy = doc.cloneNode(true) as Document;
          docCopy.querySelectorAll('style, script').forEach(el => el.remove());
          const bodyText = docCopy.body?.innerText || docCopy.body?.textContent || '';
          newElements = parseTextToElements(bodyText);
        }
      }

      if (newElements.length > 0) {
        setElements(newElements);
        setFocusedId(newElements[0].id);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Dosya açılırken bir hata oluştu. Lütfen geçerli bir format seçin.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportDOCX = async () => {
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Senaryo</title>
    <style>
      @page WordSection1 {
        size: 21cm 29.7cm;
        margin: 2.54cm 2.54cm 2.54cm 3.81cm;
      }
      div.WordSection1 { page: WordSection1; }
      body { font-family: 'Courier Prime', Courier, monospace; font-size: 12pt; }
      .scene { font-weight: bold; text-transform: uppercase; margin-top: 24pt; margin-bottom: 0; }
      .action { margin-top: 12pt; margin-bottom: 0; }
      .character { text-align: center; font-weight: bold; text-transform: uppercase; margin-top: 12pt; margin-bottom: 0; width: 60%; margin-left: 20%; }
      .dialogue { text-align: center; width: 60%; margin-left: 20%; margin-top: 0; margin-bottom: 0; }
      .parenthetical { text-align: center; font-style: italic; width: 60%; margin-left: 20%; margin-top: 0; margin-bottom: 0; }
      .transition { text-align: right; text-transform: uppercase; margin-top: 12pt; margin-bottom: 0; }
      .cover-page { text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; }
      .cover-title { font-size: 20pt; font-weight: bold; text-transform: uppercase; margin-bottom: 24pt; }
      .cover-author { font-size: 15pt; margin-bottom: 48pt; }
      .cover-footer { display: flex; justify-content: space-between; font-size: 12pt; margin-top: 100pt; }
    </style>
    </head><body><div class="WordSection1">`;
    
    const hasCoverPageData = coverPage && (coverPage.title.trim() || coverPage.author.trim() || coverPage.version.trim() || coverPage.date.trim());
    if (hasCoverPageData) {
      html += `
        <div class="cover-page">
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <div class="cover-title">${coverPage.title}</div>
          <div class="cover-author">${coverPage.author}</div>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <div class="cover-footer">
            <span>${coverPage.version}</span>
            <span style="float: right;">${coverPage.date}</span>
          </div>
        </div>
        <br clear=all style='mso-special-character:line-break;page-break-before:always'>
      `;
    }
    
    numberedElements.forEach(e => {
      const textContent = e.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
      if (!textContent) return; // Skip empty elements
      let text = e.content.replace(/\n/g, '<br>');
      if (e.type === 'scene' && e.sceneNumber) {
        text = `${e.sceneNumber}. ${text}`;
      }
      html += `<div class="${e.type}">${text}</div>`;
    });
    
    html += `</div></body></html>`;
    
    try {
      if ('showSaveFilePicker' in window) {
        let handle = docxFileHandle;
        if (!handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: 'senaryo.doc',
            types: [{
              description: 'Word Document',
              accept: { 'application/msword': ['.doc'] },
            }],
          });
          setDocxFileHandle(handle);
        }
        const writable = await handle.createWritable();
        await writable.write(new Blob(['\ufeff', html], { type: 'application/msword' }));
        await writable.close();
      } else {
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'senaryo.doc';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
      }
    }
  };

  const handleExportRTF = async () => {
    let rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033{\\fonttbl{\\f0\\fnil\\fcharset0 Courier Prime;}}\n';
    rtf += '{\\*\\generator ScriptHive;}\\viewkind4\\uc1 \n\\paperw11906\\paperh16838\\margl2160\\margr1440\\margt1440\\margb1440\n\\pard\\sa200\\sl276\\slmult1\\f0\\fs24\\lang9\n';
    
    const hasCoverPageData = coverPage && (coverPage.title.trim() || coverPage.author.trim() || coverPage.version.trim() || coverPage.date.trim());
    if (hasCoverPageData) {
      rtf += `\\qc\\b\\fs40 ${coverPage.title}\\b0\\fs24\\par\n\\par\n`;
      rtf += `\\qc\\fs30 ${coverPage.author}\\fs24\\par\n\\par\n\\par\n\\par\n\\par\n\\par\n\\par\n\\par\n`;
      rtf += `\\ql ${coverPage.version} \\qr ${coverPage.date}\\par\n\\page\n`;
    }
    
    numberedElements.forEach(e => {
      const textContent = e.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
      if (!textContent) return; // Skip empty elements
      let text = e.content.replace(/\n/g, '\\par\n');
      if (e.type === 'scene') {
        if (e.sceneNumber) text = `${e.sceneNumber}. ${text}`;
        rtf += `\\b ${text}\\b0\\par\n\\par\n`;
      } else if (e.type === 'character') {
        rtf += `\\qc\\b ${text}\\b0\\par\n`;
      } else if (e.type === 'dialogue') {
        rtf += `\\qc ${text}\\par\n\\par\n`;
      } else if (e.type === 'parenthetical') {
        rtf += `\\qc\\i ${text}\\i0\\par\n`;
      } else {
        rtf += `\\ql ${text}\\par\n\\par\n`;
      }
    });
    rtf += '}';
    
    try {
      if ('showSaveFilePicker' in window) {
        let handle = rtfFileHandle;
        if (!handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: 'senaryo.rtf',
            types: [{
              description: 'Rich Text Format',
              accept: { 'text/rtf': ['.rtf'] },
            }],
          });
          setRtfFileHandle(handle);
        }
        const writable = await handle.createWritable();
        await writable.write(rtf);
        await writable.close();
      } else {
        const blob = new Blob([rtf], { type: 'application/rtf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'senaryo.rtf';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportDOCX();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleClearAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        const printArea = document.getElementById('print-area');
        if (printArea) {
          const range = document.createRange();
          range.selectNodeContents(printArea);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete')) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const printArea = document.getElementById('print-area');
          if (printArea && printArea.contains(sel.anchorNode) && printArea.contains(sel.focusNode)) {
            const getEditableParent = (node: Node | null) => {
              let curr = node;
              while (curr && curr !== printArea) {
                if (curr instanceof HTMLElement && curr.getAttribute('contenteditable') === 'true') {
                  return curr;
                }
                curr = curr.parentNode;
              }
              return null;
            };
            const anchorEditable = getEditableParent(sel.anchorNode);
            const focusEditable = getEditableParent(sel.focusNode);
            
            if (anchorEditable !== focusEditable || (!anchorEditable && !focusEditable)) {
              e.preventDefault();
              if (e.key === 'Backspace' || e.key === 'Delete') {
                handleClearAll();
              }
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, history, historyIndex, docxFileHandle, rtfFileHandle]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (docxFileHandle) {
        handleExportDOCX();
      }
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [elements, docxFileHandle]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, id: string, index: number) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const html = e.clipboardData.getData('text/html');
    
    let textBeforeCursor = '';
    let textAfterCursor = '';
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      const postCaretRange = range.cloneRange();
      postCaretRange.selectNodeContents(e.currentTarget);
      postCaretRange.setStart(range.endContainer, range.endOffset);
      
      const div = document.createElement('div');
      div.appendChild(postCaretRange.cloneContents());
      textAfterCursor = div.innerHTML;

      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(e.currentTarget);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      
      const div2 = document.createElement('div');
      div2.appendChild(preCaretRange.cloneContents());
      textBeforeCursor = div2.innerHTML;
    } else {
      const el = elements.find(el => el.id === id);
      textBeforeCursor = el ? el.content : '';
    }

    let pastedElements: { type: ElementType, content: string }[] = [];
    
    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const blocks = doc.querySelectorAll('[data-type], .scene, .action, .character, .dialogue, .parenthetical, .transition');
      
      if (blocks.length > 1) {
        blocks.forEach(block => {
          let type = block.getAttribute('data-type') as ElementType;
          if (!type) {
            const className = block.className || '';
            if (className.includes('scene')) type = 'scene';
            else if (className.includes('action')) type = 'action';
            else if (className.includes('character')) type = 'character';
            else if (className.includes('dialogue')) type = 'dialogue';
            else if (className.includes('parenthetical')) type = 'parenthetical';
            else if (className.includes('transition')) type = 'transition';
          }
          if (type) {
            let content = block.innerHTML.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '');
            if (type === 'scene') {
              content = content.replace(/^\d+\.\s*/, '');
            }
            pastedElements.push({ type, content: content.trim() });
          }
        });
      }
    }

    if (pastedElements.length > 0) {
      const newElementsToInsert: ScreenplayElement[] = [];
      for (let i = 1; i < pastedElements.length; i++) {
        const p = pastedElements[i];
        const content = i === pastedElements.length - 1 ? p.content + textAfterCursor : p.content;
        newElementsToInsert.push({ id: generateId(), type: p.type, content });
      }
      
      setElements(els => {
        const newEls = [...els];
        const firstContent = pastedElements.length === 1 ? pastedElements[0].content + textAfterCursor : pastedElements[0].content;
        
        if (!textBeforeCursor.trim()) {
          newEls[index] = { ...newEls[index], type: pastedElements[0].type, content: firstContent };
        } else {
          newEls[index] = { ...newEls[index], content: textBeforeCursor + firstContent };
        }
        newEls.splice(index + 1, 0, ...newElementsToInsert);
        return newEls;
      });
      
      if (newElementsToInsert.length > 0) {
        setFocusedId(newElementsToInsert[newElementsToInsert.length - 1].id);
      }
      return;
    }

    if (!text.includes('\n')) {
      handleElementChange(id, textBeforeCursor + text + textAfterCursor);
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim());
    const newElementsToInsert: ScreenplayElement[] = [];
    let lastType: ElementType = elements[index].type;
    
    let firstLineType = lastType;
    let firstLineContent = lines[0];
    
    if (!textBeforeCursor.trim() && lines[0]) {
      const upperLine = lines[0].toLocaleUpperCase('tr-TR');
      if (lines[0].match(/^(\d+\.\s*)?(İÇ\.|DIŞ\.|EXT\.|INT\.)/i)) {
        firstLineType = 'scene';
        firstLineContent = lines[0].replace(/^\d+\.\s*/, '');
      } else if (lines[0].match(/^(KESME:|GEÇİŞ:|CUT TO:|FADE OUT\.)/i)) {
        firstLineType = 'transition';
      } else if (lines[0].startsWith('(') && lines[0].endsWith(')')) {
        firstLineType = 'parenthetical';
      } else if (lines[0] === upperLine && lines[0].length < 60 && !lines[0].match(/^\d+$/)) {
        firstLineType = 'character';
      }
      lastType = firstLineType;
    } else if (firstLineType === 'scene') {
      firstLineContent = lines[0].replace(/^\d+\.\s*/, '');
    }
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line && i !== lines.length - 1) {
        lastType = 'action';
        continue;
      }
      
      let type: ElementType = 'action';
      if (line) {
        const upperLine = line.toLocaleUpperCase('tr-TR');
        if (line.match(/^(\d+\.\s*)?(İÇ\.|DIŞ\.|EXT\.|INT\.)/i)) {
          type = 'scene';
        } else if (line.match(/^(KESME:|GEÇİŞ:|CUT TO:|FADE OUT\.)/i)) {
          type = 'transition';
        } else if (line.startsWith('(') && line.endsWith(')')) {
          type = 'parenthetical';
        } else if (line === upperLine && line.length < 60 && !line.match(/^\d+$/)) {
          type = 'character';
        } else if (lastType === 'character' || lastType === 'parenthetical' || lastType === 'dialogue') {
          type = 'dialogue';
        }
        lastType = type;
      } else {
        type = 'action';
      }
      
      let content = i === lines.length - 1 ? line + textAfterCursor : line;
      if (type === 'scene') {
        content = content.replace(/^\d+\.\s*/, '');
      }
      
      if (content || i === lines.length - 1) {
        newElementsToInsert.push({ id: generateId(), type, content });
      }
    }
    
    setElements(els => {
      const newEls = [...els];
      if (!textBeforeCursor.trim()) {
        newEls[index] = { ...newEls[index], type: firstLineType, content: firstLineContent };
      } else {
        newEls[index] = { ...newEls[index], content: textBeforeCursor + firstLineContent };
      }
      newEls.splice(index + 1, 0, ...newElementsToInsert);
      return newEls;
    });
    
    if (newElementsToInsert.length > 0) {
      setFocusedId(newElementsToInsert[newElementsToInsert.length - 1].id);
    }
  };

  const elementsRef = useRef(elements);
  const focusedIdRef = useRef(focusedId);

  useEffect(() => {
    elementsRef.current = elements;
    focusedIdRef.current = focusedId;
  }, [elements, focusedId]);

  useEffect(() => {
    let recognition: any = null;
    if (isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'tr-TR';

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          const currentFocusedId = focusedIdRef.current;
          const currentElements = elementsRef.current;
          
          if (transcript.toLowerCase() === 'geç' || transcript.toLowerCase() === 'geç.') {
            if (currentFocusedId) {
              const el = currentElements.find(e => e.id === currentFocusedId);
              if (el) {
                let nextType: ElementType = 'action';
                if (el.type === 'character') nextType = 'dialogue';
                else if (el.type === 'dialogue') nextType = 'character';
                else if (el.type === 'scene') nextType = 'action';
                else if (el.type === 'transition') nextType = 'scene';
                else if (el.type === 'parenthetical') nextType = 'dialogue';
                handleAddElement(currentFocusedId, nextType);
              }
            }
          } else if (currentFocusedId) {
            setElements(els => els.map(e => e.id === currentFocusedId ? { ...e, content: e.content + (e.content ? ' ' : '') + transcript } : e));
          }
        };

        recognition.start();
      } else {
        alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  const bgClass = theme === 'dark' ? 'bg-[#0f172a] text-slate-300' : 'bg-slate-200 text-slate-900';

  const focusedElement = elements.find(e => e.id === focusedId);
  const currentFontFamily = focusedElement?.fontFamily || fontFamily;
  const currentFontSize = focusedElement?.fontSize || fontSize;
  const currentFontColor = focusedElement?.fontColor || fontColor;

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${bgClass}`}>
      <input 
        type="file" 
        accept=".doc,.docx,.txt,.rtf,.pdf,.html" 
        ref={fileInputRef} 
        onChange={handleFileOpen} 
        className="hidden" 
      />
      <TopBar elements={numberedElements} theme={theme} zoom={zoom} setZoom={setZoom} />
      <Toolbar 
        format={format} 
        setFormat={setFormat} 
        onClearAll={handleClearAll}
        onOpen={handleOpenDOCX}
        onExportPDF={handleExportPDF}
        onExportDOCX={handleExportDOCX}
        onExportRTF={handleExportRTF}
        isListening={isListening}
        toggleListening={() => setIsListening(!isListening)}
        changeCurrentElementType={changeCurrentElementType}
        theme={theme}
        setTheme={setTheme}
        fontFamily={currentFontFamily}
        fontSize={currentFontSize}
        fontColor={currentFontColor}
        handleStyleChange={handleStyleChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          elements={numberedElements} 
          setFocusedId={setFocusedId} 
          theme={theme} 
          onReorderScenes={handleReorderScenes}
        />
        <Editor 
          elements={numberedElements} 
          format={format} 
          onChange={handleElementChange}
          onAdd={handleAddElement}
          onRemove={handleRemoveElement}
          onRemoveMultiple={handleRemoveElements}
          onChangeType={handleChangeType}
          onPaste={handlePaste}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          characters={characters}
          scenes={scenes}
          theme={theme}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontColor={fontColor}
          zoom={zoom}
          coverPage={coverPage}
          setCoverPage={setCoverPage}
        />
      </div>
      <StatusBar theme={theme} />
    </div>
  );
}
