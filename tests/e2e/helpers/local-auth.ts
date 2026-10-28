import { expect, type BrowserContext } from "@playwright/test";
export async function loginWithPin(context: BrowserContext, url: string, idToken = "onboarding-a") {
  const login = await context.request.post(`${url}/api/session`, { headers: { Origin: url }, data: { idToken } });
  expect(login.status()).toBe(200);
  const setup = await context.request.post(`${url}/api/pin`, { headers: { Origin: url }, data: { pin: "123456" } });
  if (setup.status() === 403) {
    const unlock = await context.request.post(`${url}/api/unlock`, { headers: { Origin: url }, data: { pin: "123456" } });
    expect(unlock.status()).toBe(200);
  } else expect(setup.status()).toBe(200);
}
