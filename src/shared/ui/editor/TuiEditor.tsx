import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface EditorField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'tags';
  placeholder?: string;
  required?: boolean;
}

export interface EditorData {
  [key: string]: string;
}

interface TuiEditorProps {
  title: string;
  fields: EditorField[];
  onSave: (data: EditorData) => void;
  onCancel: () => void;
  initialData?: EditorData;
}

/**
 * TUI-style editor component (nano-like interface)
 * Displays keybindings at bottom for ease of use
 */
const TuiEditor: React.FC<TuiEditorProps> = ({
  title,
  fields,
  onSave,
  onCancel,
  initialData = {},
}) => {
  const [data, setData] = useState<EditorData>(() => {
    const initial: EditorData = {};
    fields.forEach(f => {
      initial[f.name] = initialData[f.name] || '';
    });
    return initial;
  });
  const [activeField, setActiveField] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRefs = useRef<(HTMLTextAreaElement | HTMLInputElement | null)[]>([]);

  // Focus active field
  useEffect(() => {
    textareaRefs.current[activeField]?.focus();
  }, [activeField]);

  const handleChange = useCallback((name: string, value: string) => {
    setData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Validate required fields
      const missingRequired = fields.filter(f => f.required && !data[f.name]?.trim());
      if (missingRequired.length > 0) {
        alert(`Please fill in: ${missingRequired.map(f => f.label).join(', ')}`);
        return;
      }
      onSave(data);
    }
    // Ctrl+X to cancel/exit
    if (e.ctrlKey && e.key === 'x') {
      e.preventDefault();
      if (hasChanges) {
        if (confirm('Discard unsaved changes?')) {
          onCancel();
        }
      } else {
        onCancel();
      }
    }
    // Ctrl+Down or Tab to next field
    if ((e.ctrlKey && e.key === 'ArrowDown') || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setActiveField(prev => Math.min(fields.length - 1, prev + 1));
    }
    // Ctrl+Up or Shift+Tab to prev field
    if ((e.ctrlKey && e.key === 'ArrowUp') || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setActiveField(prev => Math.max(0, prev - 1));
    }
  }, [data, fields, hasChanges, onCancel, onSave]);

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--term-background)', color: 'var(--term-foreground)' }}
      onKeyDown={handleKeyDown}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          TUI Editor - {title}
        </span>
        <span style={{ color: 'var(--term-muted)' }}>
          {hasChanges ? '[Modified]' : '[Saved]'}
        </span>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1"
          >
            <label
              className="block text-sm font-medium"
              style={{ color: index === activeField ? 'var(--term-primary)' : 'var(--term-muted)' }}
            >
              {field.label}
              {field.required && <span style={{ color: 'var(--term-error)' }}> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                ref={el => textareaRefs.current[index] = el}
                value={data[field.name]}
                onChange={e => handleChange(field.name, e.target.value)}
                onFocus={() => setActiveField(index)}
                placeholder={field.placeholder}
                rows={10}
                className="w-full p-2 font-mono text-sm resize-none outline-none"
                style={{
                  backgroundColor: 'var(--term-background)',
                  color: 'var(--term-foreground)',
                  border: `1px solid ${index === activeField ? 'var(--term-primary)' : 'var(--term-border)'}`,
                }}
                spellCheck={false}
              />
            ) : (
              <input
                ref={el => textareaRefs.current[index] = el}
                type="text"
                value={data[field.name]}
                onChange={e => handleChange(field.name, e.target.value)}
                onFocus={() => setActiveField(index)}
                placeholder={field.placeholder}
                className="w-full p-2 font-mono text-sm outline-none"
                style={{
                  backgroundColor: 'var(--term-background)',
                  color: 'var(--term-foreground)',
                  border: `1px solid ${index === activeField ? 'var(--term-primary)' : 'var(--term-border)'}`,
                }}
                spellCheck={false}
              />
            )}
            {field.type === 'tags' && (
              <p className="text-xs" style={{ color: 'var(--term-muted)' }}>
                Separate tags with commas
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Keybindings bar (nano-style) */}
      <div
        className="border-t px-2 py-1"
        style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            <span style={{ color: 'var(--term-primary)' }}>^S</span>
            <span style={{ color: 'var(--term-muted)' }}> Save</span>
          </span>
          <span>
            <span style={{ color: 'var(--term-primary)' }}>^X</span>
            <span style={{ color: 'var(--term-muted)' }}> Exit</span>
          </span>
          <span>
            <span style={{ color: 'var(--term-primary)' }}>Tab</span>
            <span style={{ color: 'var(--term-muted)' }}> Next Field</span>
          </span>
          <span>
            <span style={{ color: 'var(--term-primary)' }}>Shift+Tab</span>
            <span style={{ color: 'var(--term-muted)' }}> Prev Field</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TuiEditor;


