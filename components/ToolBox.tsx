"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { FaDrawPolygon } from "react-icons/fa"
import { IoAnalyticsOutline } from "react-icons/io5"
import { MdOutlineShareLocation } from "react-icons/md"
import { MousePointer, Scissors, Crop, Edit3, Layers, Trash2, Ruler, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

export type Tool =
  | "select"
  | "polygon"
  | "line"
  | "point"
  | "split"
  | "clip"
  | "reshape"
  | "merge"
  | "delete"
  | "measure"

interface ToolboxProps {
  activeTool: Tool | null
  setActiveTool: (tool: Tool) => void
  clientMode?: boolean
  /** When true, show horizontal bar with text labels (property-analysis style) */
  horizontal?: boolean
}

const toolList: { name: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { name: "select", icon: MousePointer, label: "Select" },
  { name: "polygon", icon: FaDrawPolygon, label: "Polygon" },
  { name: "line", icon: IoAnalyticsOutline, label: "Line" },
  { name: "point", icon: MdOutlineShareLocation, label: "Point" },
  { name: "split", icon: Scissors, label: "Split" },
  { name: "clip", icon: Crop, label: "Clip" },
  { name: "reshape", icon: Edit3, label: "Reshape" },
  { name: "merge", icon: Layers, label: "Merge" },
  { name: "delete", icon: Trash2, label: "Delete" },
  { name: "measure", icon: Ruler, label: "Measure" },
]

const clientToolList: { name: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { name: "polygon", icon: FaDrawPolygon, label: "Add Feature" },
  { name: "select", icon: Edit3, label: "Edit" },
  { name: "measure", icon: Ruler, label: "Measure" },
  { name: "select", icon: Tag, label: "Label" },
]

const horizontalToolList: { name: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { name: "polygon", icon: FaDrawPolygon, label: "Add Feature" },
  { name: "select", icon: Edit3, label: "Edit" },
  { name: "reshape", icon: Edit3, label: "Reshape" },
  { name: "split", icon: Scissors, label: "Split" },
  { name: "clip", icon: Crop, label: "Cut Hole" },
  { name: "merge", icon: Layers, label: "Reclassify" },
  { name: "measure", icon: Ruler, label: "Measure" },
  { name: "select", icon: Tag, label: "Label" },
  { name: "delete", icon: Trash2, label: "Delete" },
]

const horizontalClientTools: { name: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { name: "polygon", icon: FaDrawPolygon, label: "Add Feature" },
  { name: "select", icon: Edit3, label: "Edit" },
  { name: "measure", icon: Ruler, label: "Measure" },
  { name: "select", icon: Tag, label: "Label" },
]

export default function Toolbox({ activeTool, setActiveTool, clientMode = false, horizontal = false }: ToolboxProps) {
  const displayTools = horizontal ? (clientMode ? horizontalClientTools : horizontalToolList) : clientMode ? clientToolList : toolList

  if (horizontal) {
    return (
      <TooltipProvider>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-background/95 border border-border rounded-lg shadow-lg px-2 py-1.5">
          {displayTools.map((t, i) => {
            const Icon = t.icon
            const isActive = activeTool === t.name
            return (
              <Tooltip key={`${t.name}-${t.label}-${i}`}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "gap-1.5 h-8 text-xs font-medium",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setActiveTool(t.name)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  const verticalTools = clientMode ? clientToolList : toolList
  return (
    <TooltipProvider>
      <div className="absolute top-10 right-2 bg-popover text-popover-foreground rounded-md shadow p-3 flex flex-col gap-4 z-10">
        {verticalTools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.name
          return (
            <Tooltip key={tool.name}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                  variant={isActive ? "default" : "secondary"}
                  onClick={() => setActiveTool(tool.name)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
