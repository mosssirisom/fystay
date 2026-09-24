// The site's top-level pages, shared between DesktopNavLinks (lg: only) and
// the mobile GuestMenu/UserMenu dropdowns (<lg: only) - one list instead of
// two copies that could quietly drift apart. "Hotels" links to /hotels -
// FYStay's own affiliate hotel search (see src/lib/hotelProviders/), a
// deliberately separate page from "Stays" (/search, FYStay's own directly-
// booked listings): the two are never the same booking flow, so the nav
// keeps them as two distinct entries rather than merging them.
export const PRIMARY_NAV_LINKS = [
  { href: "/search", label: "Stays" },
  { href: "/hotels", label: "Hotels" },
  { href: "/destinations", label: "Destinations" },
  { href: "/about", label: "About" },
];
