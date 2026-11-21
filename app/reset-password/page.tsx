import { Brand } from "@/components/brand";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export default function ResetPasswordPage() {
  return <main className="ambient-bg grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md"><Brand/><div className="surface mt-7 p-8"><p className="eyebrow">Account recovery</p><h1 className="mt-3 text-2xl font-bold text-[#f2ecdf]">Choose a new password.</h1><p className="mt-2 text-sm text-[#aaa6a2]">Open this page from the password reset email, then choose a new password.</p><PasswordRecoveryForm mode="update"/></div></div></main>;
}
