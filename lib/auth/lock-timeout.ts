// Zero disables inactivity locking; the remaining steps are minutes.
export const lockTimeoutOptions = [0, 1, ...Array.from({ length: 12 }, (_, index) => (index + 1) * 5)] as const;
export const maxLockTimeoutMinutes = lockTimeoutOptions[lockTimeoutOptions.length - 1];

export function isLockTimeoutOption(minutes: number) {
  return (lockTimeoutOptions as readonly number[]).includes(minutes);
}
export function nearestLockTimeoutIndex(minutes: number) {
  return lockTimeoutOptions.reduce((best, option, index) =>
    Math.abs(option - minutes) < Math.abs(lockTimeoutOptions[best] - minutes) ? index : best, 0);
}
