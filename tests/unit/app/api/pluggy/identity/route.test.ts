import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/identity/route";
import { getFinanceDatabase } from "@/lib/db";
import { createAccount } from "@/lib/server/accounts";

const state = routeDatabase();
guardCases(route);
pluggyGuardCases(route);

const CPF = "123.456.789-09";
const put = (body: unknown) => route.PUT(request("PUT", body));

it("starts empty", async () => {
  await expect((await route.GET(request())).json()).resolves.toMatchObject({ identity: { names: [], cpfMasked: null, otherOwnAccountId: null } });
});

it("saves the identity, masks the CPF and encrypts it at rest", async () => {
  const response = await put({ names: ["João da Silva"], cpf: CPF, otherOwnAccountId: state.checkingId });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ identity: { names: ["João da Silva"], cpfMasked: "***.456.789-**", otherOwnAccountId: state.checkingId } });
  const { rows } = await (await getFinanceDatabase()).$client.execute("SELECT owner_names, owner_cpf FROM pluggy_settings");
  expect(rows[0].owner_cpf).toMatch(/^pfc:v2:/);
  expect(JSON.stringify(rows)).not.toMatch(/12345678909|Silva/);
});

it("keeps the stored CPF when it is omitted", async () => {
  await put({ names: ["João da Silva"], cpf: CPF, otherOwnAccountId: null });
  const body = await (await put({ names: ["Joao Silva"], otherOwnAccountId: null })).json();
  expect(body.identity).toMatchObject({ names: ["Joao Silva"], cpfMasked: "***.456.789-**" });
});

it.each([
  [{ names: ["João"], otherOwnAccountId: null }],
  [{ names: ["João da Silva"], cpf: "123", otherOwnAccountId: null }],
  [{ names: Array(6).fill("João da Silva"), otherOwnAccountId: null }],
])("rejects invalid input %#", async (body) => {
  expect((await put(body)).status).toBe(400);
});

it("rejects an unusable destination account", async () => {
  expect((await put({ names: [], otherOwnAccountId: state.creditId })).status).toBe(400);
  expect((await put({ names: [], otherOwnAccountId: "missing" })).status).toBe(400);
  const db = await getFinanceDatabase();
  const savings = await createAccount({ name: "Poupança", type: "savings", initialBalanceCents: 0 }, db);
  expect((await put({ names: [], otherOwnAccountId: savings.id })).status).toBe(200);
});
