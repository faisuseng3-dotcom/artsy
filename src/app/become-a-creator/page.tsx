import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BecomeCreatorForm } from "@/components/sell/become-creator-form";

export default async function BecomeCreatorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/become-a-creator");

  const existing = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/sell");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-3xl text-ink">Start selling on Artsy</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        Publish your first piece in about three minutes. No subscription — we only take a fee when something sells.
      </p>
      <BecomeCreatorForm defaultName={session.user.name ?? ""} />
    </div>
  );
}
