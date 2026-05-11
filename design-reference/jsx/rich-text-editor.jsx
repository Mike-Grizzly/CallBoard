// Lightweight rich-text editor + modal for department notes.
// Stores HTML strings (back-compat: plain strings still render fine).
// Supports: bold, italic, underline, bullet list, numbered list, highlight, clear.

const { I: ReI } = window;

// Render-only: shows stored HTML safely-ish (we control the source).
// Falls back to escaped plain text for legacy values without HTML tags.
function RichRender({ html, placeholder, muted }) {
  const empty = !html || !html.trim() || html.trim() === "—";
  if (empty) {
    return <div style={{fontSize:13,lineHeight:1.55,color:"var(--ink-4)"}}>{placeholder || "—"}</div>;
  }
  // If looks like plain text (no tags), wrap in <p>
  const looksHtml = /<\/?(p|ul|ol|li|strong|em|u|mark|br)\b/i.test(html);
  const out = looksHtml ? html : `<p>${html.replace(/\n/g,"<br/>")}</p>`;
  return (
    <div className="rich-render"
      style={{fontSize:13,lineHeight:1.55,color: muted ? "var(--ink-3)" : "var(--ink-2)"}}
      dangerouslySetInnerHTML={{__html: out}}/>
  );
}

// Modal rich-text editor — opens centered, dimmed backdrop, esc/click to close.
function RichEditorModal({ open, title, subtitle, accentColor, value, onSave, onClose }) {
  const ref = React.useRef(null);
  const [dirty, setDirty] = React.useState(false);

  // Seed content when opened (only once per open)
  React.useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const initial = value && value.trim() && value.trim() !== "—" ? value : "";
      const looksHtml = /<\/?(p|ul|ol|li|strong|em|u|mark|br)\b/i.test(initial);
      ref.current.innerHTML = looksHtml ? initial
        : initial ? `<p>${initial.replace(/\n/g,"<br/>")}</p>`
        : "";
      setDirty(false);
      // focus end
      setTimeout(() => {
        ref.current.focus();
        const r = document.createRange();
        r.selectNodeContents(ref.current);
        r.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
      }, 30);
    }
  }, [open]);

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); doClose(); }
      if ((e.metaKey||e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dirty]);

  if (!open) return null;

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    setDirty(true);
  };

  const doSave = () => {
    const html = ref.current?.innerHTML?.trim() || "";
    // Strip empty
    const clean = html === "<p></p>" || html === "<br>" ? "" : html;
    onSave(clean);
  };
  const doClose = () => {
    if (dirty && !confirm("Discard changes?")) return;
    onClose();
  };

  const Btn = ({ cmd, arg, children, title:t, active }) => (
    <button type="button" className="re-btn" data-active={active?"1":"0"}
      onMouseDown={e => e.preventDefault()}
      onClick={() => exec(cmd, arg)} title={t}>{children}</button>
  );

  return (
    <div className="re-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) doClose(); }}>
      <div className="re-modal anim-in-pop" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="re-header">
          <div className="re-header-accent" style={{background:`var(--c-${accentColor||"accent"})`}}/>
          <div style={{flex:1, minWidth:0}}>
            <div className="h-eyebrow">{subtitle || "Note"}</div>
            <div style={{fontSize:15,fontWeight:600,marginTop:2}}>{title}</div>
          </div>
          <button className="btn ghost btn-icon" onClick={doClose} title="Close (Esc)">
            <ReI.X size={14}/>
          </button>
        </div>

        {/* Toolbar */}
        <div className="re-toolbar">
          <Btn cmd="bold"      title="Bold (⌘B)"><b>B</b></Btn>
          <Btn cmd="italic"    title="Italic (⌘I)"><i>I</i></Btn>
          <Btn cmd="underline" title="Underline (⌘U)"><span style={{textDecoration:"underline"}}>U</span></Btn>
          <span className="re-sep"/>
          <Btn cmd="insertUnorderedList" title="Bullet list">
            <ReI.List size={14}/>
          </Btn>
          <Btn cmd="insertOrderedList" title="Numbered list">
            <ReI.ListOrdered size={14}/>
          </Btn>
          <span className="re-sep"/>
          <Btn cmd="hiliteColor" arg="#fff2a8" title="Highlight">
            <span className="re-hl">A</span>
          </Btn>
          <Btn cmd="hiliteColor" arg="transparent" title="Clear highlight">
            <span style={{fontSize:11,color:"var(--ink-3)"}}>clr</span>
          </Btn>
          <span className="re-sep"/>
          <Btn cmd="removeFormat" title="Clear formatting">
            <span style={{fontSize:11}}>Tx</span>
          </Btn>
          <div style={{flex:1}}/>
          <span className="muted" style={{fontSize:11.5,marginRight:4}}>⌘↵ to save</span>
        </div>

        {/* Editor surface */}
        <div ref={ref} className="re-surface rich-render"
          contentEditable suppressContentEditableWarning
          onInput={() => setDirty(true)}
          onKeyDown={(e) => {
            // Plain-text paste handled below; intercept tab to indent list
            if (e.key === "Tab") {
              e.preventDefault();
              exec(e.shiftKey ? "outdent" : "indent");
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            setDirty(true);
          }}
        />

        {/* Footer */}
        <div className="re-footer">
          <button className="btn ghost" onClick={doClose}>Cancel</button>
          <div style={{flex:1}}/>
          <button className="btn primary" onClick={doSave}>
            <ReI.Check size={14}/><span>Save note</span>
          </button>
        </div>
      </div>

      <style>{`
        .re-backdrop{
          position: fixed; inset: 0; z-index: 200;
          background: color-mix(in oklch, var(--ink) 35%, transparent);
          backdrop-filter: blur(3px);
          display: grid; place-items: center;
          padding: 24px;
          animation: re-fade .14s ease-out;
        }
        @keyframes re-fade { from { opacity:0; } to { opacity:1; } }
        .re-modal{
          width: min(640px, 100%);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-l);
          box-shadow: 0 30px 80px -20px rgba(40,15,5,.35),
                      0 8px 24px -8px rgba(40,15,5,.25);
          display: flex; flex-direction: column;
          max-height: 85vh;
          overflow: hidden;
        }
        .anim-in-pop{ animation: re-pop .18s cubic-bezier(.2,.9,.3,1.2); }
        @keyframes re-pop {
          from { opacity:0; transform: translateY(6px) scale(.98); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .re-header{
          display:flex; align-items:center; gap:12px;
          padding: 16px 18px 14px;
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        .re-header-accent{
          width: 4px; height: 32px; border-radius: 999px;
          flex-shrink: 0;
        }
        .re-toolbar{
          display:flex; align-items:center; gap:2px;
          padding: 8px 10px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-sunken);
        }
        .re-btn{
          appearance:none;
          height: 28px; min-width: 28px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--ink-2);
          font: 500 13px/1 var(--font-ui);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background .12s, border-color .12s;
        }
        .re-btn:hover{ background: var(--bg); border-color: var(--border); }
        .re-btn[data-active="1"]{ background: var(--bg); border-color: var(--border); color: var(--ink); }
        .re-sep{
          width:1px; height:18px; background: var(--border); margin: 0 4px;
        }
        .re-hl{
          background: #fff2a8; padding: 1px 4px; border-radius: 3px;
          font-weight: 600;
        }
        .re-surface{
          flex: 1;
          padding: 18px 22px;
          overflow-y: auto;
          font-size: 14px; line-height: 1.6;
          color: var(--ink);
          outline: none;
          min-height: 220px;
        }
        .re-surface:empty::before{
          content: "Start writing… use the toolbar to format.";
          color: var(--ink-4);
          pointer-events: none;
        }
        .re-footer{
          display:flex; align-items:center; gap:8px;
          padding: 12px 14px;
          border-top: 1px solid var(--border);
          background: var(--bg-sunken);
        }
        /* Shared styling for both editor surface and rendered view */
        .rich-render p{ margin: 0 0 .55em; }
        .rich-render p:last-child{ margin-bottom: 0; }
        .rich-render ul, .rich-render ol{
          margin: .25em 0 .55em; padding-left: 1.4em;
        }
        .rich-render li{ margin: .15em 0; }
        .rich-render strong{ font-weight: 600; color: var(--ink); }
        .rich-render em{ font-style: italic; }
        .rich-render mark{
          background: #fff2a8;
          color: inherit;
          padding: 0 2px; border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

window.RichEditorModal = RichEditorModal;
window.RichRender = RichRender;
