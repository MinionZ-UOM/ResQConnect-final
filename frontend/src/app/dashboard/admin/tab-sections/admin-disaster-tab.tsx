"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Disaster } from "@/lib/types";
import { mockDisasters } from "@/lib/mock-data";
import DisasterCard from "../../../../components/ui/disaster-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export default function AdminDisastersTab() {
  const [rows, setRows] = useState<Disaster[]>([]);
  const [selected, setSelected] = useState<Disaster | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setRows(mockDisasters);
  }, []);

  function handleSave(updated: Disaster) {
    if (isNew) {
      // new disasters go directly to Registered
      const newDisaster = {
        ...updated,
        id: `d-${Date.now()}`,
        status: "Registered" as const,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
      };
      setRows((cur) => [...cur, newDisaster]);
    } else {
      const updatedDisaster = {
        ...updated,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : updated.imageUrl,
      };
      setRows((cur) =>
        cur.map((d) => (d.id === updatedDisaster.id ? updatedDisaster : d))
      );
    }
    setSelected(null);
    setIsNew(false);
    setImageFile(null);
  }

  function handleDelete(d: Disaster) {
    setRows((cur) => cur.filter((x) => x.id !== d.id));
  }

  function handleApprove(id: string) {
    setRows((cur) =>
      cur.map((d) => (d.id === id ? { ...d, status: "Registered" } : d))
    );
    toast({
      title: "✅ Approved",
      description: "Disaster has been moved to Registered.",
    });
  }

  function handleReject(id: string) {
    setRows((cur) => cur.filter((d) => d.id !== id));
    toast({
      title: "❌ Rejected",
      description: "Disaster has been removed.",
    });
  }

  const pending = rows.filter((d) => d.status === "Pending");
  const registered = rows.filter((d) => d.status === "Registered");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Disaster Management</h2>
        <Button
          onClick={() => {
            setSelected({
              id: "",
              name: "",
              description: "",
              type: "Flood",
              severity: "Medium",
              location: { latitude: 0, longitude: 0, address: "" },
              createdAt: new Date().toISOString(),
              status: "Registered", 
              suggestedByAI: false,
            });
            setIsNew(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Disaster
        </Button>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">AI Suggested Disasters</h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {pending.map((d) => (
              <DisasterCard
                key={d.id}
                disaster={d}
                onEdit={setSelected}
                onDelete={handleDelete}
                onApprove={handleApprove} 
                onReject={handleReject}  
              />
            ))}
          </div>
        </>
      )}

      {/* Registered */}
      {registered.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Registered Disasters</h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {registered.map((d) => (
              <DisasterCard
                key={d.id}
                disaster={d}
                onEdit={setSelected}
                onDelete={handleDelete}
                onApprove={handleApprove} 
                onReject={handleReject}  
              />
            ))}
          </div>
        </>
      )}

      {/* Edit/Register Modal */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isNew ? "Register New Disaster" : "Edit Disaster"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Disaster Name"
                value={selected.name}
                onChange={(e) =>
                  setSelected({ ...selected, name: e.target.value })
                }
              />
              <Textarea
                placeholder="Description"
                value={selected.description}
                onChange={(e) =>
                  setSelected({ ...selected, description: e.target.value })
                }
              />
              <Input
                placeholder="Address"
                value={selected.location.address}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    location: { ...selected.location, address: e.target.value },
                  })
                }
              />
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Disaster Image</label>

                {/* If a new file is chosen, preview it */}
                {imageFile ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="New upload preview"
                      className="w-full h-40 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setImageFile(null)} // reset back to original
                    >
                      Remove New Image
                    </Button>
                  </div>
                ) : selected.imageUrl ? (
                  // Show current saved image
                  <div className="space-y-2">
                    <img
                      src={selected.imageUrl}
                      alt={selected.name}
                      className="w-full h-40 object-cover rounded-md border"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(e.target.files ? e.target.files[0] : null)
                      }
                    />
                  </div>
                ) : (
                  // No image yet
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setImageFile(e.target.files ? e.target.files[0] : null)
                    }
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleSave(selected)}>
                {isNew ? "Register" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}