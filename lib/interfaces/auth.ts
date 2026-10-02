export interface LoginFormProps { destination: string }
export interface LogoutButtonProps { allDevices?: boolean }

export interface LoginPageProps { searchParams: Promise<{ next?: string }> }
