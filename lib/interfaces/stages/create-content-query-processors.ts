/* eslint-disable @typescript-eslint/no-explicit-any -- Preserve the generic Drizzle content adapter API. */

export interface CreateContentQueryProcessorsContext {
  tables: any;
  tableConfigs: any;
  stripContentIndexes: (value: any) => any;
}
