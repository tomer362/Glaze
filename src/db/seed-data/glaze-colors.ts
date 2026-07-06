import type { NewGlazeColor } from "../schema";

/**
 * Seed library of real, mid-fire (cone 5/6) commercial glaze colors.
 *
 * IMPORTANT — licensing: brand color *names* and *product codes* are factual
 * catalog data and fine to store. Brand fired-tile *photographs* are
 * copyrighted, so we do NOT copy them. Each `hex` here is a hand-eyeballed
 * approximation from public swatch charts, meant only as a UI chip — real
 * fired color varies by clay body and kiln. Seeded colors carry no photo
 * (`imageUrl` stays null); real photos only ever come from users.
 */
export type SeedColor = Pick<NewGlazeColor, "name" | "brand" | "code" | "hex">;

export const seedGlazeColors: SeedColor[] = [
  // ---- AMACO — Potter's Choice (PC) line, cone 5/6 -----------------------
  { brand: "AMACO", code: "PC-2", name: "Saturation Gold", hex: "#7a5c2e" },
  { brand: "AMACO", code: "PC-4", name: "Palladium", hex: "#3a3a3c" },
  { brand: "AMACO", code: "PC-9", name: "Vintage Gold", hex: "#8a6a2f" },
  { brand: "AMACO", code: "PC-10", name: "June Bug", hex: "#2f3b2a" },
  { brand: "AMACO", code: "PC-12", name: "Blue Midnight", hex: "#22304f" },
  { brand: "AMACO", code: "PC-20", name: "Blue Rutile", hex: "#3f5d78" },
  { brand: "AMACO", code: "PC-21", name: "Arctic Blue", hex: "#7fa6b8" },
  { brand: "AMACO", code: "PC-23", name: "Indigo Float", hex: "#34506b" },
  { brand: "AMACO", code: "PC-25", name: "Textured Turquoise", hex: "#2f8f8f" },
  { brand: "AMACO", code: "PC-26", name: "Antique Jade", hex: "#5f7a5a" },
  { brand: "AMACO", code: "PC-28", name: "Frosted Turquoise", hex: "#6fb3ab" },
  { brand: "AMACO", code: "PC-29", name: "Deep Sapphire", hex: "#1f2f5a" },
  { brand: "AMACO", code: "PC-36", name: "Ironstone", hex: "#6b6357" },
  { brand: "AMACO", code: "PC-40", name: "True Celadon", hex: "#b7c9a8" },
  { brand: "AMACO", code: "PC-42", name: "Seaweed", hex: "#3d5636" },
  { brand: "AMACO", code: "PC-46", name: "Lustrous Jade", hex: "#3f6f5a" },
  { brand: "AMACO", code: "PC-55", name: "Chun Plum", hex: "#5a2f3a" },
  { brand: "AMACO", code: "PC-59", name: "Deep Firebrick", hex: "#7a3628" },
  { brand: "AMACO", code: "PC-61", name: "Textured Amber", hex: "#9a6a34" },

  // ---- Mayco — Stoneware (SW) line, cone 5/6 -----------------------------
  { brand: "Mayco", code: "SW-104", name: "Black Walnut", hex: "#4a3c2f" },
  { brand: "Mayco", code: "SW-106", name: "Alabaster", hex: "#ece6d8" },
  { brand: "Mayco", code: "SW-108", name: "Green Tea", hex: "#9caf7f" },
  { brand: "Mayco", code: "SW-110", name: "Oyster", hex: "#c9bfae" },
  { brand: "Mayco", code: "SW-128", name: "Cordovan", hex: "#5a2b2b" },
  { brand: "Mayco", code: "SW-132", name: "Mirror Black", hex: "#1c1c1e" },
  { brand: "Mayco", code: "SW-164", name: "Satin Patina", hex: "#7fa596" },
  { brand: "Mayco", code: "SW-165", name: "Lavender Mist", hex: "#b3a7c9" },
  { brand: "Mayco", code: "SW-166", name: "Norse Blue", hex: "#4a6f9a" },
  { brand: "Mayco", code: "SW-167", name: "Sand and Sea", hex: "#b7ad8f" },
  { brand: "Mayco", code: "SW-168", name: "Coral Sands", hex: "#d98b6a" },
  { brand: "Mayco", code: "SW-172", name: "Macadamia", hex: "#c2a878" },
  { brand: "Mayco", code: "SW-173", name: "Amber Quartz", hex: "#b5793a" },
  { brand: "Mayco", code: "SW-174", name: "Leather", hex: "#7a5a3c" },
  { brand: "Mayco", code: "SW-182", name: "Antique Brass", hex: "#8a6f3a" },
  { brand: "Mayco", code: "SW-185", name: "Rainforest", hex: "#3f5f3a" },
  { brand: "Mayco", code: "SW-186", name: "Azurite", hex: "#2f6f8f" },
  { brand: "Mayco", code: "SW-187", name: "Himalayan Salt", hex: "#d8c2b0" },
  { brand: "Mayco", code: "SW-195", name: "Riptide", hex: "#3f7f8a" },
  { brand: "Mayco", code: "SW-197", name: "Fossil Rock", hex: "#8f8574" },
  { brand: "Mayco", code: "SW-223", name: "Milk Glass", hex: "#f0ece0" },

  // ---- Coyote Clay — Cone 6 line (names, no strict product code) ---------
  { brand: "Coyote", code: null, name: "Alabaster Satin", hex: "#ece7db" },
  { brand: "Coyote", code: null, name: "Almost Teal", hex: "#3f8a8a" },
  { brand: "Coyote", code: null, name: "Ancient Iron", hex: "#4a3b30" },
  { brand: "Coyote", code: null, name: "Autumn Spice", hex: "#a5602f" },
  { brand: "Coyote", code: null, name: "Azure Dream", hex: "#4a72a8" },
  { brand: "Coyote", code: null, name: "Apricot", hex: "#e8a15a" },
  { brand: "Coyote", code: null, name: "Sweet Plum", hex: "#6a3357" },
  { brand: "Coyote", code: null, name: "Deep Avocado", hex: "#556b2a" },
  { brand: "Coyote", code: null, name: "Beechnut", hex: "#b98f5f" },
  { brand: "Coyote", code: null, name: "Cornsilk", hex: "#e6d18a" },
  { brand: "Coyote", code: null, name: "Walnut", hex: "#5c4433" },
  { brand: "Coyote", code: null, name: "Summer Peach", hex: "#eab48f" },
  { brand: "Coyote", code: null, name: "Blue Cornflower", hex: "#5a7fc0" },
  { brand: "Coyote", code: null, name: "Honeydew", hex: "#c9dba0" },
  { brand: "Coyote", code: null, name: "Cool Artichoke", hex: "#7f8f5a" },

  // ---- Spectrum — 1100 Stoneware series, cone 4/6 ------------------------
  { brand: "Spectrum", code: "1100", name: "Transparent", hex: "#dfe6e6" },
  { brand: "Spectrum", code: "1102", name: "Wedgwood", hex: "#5a7fa5" },
  { brand: "Spectrum", code: "1103", name: "Dusty Rose", hex: "#c08a8a" },
  { brand: "Spectrum", code: "1104", name: "Grass Green", hex: "#5f8f3f" },
  { brand: "Spectrum", code: "1112", name: "Gold", hex: "#b58a3a" },
];
