export interface LocalSession {
  v: 1;
  email: string;
  uid: string;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
  ver: number;
}
export interface UnlockSession {
  email: string;
  ver: number;
  lastActivity: number;
  timeout: number;
  bootId?: string;
}
export interface LockSettings {
  lockTimeoutMinutes: number;
  lockOnClose: boolean;
}
export interface LockUser {
  name?: string;
  email: string;
  picture?: string;
}
export interface LockFormProps {
  setup: boolean;
  destination: string;
  attempts: number;
  user: LockUser;
}
export interface LockUserCardProps { user: LockUser; }
export interface LockAttemptsProps {
  remaining: number;
  total: number;
}
export interface SecuritySettingsProps extends LockSettings {
  hasMcpToken: boolean;
}
export interface PinInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** `lg` renders the dashboard-style tiles used on the lock screen. */
  size?: "default" | "lg";
}

export interface SessionActivityProps { timeoutMinutes: number; }

export interface McpTokenSettingsProps { hasMcpToken: boolean; }

export interface LockTimeoutSliderProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}
