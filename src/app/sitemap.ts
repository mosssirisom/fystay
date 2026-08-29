import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Rendered per-request rather than prerendered at build time: a build
// machine isn't guaranteed the same database access as the deployed
// serverless functions, so a build-time query here would make the whole
// site's build fragile on something unrelated to the actual code.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A sitemap is non-critical: if the database is briefly unreachable,
  // degrade to just the homepage entry rather than failing the request.
  const listings = await prisma.listing
    .findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    })
    .catch(() => []);

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...listings.map((listing) => ({
      url: `${siteUrl}/listings/${listing.id}`,
      lastModified: listing.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
