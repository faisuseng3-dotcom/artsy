"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const [role, setRole] = useState<"BUYER" | "CREATOR">("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Something went wrong. Please try again.");
          setLoading(false);
          return;
        }
        const signInRes = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (signInRes?.error) {
          router.push("/login");
          return;
        }
        router.push(role === "CREATOR" ? "/sell/onboarding" : "/");
        router.refresh();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("BUYER")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left text-sm",
            role === "BUYER" ? "border-accent bg-accent-soft" : "border-ink/15"
          )}
        >
          <p className="font-medium text-ink">I want to buy</p>
          <p className="text-xs text-ink-muted">Discover and collect unique work</p>
        </button>
        <button
          type="button"
          onClick={() => setRole("CREATOR")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left text-sm",
            role === "CREATOR" ? "border-accent bg-accent-soft" : "border-ink/15"
          )}
        >
          <p className="font-medium text-ink">I want to sell</p>
          <p className="text-xs text-ink-muted">List and sell what you make</p>
        </button>
      </div>

      <div>
        <Label>Name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
