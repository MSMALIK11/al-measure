"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export default function TakeoffSidebar() {
  const [takeoffType, setTakeoffType] = useState("landscaping")
  const [features, setFeatures] = useState<string[]>(["pavement"])

  const toggleFeature = (f: string) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  return (
    <div className="w-[340px] bg-card border-r h-screen p-4 flex flex-col">
      {/* Header */}
      <Card className="mb-4 shadow-none border-none">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-lg font-semibold">
            Takeoff Details
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            3350 Garnet Place, Columbus, OH, USA
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
              Lot Area
            </span>
            <span className="font-medium">304,810 sqft</span>
          </div>
        </CardContent>
      </Card>

      {/* Info text */}
      <p className="text-xs text-muted-foreground mb-4">
        Attentive will not make any modifications or adjustments to the lot boundaries
        or parcels that you have edited or drawn.
      </p>

      {/* Dropdown */}
      <div className="mb-4">
        <Label className="mb-1 block text-sm font-medium">Takeoff Type</Label>
        <Select value={takeoffType} onValueChange={setTakeoffType}>
          <SelectTrigger>
            <SelectValue placeholder="Select takeoff type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscaping">Landscaping + Snow</SelectItem>
            <SelectItem value="roofing">Roofing</SelectItem>
            <SelectItem value="paving">Paving</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Features checkboxes */}
      <div className="mb-4">
        <Label className="mb-2 block text-sm font-medium">Property Features</Label>
        <div className="space-y-2">
          {["Pavement", "Driveway", "Parking Spot", "Hedge"].map((f) => (
            <div key={f} className="flex items-center space-x-2">
              <Checkbox
                checked={features.includes(f.toLowerCase())}
                onCheckedChange={() => toggleFeature(f.toLowerCase())}
              />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-muted rounded-md p-3 mb-4 text-sm">
        <p className="flex items-center justify-between">
          <span>Lot Area:</span>
          <span className="font-medium">304,8sssss10 sqft (7.0 acres)</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Price:</span>
          <span className="font-medium">$35.12</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Estimated Time:</span>
          <span className="font-medium">05:00 hours</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className=" flex flex-col gap-2">
        <Button className="w-full">Confirm Lot Boundary and Review Takeoff</Button>
        <Button variant="outline" className="w-full">
          Cancel
        </Button>
        <Button variant="ghost" className="w-full text-destructive">
          Not My Property
        </Button>
      </div>
    </div>
  )
}
