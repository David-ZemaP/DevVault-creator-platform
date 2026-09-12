import { Button } from "@/components/ui/button";
import { FormField, inputClassName } from "@/components/ui/form-field";
import type { Draft, DraftErrors } from "@/features/demo/publishing";

export function PublicationEditor({ draft, errors, onChange, onReview }: { draft: Draft; errors: DraftErrors; onChange: (draft: Draft) => void; onReview: () => void }) {
  const accessibility = (id: keyof Draft) => ({ "aria-invalid": Boolean(errors[id]), "aria-describedby": `${id}-hint${errors[id] ? ` ${id}-error` : ""}` });
  return <form noValidate className="space-y-6" onSubmit={(e) => { e.preventDefault(); onReview(); }}>
    <FormField id="title" label="Title" hint="Public · Appears in Explore and the proof metadata." error={errors.title}><input id="title" {...accessibility("title")} required maxLength={120} className={inputClassName} value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} /></FormField>
    <FormField id="preview" label="Description" hint="Public · The preview everyone can read." error={errors.preview}><textarea id="preview" {...accessibility("preview")} required maxLength={500} rows={3} className={inputClassName} value={draft.preview} onChange={(e) => onChange({ ...draft, preview: e.target.value })} /></FormField>
    <label className="flex min-h-11 items-center gap-3 text-base text-white"><input id="isGated" type="checkbox" className="h-5 w-5 accent-red-500" checked={draft.isGated} onChange={(e) => onChange({ ...draft, isGated: e.target.checked })} />Members-only publication (gated)</label>
    <FormField id="body" label={draft.isGated ? "Premium content" : "Public content (optional)"} hint={draft.isGated ? "Premium · Fictional text only. Excluded from the public metadata hash and held in this tab’s memory." : "Public · Readers can open this text without buying a membership. Fictional text only."} error={errors.body}><textarea id="body" {...accessibility("body")} required={draft.isGated} maxLength={50000} rows={8} className={inputClassName} value={draft.body} onChange={(e) => onChange({ ...draft, body: e.target.value })} /></FormField>
    {draft.isGated && <div className="grid gap-6 sm:grid-cols-2">
      <FormField id="price" label="Price (DEMO)" hint="Public · Positive amount; up to 6 decimal places." error={errors.price}><input id="price" {...accessibility("price")} required inputMode="decimal" className={inputClassName} value={draft.price} onChange={(e) => onChange({ ...draft, price: e.target.value })} /></FormField>
      <FormField id="durationDays" label="Duration (days)" hint="Public · Whole number between 1 and 365." error={errors.durationDays}><input id="durationDays" {...accessibility("durationDays")} required type="number" min={1} max={365} step={1} className={inputClassName} value={Number.isNaN(draft.durationDays) ? "" : draft.durationDays} onChange={(e) => onChange({ ...draft, durationDays: e.target.valueAsNumber })} /></FormField>
    </div>}
    {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-red-300">Correct the highlighted fields. No Web3 operation has been started.</p>}
    <Button size="lg" type="submit">Review publication</Button>
  </form>;
}
