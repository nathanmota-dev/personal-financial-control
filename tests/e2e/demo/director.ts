import type { Locator, Page } from "@playwright/test";

// Playwright videos have no pointer, so the page draws one that follows mouse events.
function installCursor() {
  const install = () => {
    if (document.getElementById("demo-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    cursor.style.cssText =
      "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)";
    cursor.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" style="transition:transform .12s;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))"><path d="M4 2l15 11.5-6.6.9 3.9 7.4-3 1.5-3.8-7.5L4 20z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.append(cursor);
    const icon = cursor.firstElementChild as SVGElement;
    addEventListener(
      "mousemove",
      (event) => {
        cursor.style.transform = `translate(${event.clientX - 4}px,${event.clientY - 2}px)`;
      },
      true,
    );
    addEventListener("mousedown", () => { icon.style.transform = "scale(.82)"; }, true);
    addEventListener("mouseup", () => { icon.style.transform = ""; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install);
  else install();
}

export class Director {
  private x = 800;
  private y = 450;
  constructor(readonly page: Page) {}

  async install() {
    await this.page.context().addInitScript(installCursor);
    await this.page.evaluate(installCursor);
    await this.page.mouse.move(this.x, this.y);
  }

  wait(ms: number) {
    return this.page.waitForTimeout(ms);
  }

  /** Glides the pointer to the target before acting, like a person would. */
  async moveTo(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error("Demo target must be visible");
    const x = box.x + Math.min(box.width / 2, 40);
    const y = box.y + box.height / 2;
    const steps = Math.max(8, Math.round(Math.hypot(x - this.x, y - this.y) / 45));
    await this.page.mouse.move(x, y, { steps });
    this.x = x;
    this.y = y;
    await this.wait(80);
  }

  async click(locator: Locator) {
    await locator.waitFor();
    await this.moveTo(locator);
    await locator.click({ position: await this.offset(locator) });
    await this.wait(250);
  }

  async type(locator: Locator, text: string) {
    await this.click(locator);
    await locator.fill("");
    await locator.pressSequentially(text, { delay: 40 });
    await this.wait(150);
  }

  async scroll(delta: number) {
    const step = Math.sign(delta) * 80;
    for (let moved = 0; Math.abs(moved) < Math.abs(delta); moved += step) {
      await this.page.mouse.wheel(0, step);
      await this.wait(16);
    }
    await this.wait(300);
  }

  /** Opens a screen from the sidebar and waits for its heading. */
  async go(label: string, path: string) {
    const navigation = this.page.getByRole("navigation", { name: "Navegação principal" });
    await this.click(navigation.getByRole("link", { name: label, exact: true }));
    await this.page.waitForURL((url) => url.pathname === path);
    await this.page.getByRole("heading", { level: 1 }).first().waitFor();
    await this.page.waitForLoadState("networkidle");
    await this.wait(700);
  }

  private async offset(locator: Locator) {
    const box = (await locator.boundingBox())!;
    return { x: this.x - box.x, y: this.y - box.y };
  }
}
