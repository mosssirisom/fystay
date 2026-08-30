import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { popularDestinations, rankDestinations, rankHotels } from "@/lib/searchSuggestions";

// Small, fixed limits keep this fast: the client debounces keystrokes and
// aborts stale requests, but the query itself should stay cheap regardless.
const MAX_RESULTS_PER_GROUP = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  try {
    const cityAggregates = await prisma.listing.groupBy({
      by: ["city", "country"],
      where: { published: true },
      _count: { _all: true },
    });
    const cities = cityAggregates.map((row) => ({
      city: row.city,
      country: row.country,
      count: row._count._all,
    }));

    if (!query) {
      return NextResponse.json({
        query: "",
        popular: true,
        destinations: popularDestinations(cities, { limit: MAX_RESULTS_PER_GROUP + 1 }),
        hotels: [],
      });
    }

    const [destinations, matchingListings] = await Promise.all([
      Promise.resolve(rankDestinations(cities, query, MAX_RESULTS_PER_GROUP)),
      prisma.listing.findMany({
        where: { published: true, title: { contains: query, mode: "insensitive" } },
        select: { id: true, title: true, city: true, country: true, photos: true },
        take: 20,
      }),
    ]);

    const hotels = rankHotels(matchingListings, query, MAX_RESULTS_PER_GROUP);

    return NextResponse.json({ query, popular: false, destinations, hotels });
  } catch {
    return NextResponse.json({ error: "Search is temporarily unavailable" }, { status: 503 });
  }
}
