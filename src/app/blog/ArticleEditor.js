'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { getBlogMedia } from '@/lib/blog';
import { htmlToSections, parsePastedPackage, preservedBlocks, sectionsToHtml } from '@/lib/blogEditorDoc';

/** Same rule the publish gate applies, so a bad link is caught while typing. */
function validHref(href) {
  const value = String(href || '').trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return /^https?:\/\//i.test(value) ? value : '';
}

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-40 ${
        active ? 'bg-white/25 au-dash-text-strong' : 'au-dash-tab au-dash-text-muted'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Article body editor. Paste from Word/Docs/ChatGPT keeps its structure, and the
 * source links the copy needs are placed inline on the exact phrase.
 */
export default function ArticleEditor({ value, onChange, onPackageDetected }) {
  const [initial] = useState(() => ({
    html: sectionsToHtml(value),
    preserved: preservedBlocks(value),
  }));
  const [media, setMedia] = useState([]);
  const [imported, setImported] = useState(null);
  // handlePaste and transformPastedHTML both see the same clipboard HTML; parse it once.
  const lastPaste = useRef({ html: '', parsed: null });

  const parsePaste = useCallback((html) => {
    if (lastPaste.current.html !== html) {
      lastPaste.current = { html, parsed: parsePastedPackage(html) };
    }
    return lastPaste.current.parsed;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // H1/H2 open a section; H3 is a subheading inside one.
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer' },
        },
      }),
      ImageExtension.configure({ inline: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: initial.html,
    editorProps: {
      attributes: { class: 'au-editor__content' },
      transformPastedHTML: (html) => parsePaste(html).html,
      // Read the package's admin tables before the paste is trimmed down to body copy.
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData('text/html');
        if (!html) return false;
        const parsed = parsePaste(html);
        setImported(parsed);
        if (onPackageDetected) onPackageDetected(parsed);
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(htmlToSections(instance.getHTML(), initial.preserved));
    },
  });

  useEffect(() => {
    let cancelled = false;
    getBlogMedia({ page: 1, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.media || []).filter((row) => row.approved === true && row.rights_status === 'cleared');
        setMedia(rows);
      })
      .catch(() => setMedia([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (editor.state.selection.empty) {
      window.alert('Select the words you want to link first.');
      return;
    }
    const previous = editor.getAttributes('link').href || '';
    const input = window.prompt('Link URL (https://… or /blog/…). Leave empty to remove.', previous);
    if (input === null) return;
    if (!input.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const href = validHref(input);
    if (!href) {
      window.alert('Use a full https:// URL or a site path starting with /');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }, [editor]);

  const insertImage = useCallback(
    (url) => {
      if (!editor || !url) return;
      const row = media.find((item) => item.url === url);
      const alt = row?.alt || window.prompt('Alt text for this image:') || '';
      editor.chain().focus().setImage({ src: url, alt }).run();
    },
    [editor, media],
  );

  const summary = useMemo(() => {
    const sections = Array.isArray(value) ? value : [];
    const links = sections
      .flatMap((section) => section.blocks || [])
      .flatMap((block) => block.text_runs || [])
      .filter((run) => run?.href).length;
    return { sections: sections.length, links, labels: sections.map((section) => section.label) };
  }, [value]);

  if (!editor) {
    return <div className="au-dash-card p-4 au-dash-text-subtle">Loading editor…</div>;
  }

  return (
    <div className="au-editor">
      <div className="au-editor__toolbar">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Section heading"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Subheading"
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          I
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullets"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Pull quote"
        >
          Quote
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          Table
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link (select text first)">
          Link
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          Clear
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          Redo
        </ToolbarButton>
        <select
          value=""
          onChange={(e) => {
            const url = e.target.value === '__custom' ? window.prompt('Image URL:') : e.target.value;
            insertImage(url);
            e.target.value = '';
          }}
          className="au-dash-input !min-h-0 py-1 text-xs w-40"
          title="Insert image"
        >
          <option value="">Insert image…</option>
          {media.map((row) => (
            <option key={row._id} value={row.url}>
              {row.alt || row.url}
            </option>
          ))}
          <option value="__custom">Custom URL…</option>
        </select>
      </div>

      <EditorContent editor={editor} />

      <p className="text-xs au-dash-text-subtle mt-2">
        Paste the whole article package from Word, Google Docs or ChatGPT — headings, lists, quotes, tables and links
        carry over, and each H2 becomes a section. The header table fills the fields above, “Decide First” and “Admin
        source records” are lifted into their own modules, and everything from the admin tables onwards is left out of
        the public copy. Detected: {summary.sections} sections, {summary.links} inline links.
        {initial.preserved.size > 0
          ? ` ${initial.preserved.size} module block group(s) (sources, related, Decide First) are preserved and edited outside this box.`
          : ''}
      </p>

      {imported && (
        <div className="text-xs au-dash-text-subtle mt-2 space-y-0.5">
          <span className="block au-dash-text-muted">From the pasted package:</span>
          <div>Header fields: {Object.keys(imported.meta).length || 'none'}</div>
          <div>Decide First: {imported.decideFirst ? 'captured' : 'not found'}</div>
          <div>Source records: {imported.sources.length}</div>
          {imported.meta.distribution && (
            <div>
              Distribution links found ({Object.keys(imported.meta.distribution).join(', ')}) — add them in the
              Distribution tab once the article is published.
            </div>
          )}
          {(imported.meta.heroFile || imported.meta.socialImageFile) && (
            <div>
              Image files named in the package ({[imported.meta.heroFile, imported.meta.socialImageFile]
                .filter(Boolean)
                .join(', ')}) — upload them in the Media tab and pick the approved URL above.
            </div>
          )}
        </div>
      )}

      {summary.labels.length > 0 && (
        <div className="text-xs au-dash-text-subtle mt-2">
          {/* A pasted pull quote can look like a heading. Listing the sections makes a
              wrong one obvious here instead of after publishing. */}
          <span className="block mb-1">Sections detected (these become On This Page — fix any that are not real headings):</span>
          <ol className="list-decimal list-inside space-y-0.5">
            {summary.labels.map((label, index) => (
              <li key={`${label}-${index}`}>{label}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
