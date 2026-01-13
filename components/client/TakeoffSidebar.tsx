"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useFeatureStore } from "@/app/store/useClientStore"
import { 
  Ruler, 
  MapPin, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  DollarSign,
  Clock,
  Layers
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const categories = [
  "Pavement",
  "Driveway",
  "Parking spot",
  "Hedge",
  "Tree",
  "Hard edge",
  "Soft Edge",
  "Mulch Bed",
  "Gravel Bed",
  "Drive Lanes",
  "Rough Mow",
  "Private sidewalk",
  "Primary mow",
  "Secondary mow",
  "Shrub Count",
  "Public sidewalk",
]

export default function TakeoffSidebar({ areaSqft }: { areaSqft?: number | string }) {
  const [takeoffType, setTakeoffType] = useState("landscaping")
  const [features, setFeatures] = useState<string[]>(["pavement"])
  const [unit, setUnit] = useState<"sqft" | "acres">("sqft")
  const { openModal, closeModal } = useFeatureStore()

  const toggleFeature = (f: string) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  // Conversion logic
  const sqft = Number(areaSqft) || 0
  const displayValue = unit === "sqft" 
    ? sqft.toLocaleString() 
    : (sqft / 43560).toFixed(2)

  return (
    <div className="w-[380px] bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-lg">
            <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Takeoff Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure your measurement
            </p>
          </div>
        </div>

        {/* Lot Area Card */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Lot Area
                </span>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                Active
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {displayValue}
              </span>
              <Select value={unit} onValueChange={(v: "sqft" | "acres") => setUnit(v)}>
                <SelectTrigger className="w-[80px] h-8 text-xs border-emerald-300 dark:border-emerald-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">sq ft</SelectItem>
                  <SelectItem value="acres">acres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Info Alert */}
        <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 dark:text-blue-100">
            Al-Measure will not modify any lot boundaries or parcels that you have edited or drawn.
          </p>
        </div>

        {/* Takeoff Type */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Takeoff Type
          </Label>
          <Select value={takeoffType} onValueChange={setTakeoffType}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select takeoff type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscaping">Landscaping + Snow</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
              <SelectItem value="paving">Paving</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Property Features */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
              Property Features
            </Label>
            <Badge variant="outline" className="text-xs">
              {features.length} selected
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {categories.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 p-2.5 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                onClick={() => toggleFeature(f.toLowerCase())}
              >
                <Checkbox
                  checked={features.includes(f.toLowerCase())}
                  onCheckedChange={() => toggleFeature(f.toLowerCase())}
                  className="pointer-events-none"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white">
            Summary
          </Label>
          <Card className="border-2">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Ruler className="h-4 w-4" />
                  <span>Lot Area</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {areaSqft} sq ft
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  <span>Estimated Price</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  TBD
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Estimated Time</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  TBD
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50 dark:bg-gray-900">
        <Button 
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white gap-2" 
          onClick={openModal}
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirm & Review Takeoff
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-11" 
          onClick={closeModal}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          variant="ghost" 
          className="w-full h-11 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Not My Property
        </Button>
      </div>
    </div>
  )
}
