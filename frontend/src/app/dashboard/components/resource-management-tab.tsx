"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter as FilterIcon, RotateCcw, Plus } from "lucide-react";
import ResourceCard from "./resource-card";
import { useMemo, useState, useEffect } from "react";
import type { ResourceDonation, ResourceCategory, ResourceSubcategory } from "@/lib/types";
import { getMockResources, RESOURCE_CATEGORIES } from "@/lib/mock-data";

// --- categories & subcategories ---
const categories: Record<string, string[]> = {
  Vehicles: ["Two wheel vehicle", "Threewheel vehicle", "Four wheel vehicle", "Boat"],
  Food: ["Dry Rations", "Cooked Meals", "Baby Food"],
  Medicine: ["First Aid Kits", "Prescription Drugs", "Sanitary Supplies"],
  Clothing: ["Men", "Women", "Children"],
  Shelter: ["Tents", "Blankets", "Sleeping Bags"],
  Tools: ["Rescue Equipment", "Construction Tools", "Generators"],
  Hygiene: ["Soap", "Sanitary Pads", "Disinfectants"],
  Other: ["Miscellaneous"],
};

// --- fixed pickup points ---
const pickupPoints = [
  "Colombo City Hall",
  "Kandy Bus Stand",
  "Galle Fort Entrance",
  "Jaffna Central Park",
  "Kurunegala Town Hall",
];

export default function ResourcesPage() {
  // --- state (mock) ---
  const [items, setItems] = useState<ResourceDonation[]>([]);
  const [category, setCategory] = useState<ResourceCategory>("Food");
  const [subcategory, setSubcategory] = useState<ResourceSubcategory>(
    RESOURCE_CATEGORIES["Food"][0]
  );

  // filters
  const [categoryFilter, setCategoryFilter] = useState<"All" | ResourceCategory>("All");
  const [subcategoryFilter, setSubcategoryFilter] = useState<"All" | ResourceSubcategory>("All");
  const [pickup, setPickup] = useState<string>(pickupPoints[0]);

  const filtered = useMemo(() => {
    return items.filter((r) => {

      const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
      const matchesSubcategory = subcategoryFilter === "All" || r.subcategory === subcategoryFilter;

      return matchesCategory && matchesSubcategory;
    });
  }, [items, categoryFilter, subcategoryFilter]);

  const resetFilters = () => {
    setCategoryFilter("All");
    setSubcategoryFilter("All");
  };

  // load mock data on mount so you can see cards right away
  useEffect(() => {
    setItems(getMockResources());
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
        <CardDescription>
          Add supplies you can provide and track your contributions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Responsive layout: form + list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add Resource */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Add Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v as ResourceCategory)
                    setSubcategory(RESOURCE_CATEGORIES[v as ResourceCategory][0])
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(RESOURCE_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={subcategory} onValueChange={(v) => setSubcategory(v as ResourceSubcategory)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_CATEGORIES[category].map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity + Unit */}
              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} className="h-12" />
                </div>
                <div className="space-y-2 w-28">
                  <Label>Unit</Label>
                  <Input placeholder="e.g., kits" className="h-12" />
                </div>
              </div>

              {/* Collection centre */}
              <div className="space-y-2">
                <Label>Collection Centre</Label>
                <Select value={pickup} onValueChange={setPickup}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupPoints.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full mt-4 gap-2 py-6">
                <Plus className="h-5 w-5" />
                Add Resource
              </Button>
            </CardFooter>
          </Card>

          {/* Right: My Resources list with filters */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  <CardTitle>My Donations</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-6" /> Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Filter bar */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Category</Label>
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ResourceCategory | "All")}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {Object.keys(RESOURCE_CATEGORIES).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Filter */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Subcategory</Label>
                  <Select
                    value={subcategoryFilter}
                    onValueChange={(v) => setSubcategoryFilter(v as ResourceSubcategory | "All")}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="All subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {categoryFilter !== "All" &&
                        RESOURCE_CATEGORIES[categoryFilter].map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cards list */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {filtered.map((r) => (
                  <ResourceCard key={r.id} item={r} />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    No resources match your filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}