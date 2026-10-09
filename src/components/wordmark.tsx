import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      // Negative end margin cancels the tracking after the last letter, so the
      // word is optically centred.
      className={`-mr-[0.32em] font-medium uppercase tracking-[0.32em] ${className}`}
    >
      Atelier
    </Link>
  );
}
