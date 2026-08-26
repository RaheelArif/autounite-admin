'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Promise-based replacement for window.confirm / prompt / alert.
 *
 * Browser dialogs freeze the page, ignore the admin theme, and cannot express a
 * required reason or a destructive-action warning. Call sites stay as short as
 * the native ones: `if (!(await dialog.confirm({...}))) return;`
 *
 * Usage:
 *   const dialog = useDialog();
 *   ...
 *   return (<> ...page... {dialog.node} </>);
 */
export function useDialog() {
  const [config, setConfig] = useState(null);
  const [value, setValue] = useState('');
  const resolve = useRef(null);
  const inputRef = useRef(null);

  const ask = useCallback((next) => {
    setValue(next.defaultValue || '');
    setConfig(next);
    return new Promise((done) => {
      resolve.current = done;
    });
  }, []);

  const settle = useCallback((answer) => {
    setConfig(null);
    setValue('');
    const done = resolve.current;
    resolve.current = null;
    if (done) done(answer);
  }, []);

  useEffect(() => {
    if (!config) return undefined;
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') settle(config.kind === 'confirm' ? false : null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config, settle]);

  const confirm = useCallback((options) => ask({ ...options, kind: 'confirm' }), [ask]);
  const prompt = useCallback((options) => ask({ ...options, kind: 'prompt' }), [ask]);
  const notice = useCallback((options) => ask({ ...options, kind: 'notice' }), [ask]);

  const node = config ? (
    <DialogView
      config={config}
      value={value}
      onValueChange={setValue}
      onCancel={() => settle(config.kind === 'confirm' ? false : null)}
      onSubmit={() => {
        if (config.kind === 'confirm') return settle(true);
        if (config.kind === 'notice') return settle(undefined);
        return settle(value.trim());
      }}
      inputRef={inputRef}
    />
  ) : null;

  return { confirm, prompt, notice, node };
}

function DialogView({ config, value, onValueChange, onCancel, onSubmit, inputRef }) {
  const {
    kind,
    title,
    message,
    items,
    label,
    placeholder,
    required,
    inputType = 'text',
    confirmLabel,
    cancelLabel = 'Cancel',
    tone,
    // A destructive action can require the exact name to be typed back.
    confirmText,
  } = config;

  const typed = value.trim();
  const blocked =
    (kind === 'prompt' && required && !typed) || (kind === 'confirm' && confirmText && typed !== confirmText);
  const danger = tone === 'danger';

  const submit = (event) => {
    event.preventDefault();
    if (!blocked) onSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <form onSubmit={submit} className="au-dash-modal w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[rgba(255,255,255,0.1)]">
          <h3 className="au-dash-card-title">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg au-dash-text-subtle hover:au-dash-text hover:au-dash-badge"
            aria-label="Close"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {message ? <p className="text-sm au-dash-text-muted leading-relaxed">{message}</p> : null}

          {items?.length ? (
            <ul className="space-y-1 text-sm au-dash-text">
              {items.map((item, index) => (
                <li key={index} className="au-dash-badge px-2 py-1 rounded">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {kind === 'prompt' || confirmText ? (
            <label className="block space-y-1">
              {label ? <span className="text-xs au-dash-text-subtle">{label}</span> : null}
              {inputType === 'textarea' ? (
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                  placeholder={placeholder}
                  className="au-dash-input min-h-[90px]"
                />
              ) : (
                <input
                  ref={inputRef}
                  type={inputType}
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                  placeholder={placeholder}
                  className="au-dash-input"
                />
              )}
            </label>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-[rgba(255,255,255,0.1)]">
          {kind === 'notice' ? null : (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-lg au-dash-badge au-dash-text-muted text-sm"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={blocked}
            className={
              danger
                ? 'px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm disabled:opacity-40'
                : 'au-dash-btn text-sm disabled:opacity-40'
            }
          >
            {confirmLabel || (kind === 'notice' ? 'Close' : 'Confirm')}
          </button>
        </div>
      </form>
    </div>
  );
}
