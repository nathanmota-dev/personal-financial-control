import { notFound } from "next/navigation";
import { connection } from "next/server";

import { InvestmentAssetDetailView } from "@/components/finance/investment-asset-detail-view";
import { getInvestmentAssetDetails } from "@/lib/server/investment-operations";

export default async function InvestmentAssetPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const asset = await getInvestmentAssetDetails(id);
  if (!asset) notFound();
  return <InvestmentAssetDetailView asset={asset} />;
}
