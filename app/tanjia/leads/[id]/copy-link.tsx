'use client';

type Props = { text: string };

export default function CopyLink({ text }: Props) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-white"
    >
      Copy scheduling link
    </button>
  );
}
