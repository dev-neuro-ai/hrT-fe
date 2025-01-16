import { ReactNode } from 'react';
import { CircleUserRound } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted p-12">
        <div className="w-full max-w-[400px] space-y-6 text-center">
          <CircleUserRound className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">BetterHR</h1>
          <p className="text-muted-foreground">
            Transform your recruitment process with AI-driven insights and automated workflows.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}