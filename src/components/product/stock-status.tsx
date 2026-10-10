import { stockLabel, stockLevel, type StockLevel } from "@/lib/products";

const stockTone: Record<StockLevel, string> = {
  "in-stock": "bg-success",
  "low-stock": "bg-danger",
  "out-of-stock": "bg-line-strong",
};

/* Coloured dot + "In stock" / "Only 2 left" / "Out of stock". */
export function StockStatus({
  stock,
  prefix,
}: {
  stock: number;
  prefix?: string;
}) {
  return (
    <p className="flex items-center gap-2 text-small">
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${stockTone[stockLevel(stock)]}`}
      />
      {prefix && <span className="text-ink-muted">{prefix}</span>}
      {stockLabel(stock)}
    </p>
  );
}
