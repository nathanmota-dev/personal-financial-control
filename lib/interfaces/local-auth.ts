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
export interface LockFormProps {
  setup: boolean;
  destination: string;
  attempts: number;
}
export interface SecuritySettingsProps extends LockSettings {
  hasMcpToken: boolean;
}
export interface PinInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface SessionActivityProps { timeoutMinutes: number; }

export interface McpTokenSettingsProps { hasMcpToken: boolean; }
