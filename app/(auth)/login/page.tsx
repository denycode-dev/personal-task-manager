import { APP_NAME } from "@/config/app";
import { LoginForm } from "@/features/auth/components/login-form";
import { Sparkle, LockKey } from "@phosphor-icons/react/dist/ssr";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm p-6 sm:p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white space-y-6">
      <div className="flex items-center gap-2.5 border-b-2 border-black pb-4">
        <span className="p-2 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Sparkle size={20} weight="fill" />
        </span>
        <div>
          <h1 className="text-xl font-black text-black leading-none">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Personal productivity workspace</p>
        </div>
      </div>

      <LoginForm />
    </div>
  );
}
