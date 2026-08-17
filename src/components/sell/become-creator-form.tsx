"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BecomeCreatorForm({ defaultName }: { defaultName: string }) {
  const [displayName, setDisplayName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      className="mt-8 space-y-4 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/become-a-creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName }),
        });
        setLoading(false);
        if (res.ok) {
          router.push("/sell/new");
          router.refresh();
        }
      }}
    >
      <div>
        <Label>Your creator name</Label>
        <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
        {loading ? "Setting up your studio…" : "Set up my studio"}
      </Button>
    </form>
  );
}
