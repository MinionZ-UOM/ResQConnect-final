"use client";

import { Badge } from "@/components/ui/badge";
import { Package, Edit, Car, Pill, Shirt, Wrench, Bike, Ship, Soup, Droplets, Cross, Bed, Tent, Square, Radio, Hammer, Box } from "lucide-react";
import type { ResourceDonation } from "@/lib/types";

const subcategoryIcons: Record<string, React.ElementType> = {
  "Two wheel vehicle": Bike,
  "Threewheel vehicle": Car,       
  "Four wheel vehicle": Car,
  Boat: Ship,
  "Dry Rations": Package,
  "Cooked meals": Soup,
  "Bottled Water": Droplets,
  "First aid kits": Cross,
  "Medical supplies": Pill,
  Stretchers: Bed,
  "Women’s Pack": Shirt,
  "Men’s Pack": Shirt,
  Tents: Tent,
  Tarpaulins: Square,
  "Rescue kits": Wrench,
  "Radio Sets": Radio,
  Tools: Hammer,
  Other: Box
};

export default function ResourceCard({ item }: { item: ResourceDonation }) {
  const Icon = subcategoryIcons[item.subcategory] || Package;

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4 hover:bg-muted/40 transition">
      <div className="flex justify-between items-start">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{item.subcategory}</h3>
            <p className="text-sm sm:text-base text-slate-700">{item.location}</p>
            {/* Quantity with units */}
            <p className="text-sm font-medium text-slate-700">
              {item.quantity} {item.unit}
            </p>
          </div>
        </div>

        {/* Right side: Category badge */}
        <Badge variant="outline" className="capitalize">
          {item.category}
        </Badge>
      </div>
    </div>
  );
}