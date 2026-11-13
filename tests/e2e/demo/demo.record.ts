import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect } from "../helpers/fixture";
import { Director } from "./director";

// Records the README demo: a paced tour of every screen with the demo fixtures.
// Run with `npm run demo:record`. The video stays local in docs/ (gitignored):
// it is uploaded to a GitHub issue and linked from the README.
const OUTPUT = resolve("docs/demo.mp4");
const SIZE = { width: 1600, height: 900 };

test.use({ viewport: SIZE, video: { mode: "on", size: SIZE } });

test("records the finance demo", async ({ page }) => {
  const recordingStarted = Date.now();
  await page.goto("/login?next=/dashboard");
  await page.getByRole("link", { name: "Explorar demo" }).click();
  await page.getByRole("heading", { name: "Visão mensal", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  const director = new Director(page);
  await director.install();
  // Everything before the dashboard is ready is trimmed from the video.
  const trimStart = (Date.now() - recordingStarted) / 1000;
  await director.wait(1200);

  await tour(director);

  const video = page.video();
  await page.close();
  const raw = await video!.path();
  mkdirSync(resolve("docs"), { recursive: true });
  const result = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-ss", trimStart.toFixed(2), "-i", raw,
    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", OUTPUT,
  ], { stdio: "inherit" });
  expect(result.status, "ffmpeg conversion").toBe(0);
});

// Screens with nothing to do get a short pause and a scroll; the ones with
// flows (dashboard, lançamentos, calculadoras) get most of the time.
async function tour(director: Director) {
  const { page } = director;

  await director.scroll(700);
  await director.wait(900);
  await director.scroll(700);
  await director.wait(900);
  await director.scroll(-1400);
  await director.click(page.getByRole("button", { name: "julho de 2026", exact: true }).first());
  await director.click(page.getByRole("button", { name: "Jun", exact: true }));
  await director.wait(1200);
  await director.click(page.getByRole("button", { name: "Ocultar valores", exact: true }));
  await director.wait(900);
  await director.click(page.getByRole("button", { name: "Mostrar valores", exact: true }));
  await director.wait(500);

  await director.go("Casa", "/housing");
  await director.scroll(600);
  await director.wait(600);

  await director.go("Cartões", "/credit-card");
  await director.scroll(600);
  await director.wait(600);

  await director.go("Lançamentos", "/transactions");
  await director.click(page.getByRole("button", { name: "Novo lançamento", exact: true }));
  await director.wait(1200);
  await page.keyboard.press("Escape");
  await director.scroll(600);
  await director.wait(600);

  await director.go("Orçamentos", "/budgets");
  await director.scroll(500);
  await director.wait(600);

  await director.go("Recorrentes", "/recurring");
  await director.scroll(500);
  await director.wait(600);

  await director.go("Saldo Projetado", "/projected-balance");
  await director.wait(600);
  await director.click(page.getByRole("tab", { name: "Calendário" }));
  await director.wait(1000);
  await director.click(page.getByRole("tab", { name: "Tabela" }));
  await director.wait(800);

  await director.go("Investimentos", "/investments");
  await director.scroll(600);
  await director.wait(600);
  await director.go("Carteira", "/investments/portfolio");
  await director.scroll(500);
  await director.wait(600);

  await director.go("Reserva", "/reserve");
  await director.scroll(500);
  await director.wait(600);

  await director.go("Relatórios", "/reports");
  await director.scroll(700);
  await director.wait(800);
  await director.scroll(700);
  await director.wait(600);

  await director.go("Metas", "/goals");
  await director.scroll(500);
  await director.wait(600);

  await director.go("Calculadoras", "/calculators");
  await director.wait(500);
  await director.go("Juros compostos", "/calculators/compound-interest");
  await director.click(page.getByRole("button", { name: "Calcular", exact: true }));
  await director.wait(800);
  await director.scroll(600);
  await director.wait(600);
  await director.go("Salário líquido CLT", "/calculators/net-salary");
  await director.scroll(500);
  await director.wait(500);
  await director.go("Renda PJ", "/calculators/pj-income");
  await director.scroll(500);
  await director.wait(500);

  await director.go("Dashboard", "/dashboard");
  await director.wait(1500);
}
