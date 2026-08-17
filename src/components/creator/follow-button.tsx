"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FollowButton({
  creatorId,
  initialFollowing,
  isSignedIn,
}: {
  creatorId: string;
  initialFollowing: boolean;
  isSignedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "outline" : "accent"}
      disabled={pending}
      onClick={() => {
        if (!isSignedIn) {
          router.push("/login");
          return;
        }
        startTransition(async () => {
          setFollowing((f) => !f);
          const res = await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creatorId }),
          });
          if (!res.ok) setFollowing((f) => !f);
        });
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
