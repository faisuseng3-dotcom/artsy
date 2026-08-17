import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl text-ink">Welcome back</h1>
      <p className="mt-1 mb-8 text-sm text-ink-muted">Sign in to save pieces, follow creators, and check out.</p>
      <LoginForm callbackUrl={callbackUrl} />
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent">
          Create an account
        </Link>
      </p>
      <div className="mt-8 rounded-xl border border-line bg-paper-raised p-4 text-xs text-ink-muted">
        <p className="font-medium text-ink">Demo accounts</p>
        <p className="mt-1">buyer@artsy.dev / password123</p>
        <p>erik.lindqvist@artsy.dev / password123 (creator)</p>
        <p>admin@artsy.dev / password123 (admin)</p>
      </div>
    </div>
  );
}
