"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MousePointer,
  PencilLine,
  Brush,
  Circle,
  Scissors,
  Crop,
  Edit3,
  Layers,
  Trash2,
  Ruler
} from "lucide-react";

type Tool =
  | "select"
  | "polygon"
  | "line"
  | "point"
  | "split"
  | "clip"
  | "reshape"
  | "merge"
  | "delete"
  | "measure";

interface ToolboxProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool) => void;
}

const toolList: { name: Tool; icon: any; label: string }[] = [
  { name: "select", icon: MousePointer, label: "Select" },
  { name: "polygon", icon: PencilLine, label: "Polygon" },
  { name: "line", icon: Brush, label: "Line" },
  { name: "point", icon: Circle, label: "Point" },
  { name: "split", icon: Scissors, label: "Split" },
  { name: "clip", icon: Crop, label: "Clip" },
  { name: "reshape", icon: Edit3, label: "Reshape" },
  { name: "merge", icon: Layers, label: "Merge" },
  { name: "delete", icon: Trash2, label: "Delete" },
  { name: "measure", icon: Ruler, label: "Measure" },
];

export default function Toolbox({ activeTool, setActiveTool }: ToolboxProps) {
  return (
    <div className="absolute top-4 left-1/3 bg-popover text-popover-foreground rounded-md shadow p-3 flex gap-4  z-10 ">
      <span className="col-span-2 text-xs font-semibold">Tools</span>
      {toolList.map((tool) => (
        <Tooltip key={tool.name}>
  <TooltipTrigger asChild>
    <Button
      size="sm"
      className="hover:bg-accent hover:text-accent-foreground"
      variant={activeTool === tool.name ? "default" : "secondary"}
      onClick={() => setActiveTool(tool.name)}
    >
      <tool.icon className="w-4 h-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="left">{tool.label}</TooltipContent>
</Tooltip>
      ))}
    </div>
  );
}
