
export function centsToInputValue(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}
