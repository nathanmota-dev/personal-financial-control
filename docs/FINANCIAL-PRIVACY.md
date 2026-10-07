# Financial presentation privacy

The finance layout supplies `FinancialPrivacyProvider` outside its Suspense
boundary, so fallback content and onboarding share the same protection. Its device preference is
stored under separate `personal-financial-control:privacy:personal` and
`personal-financial-control:privacy:demo` keys. Only `hidden` or `visible` is stored.
Server rendering and the first hydration render always conceal financial values;
`useSyncExternalStore` then reads the device preference. If storage is unavailable,
values start concealed and the preference continues working in memory for the
mounted session.

For new financial screens (including budgets and reports):

- Use `useFinancialFormatter().formatCurrency(cents)` in client presentation
  components. It returns the fixed accessible placeholder `Valor oculto` when
  concealed. Use `protect(value)` for quantities and preformatted financial text,
  including native titles and accessible labels.
- Keep `lib/finance-ui` formatters for domain logic and exports. Never mask values
  in records, calculations, mutation payloads or input state.
- Use `ChartContainer` for financial charts. It removes the actual chart, axes,
  tooltips and chart accessibility tree while concealed.
- Import monetary dialog content from
  `components/finance/privacy/privacy-dialog-content`. For inline forms use
  `FinancialPrivacyForm`; `MoneyInput` also supplies a field-level safeguard.
  Reveal consent applies only to that form and never writes the global preference.
  Keep drafts in the parent of the boundary. Closing a dialog removes its consent.
- Disable export/copy actions while hidden, with an explicit action to show values
  first. `ReportExportActions` demonstrates this flow.

This is screen presentation privacy. It does not replace authentication or
financial encryption and does not conceal data from authorized browser inspection.
