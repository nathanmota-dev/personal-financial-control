export interface LoginFormProps { destination: string }
export interface LogoutButtonProps { allDevices?: boolean; iconOnly?: boolean }

export interface SessionUser {
  name: string;
  photoURL: string | null;
}

export interface UserControlsProps {
  user: SessionUser;
}

export interface LoginPageProps { searchParams: Promise<{ next?: string }> }
