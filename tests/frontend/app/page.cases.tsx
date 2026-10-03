import { expect, it } from "vitest";
import Home from "@/app/page";
it("redirects the app entry to dashboard", () => {
  expect(() => Home()).toThrow("REDIRECT:/dashboard");
});
