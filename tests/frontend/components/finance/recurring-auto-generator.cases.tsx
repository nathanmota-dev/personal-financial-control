import { waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";
import { generateRecurringTransactionsAction } from "@/app/actions/finance";
import { RecurringAutoGenerator } from "@/components/finance/recurring-auto-generator";
import { resetRecurringGeneration } from "@/lib/recurring-generation-session";

// Cases share one module graph, so each case prepares its own state.
function prepareGenerator() {
  resetRecurringGeneration();
  navigation.search = new URLSearchParams("month=2026-05");
  vi.mocked(generateRecurringTransactionsAction).mockResolvedValue({ ok: true, data: [] } as never);
}

it("generates each month once per session across navigations", async () => {
  prepareGenerator();
  const first = renderUI(<RecurringAutoGenerator demoMode={false} />);
  await waitFor(() => expect(generateRecurringTransactionsAction).toHaveBeenCalledTimes(1));
  expect(generateRecurringTransactionsAction).toHaveBeenCalledWith("2026-05");
  first.unmount();

  navigation.pathname = "/transactions";
  const second = renderUI(<RecurringAutoGenerator demoMode={false} />);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(generateRecurringTransactionsAction).toHaveBeenCalledTimes(1);
  second.unmount();

  resetRecurringGeneration();
  renderUI(<RecurringAutoGenerator demoMode={false} />);
  await waitFor(() => expect(generateRecurringTransactionsAction).toHaveBeenCalledTimes(2));
});

it("retries a month whose generation failed", async () => {
  prepareGenerator();
  vi.mocked(generateRecurringTransactionsAction).mockResolvedValueOnce({
    ok: false,
    error: { message: "Falha temporária." },
  } as never);

  const first = renderUI(<RecurringAutoGenerator demoMode={false} />);
  await waitFor(() => expect(generateRecurringTransactionsAction).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  first.unmount();

  renderUI(<RecurringAutoGenerator demoMode={false} />);
  await waitFor(() => expect(generateRecurringTransactionsAction).toHaveBeenCalledTimes(2));
});
