export interface LoginFormProps {
  destination: string;
  demoMode: boolean;
}
export interface LogoutButtonProps {
  allDevices?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export interface SessionUser {
  name: string;
  photoURL: string | null;
  email?: string | null;
}

export interface UserControlsProps {
  onNavigate?: () => void;
  expanded?: boolean;
  demoMode: boolean;
  user: SessionUser;
}

export interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export interface AccountViewProps {
  user: SessionUser;
  demoMode?: boolean;
}
