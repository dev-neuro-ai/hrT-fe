import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted p-12">
        <div className="w-full max-w-[400px] space-y-6 text-center">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="BetterHR Logo"
              className="w-auto h-24 object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = "none";
                console.warn(
                  "Logo image not found. Please add /public/logo.png",
                );
              }}
            />
          </div>
          <p className="text-muted-foreground">
            Transform your recruitment process with AI-driven insights and
            automated workflows.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-6">{children}</div>
      </div>
    </div>
  );
}
