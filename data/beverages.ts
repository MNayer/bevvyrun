export interface BeverageItem {
  name: string;
  price: number;
}

// Estimated prices (including average Pfand) for Berlin region 10587
// Prices are mixed single bottles and Crates (Kasten)
export const beverages: BeverageItem[] = [
  // --- Single Bottles (Soft Drinks) ---
  { name: "Club Mate (0.5l)", price: 1.30 },
  { name: "Club Mate Cola (0.33l)", price: 1.20 },
  { name: "Club Mate Ice T Kraftstoff (0.5l)", price: 1.30 },
  { name: "Mio Mate (0.5l)", price: 1.30 },
  { name: "Fritz-kola (0.33l)", price: 1.20 },
  { name: "Fritz-kola ohne Zucker (0.33l)", price: 1.20 },
  { name: "Fritz-limo Orange (0.33l)", price: 1.20 },
  { name: "Fritz-limo Zitrone (0.33l)", price: 1.20 },
  { name: "Fritz-spritz Rhabarber (0.33l)", price: 1.30 },
  { name: "Fritz-spritz Apfel (0.33l)", price: 1.30 },
  { name: "Paulaner Spezi (0.5l)", price: 1.10 },
  { name: "Coca-Cola (1.0l)", price: 1.80 },
  { name: "Coca-Cola Zero (1.0l)", price: 1.80 },
  { name: "Coca-Cola (0.33l Glas)", price: 1.10 },
  { name: "Fanta Orange (1.0l)", price: 1.80 },
  { name: "Sprite (1.0l)", price: 1.80 },
  { name: "Red Bull (0.25l)", price: 1.60 },
  { name: "Red Bull Sugarfree (0.25l)", price: 1.60 },
  { name: "Bionade Holunder (0.33l)", price: 1.30 },
  { name: "Bionade Kräuter (0.33l)", price: 1.30 },
  { name: "Bionade Litschi (0.33l)", price: 1.30 },
  { name: "Orangina Original (0.25l)", price: 1.40 },
  { name: "Almdudler (0.35l)", price: 1.20 },

  // --- Single Bottles (Water) ---
  { name: "Viva con Agua Laut (0.33l)", price: 0.90 },
  { name: "Viva con Agua Leise (0.33l)", price: 0.90 },
  { name: "Spreequell Classic (1.0l)", price: 0.90 },
  { name: "Spreequell Medium (1.0l)", price: 0.90 },
  { name: "Spreequell Naturell (1.0l)", price: 0.90 },
  { name: "Völaufer Classic (1.0l)", price: 0.85 },
  { name: "Völaufer Medium (1.0l)", price: 0.85 },
  { name: "Gerolsteiner Sprudel (0.75l)", price: 1.10 },
  { name: "Gerolsteiner Naturell (0.75l)", price: 1.10 },

  // --- Single Bottles (Beer) ---
  { name: "Berliner Kindl Jubiläums Pilsener (0.5l)", price: 1.10 },
  { name: "Berliner Pilsner (0.5l)", price: 1.10 },
  { name: "Augustiner Lagerbier Hell (0.5l)", price: 1.50 },
  { name: "Augustiner Edelstoff (0.5l)", price: 1.60 },
  { name: "Rothaus Tannenzäpfle (0.33l)", price: 1.40 },
  { name: "Bayreuther Hell (0.5l)", price: 1.40 },
  { name: "Tegernseer Hell (0.5l)", price: 1.50 },
  { name: "Chiemseer Hell (0.5l)", price: 1.40 },
  { name: "Gösser Natur Radler (0.5l)", price: 1.30 },
  { name: "Sternburg Export (0.5l)", price: 0.80 },
  { name: "Beck's Pils (0.5l)", price: 1.20 },
  { name: "Heineken (0.4l)", price: 1.40 },
  { name: "Corona Extra (0.355l)", price: 1.80 },
  { name: "Pilsner Urquell (0.5l)", price: 1.40 },
  { name: "Erdinger Weißbier (0.5l)", price: 1.30 },
  { name: "Desperados Original (0.33l)", price: 1.70 },

  // --- Misc (Milk/Coffee) ---
  { name: "Oatly Barista Edition (1.0l)", price: 2.50 },
  { name: "Alpro Mandelmilch (1.0l)", price: 2.80 },
  { name: "Weihenstephan H-Milch 3.5% (1.0l)", price: 1.60 },

  // --- Crates (Kästen) - Soft Drinks ---
  { name: "Club Mate Kasten (20 x 0.5l)", price: 24.00 },
  { name: "Club Mate Cola Kasten (20 x 0.33l)", price: 22.00 },
  { name: "Mio Mate Kasten (20 x 0.5l)", price: 24.00 },
  { name: "Fritz-kola Kasten (24 x 0.33l)", price: 27.00 },
  { name: "Fritz-kola ohne Zucker Kasten (24 x 0.33l)", price: 27.00 },
  { name: "Fritz-limo Mischkasten (24 x 0.33l)", price: 27.00 },
  { name: "Paulaner Spezi Kasten (20 x 0.5l)", price: 23.50 },
  { name: "Coca-Cola Kasten (12 x 1.0l PET)", price: 18.00 },
  { name: "Coca-Cola Zero Kasten (12 x 1.0l PET)", price: 18.00 },
  { name: "Coca-Cola Kasten (24 x 0.33l Glas)", price: 22.00 },
  { name: "Bionade Holunder Kasten (12 x 0.33l)", price: 14.50 },
  { name: "Bionade Gemischt (12 x 0.33l)", price: 14.50 },

  // --- Crates (Kästen) - Water ---
  { name: "Viva con Agua Laut Kasten (24 x 0.33l)", price: 22.50 },
  { name: "Viva con Agua Leise Kasten (24 x 0.33l)", price: 22.50 },
  { name: "Spreequell Classic Kasten (12 x 1.0l)", price: 10.50 },
  { name: "Spreequell Naturell Kasten (12 x 1.0l)", price: 10.50 },
  { name: "Spreequell Classic Kasten (6 x 1.0l Glas)", price: 8.50 },
  { name: "Gerolsteiner Sprudel Kasten (12 x 0.75l Glas)", price: 13.50 },

  // --- Crates (Kästen) - Beer ---
  { name: "Berliner Kindl Jubiläums Pilsener Kasten (20 x 0.5l)", price: 18.50 },
  { name: "Berliner Pilsner Kasten (20 x 0.5l)", price: 18.50 },
  { name: "Augustiner Lagerbier Hell Kasten (20 x 0.5l)", price: 26.00 },
  { name: "Augustiner Edelstoff Kasten (20 x 0.5l)", price: 27.00 },
  { name: "Bayreuther Hell Kasten (20 x 0.5l)", price: 24.50 },
  { name: "Tegernseer Hell Kasten (20 x 0.5l)", price: 26.50 },
  { name: "Chiemseer Hell Kasten (20 x 0.5l)", price: 24.50 },
  { name: "Rothaus Tannenzäpfle Kasten (24 x 0.33l)", price: 25.50 },
  { name: "Gösser Natur Radler Kasten (20 x 0.5l)", price: 23.00 },
  { name: "Sternburg Export Kasten (20 x 0.5l)", price: 13.00 },
  { name: "Beck's Pils Kasten (24 x 0.33l)", price: 21.00 },
  { name: "Beck's Pils Kasten (20 x 0.5l)", price: 21.00 },
  { name: "Pilsner Urquell Kasten (20 x 0.5l)", price: 23.00 },
  { name: "Heineken Kasten (20 x 0.4l)", price: 24.00 },
];

export const getPriceForBeverage = (name: string): number | undefined => {
  const item = beverages.find(b => b.name.toLowerCase() === name.toLowerCase());
  return item?.price;
};
