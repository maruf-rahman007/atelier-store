import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <div className="container-prose section flex flex-col items-start gap-6">
      <h1 className="text-headline">This collection isn’t available</h1>
      <p className="text-body-lg text-ink-muted">
        It may have ended or the link may be mistyped. Our new arrivals are a
        good place to start.
      </p>
      <Link href="/collections/new" className="btn btn-primary">
        Shop new arrivals
      </Link>
    </div>
  );
}
