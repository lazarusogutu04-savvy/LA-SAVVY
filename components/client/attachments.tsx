"use client";
import { useRef, useState } from "react";
import { Check, Paperclip, UploadCloud } from "lucide-react";

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/*,.pdf,.doc,.docx";

/** Shopping list / documents: dashed gold drop zone, max 5 files, 10MB each. */
export function Attachments({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (f.size > MAX_BYTES) {
        setError(`${f.name} is larger than 10MB`);
        continue;
      }
      if (!/^image\//.test(f.type) && !/\.(pdf|docx?|png|jpe?g)$/i.test(f.name)) {
        setError(`${f.name}: only PNG, JPG, PDF, DOC files`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError("Max 5 files");
        break;
      }
      next.push(f);
    }
    onChange(next);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-ink">
          <Paperclip className="mr-1 inline h-4 w-4 text-gold-600" />
          Attach shopping list / documents (optional)
        </p>
        <p className="text-xs text-muted">Photos of list, receipts, prescription...</p>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-card border-2 border-dashed border-[#C4A77D] p-4 text-center transition-colors ${drag ? "bg-gold-100" : "bg-white hover:bg-gold-100/50"}`}
      >
        <UploadCloud className="mx-auto h-7 w-7 text-gold-600" />
        <p className="mt-1 text-sm font-semibold text-jungle">Click to upload or drag &amp; drop</p>
        <p className="text-xs text-muted">PNG, JPG, PDF up to 10MB each • Max 5 files</p>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => add(e.target.files)} />
      </div>
      {error && <p className="text-xs font-medium text-maroon">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-btn bg-mint px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-jungle">
                <Check className="h-4 w-4 shrink-0 text-[#2E9D4F]" />
                <span className="truncate">{f.name}</span>
              </span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="shrink-0 text-xs font-semibold text-maroon underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted">💊 For medicines, attach the prescription.</p>
    </div>
  );
}
