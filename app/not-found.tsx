import { AppBrand } from "@/components/finance/app-brand";
import { NotFoundStatus } from "@/components/finance/not-found-status";

export default function NotFound() {
  return (
    <main className="relative bg-surface text-content-strong">
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8"><AppBrand /></div>
      <NotFoundStatus fullScreen />
    </main>
  );
}
