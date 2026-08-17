import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/queries";
import { ListingWizard } from "@/components/sell/listing-wizard";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/sell/new");
  if (session.user.role !== "CREATOR") redirect("/become-a-creator");

  const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator || creator.status !== "APPROVED") redirect("/sell");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <ListingWizard categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
    </div>
  );
}
