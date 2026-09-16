import React, { useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Highlighter, 
  Quote, 
  Minus, 
  RotateCcw, 
  RotateCw, 
  RemoveFormatting,
  Type
} from 'lucide-react';

interface WordRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
}

export const WordRichTextEditor: React.FC<WordRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type meeting details here...',
  minHeight = '180px',
  label,
  required = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Initialize editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const highlightColors = [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Sky', color: '#bae6fd' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'None', color: 'transparent' }
  ];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-maroon focus-within:ring-1 focus-within:ring-maroon">
        
        {/* Word Level Formatting Toolbar */}
        <div className="bg-gray-100/90 border-b border-gray-200 p-1.5 flex flex-wrap items-center gap-1 text-gray-700 text-xs select-none">
          
          {/* Headings / Block Types */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Heading 1"
              onClick={() => executeCommand('formatBlock', '<h1>')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue font-bold text-[11px] px-1.5"
            >
              H1
            </button>
            <button
              type="button"
              title="Heading 2"
              onClick={() => executeCommand('formatBlock', '<h2>')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue font-bold text-[11px] px-1.5"
            >
              H2
            </button>
            <button
              type="button"
              title="Heading 3"
              onClick={() => executeCommand('formatBlock', '<h3>')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue font-bold text-[11px] px-1.5"
            >
              H3
            </button>
            <button
              type="button"
              title="Paragraph / Normal Text"
              onClick={() => executeCommand('formatBlock', '<p>')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue font-bold text-[11px] px-1.5"
            >
              P
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Text Formatting */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Bold (Ctrl+B)"
              onClick={() => executeCommand('bold')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic (Ctrl+I)"
              onClick={() => executeCommand('italic')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Underline (Ctrl+U)"
              onClick={() => executeCommand('underline')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Strikethrough"
              onClick={() => executeCommand('strikeThrough')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Alignment */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Align Left"
              onClick={() => executeCommand('justifyLeft')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Align Center"
              onClick={() => executeCommand('justifyCenter')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Align Right"
              onClick={() => executeCommand('justifyRight')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Justify"
              onClick={() => executeCommand('justifyFull')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Lists & Quotes */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Bulleted List"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Numbered List"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Blockquote"
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Horizontal Line Divider"
              onClick={() => executeCommand('insertHorizontalRule')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Text Highlight Pickers */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs space-x-1 px-1">
            <Highlighter className="w-3.5 h-3.5 text-gray-500" />
            {highlightColors.map((c) => (
              <button
                key={c.name}
                type="button"
                title={`Highlight ${c.name}`}
                onClick={() => executeCommand('hiliteColor', c.color)}
                className="w-3.5 h-3.5 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: c.color === 'transparent' ? '#ffffff' : c.color }}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5" />

          {/* Actions */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Undo"
              onClick={() => executeCommand('undo')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Redo"
              onClick={() => executeCommand('redo')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Clear Formatting"
              onClick={() => executeCommand('removeFormat')}
              className="p-1 hover:bg-gray-100 rounded text-gray-700 hover:text-darkblue"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Word Document Canvas */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="p-4 focus:outline-none text-xs text-gray-800 leading-relaxed overflow-y-auto font-sans prose prose-sm max-w-none prose-headings:text-darkblue prose-headings:font-bold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />

      </div>
    </div>
  );
};
