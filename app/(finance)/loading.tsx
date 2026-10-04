import { LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export default function Loading() {
  return <LoadingPage label="dados financeiros"><LoadingPanel><LoadingRows count={3} /></LoadingPanel></LoadingPage>;
}
