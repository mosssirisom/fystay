export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "HOTEL"
  | "COTTAGE"
  | "VILLA"
  | "STUDIO"
  | "OTHER";

export const PROPERTY_TYPES: PropertyType[] = [
  "APARTMENT",
  "HOUSE",
  "HOTEL",
  "COTTAGE",
  "VILLA",
  "STUDIO",
  "OTHER",
];

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  HOTEL: "Hotel",
  COTTAGE: "Cottage",
  VILLA: "Villa",
  STUDIO: "Studio",
  OTHER: "Other",
};
