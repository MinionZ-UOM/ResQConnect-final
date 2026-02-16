"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

export default function ResourceCard({ item }: { item: ResourceDonation}) {
  const [open, setOpen] = useState(false);

  const Icon = subcategoryIcons[item.subcategory] || Package;
  const percent = (item.quantity / item.total) * 100;

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4 flex flex-col gap-3">
      {/* Header: Title + Category */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{item.subcategory}</h3>
            <p className="text-sm sm:text-base text-slate-700">{item.location}</p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">{item.category}</Badge>
      </div>

      {/* Availability */}
      <div>
        <p className="text-xs xs:text-base text-slate-700">Available</p>
        <Progress value={percent} className="h-2 mt-1" />
        <p className="text-xs mt-1">
          {item.quantity} / {item.total}
        </p>
      </div>

      {/* Last updated */}
      <p className="text-xs xs:text-base text-slate-700">Last updated: {item.lastUpdated}</p>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setOpen(true)}
        >
          <Edit className="h-4 w-4" /> Edit
        </Button>
      </div>

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {/* Replace with your form inputs */}
          <div className="space-y-4">
            <label className="block text-sm sm:text-base text-slate-700">Quantity</label>
            <input
              type="number"
              defaultValue={item.quantity}
              className="w-full border rounded p-2"
            />
            <label className="block text-sm">Location</label>
            <input
              type="text"
              defaultValue={item.location}
              className="w-full border rounded p-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}