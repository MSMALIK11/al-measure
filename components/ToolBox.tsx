
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip"; // ✅ correct import
import { FaDrawPolygon } from "react-icons/fa";
import { IoAnalyticsOutline } from "react-icons/io5";
import { MdOutlineShareLocation } from "react-icons/md";
import {
  MousePointer,
  Scissors,
  Crop,
  Edit3,
  Layers,
  Trash2,
  Ruler,
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
  /** When true, show only Draw polygon and Edit/Delete (select) for client request creation */
  clientMode?: boolean;
}

const toolList: { name: Tool; icon: any; label: string }[] = [
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
];

const clientToolList: { name: Tool; icon: any; label: string }[] = [
  { name: "polygon", icon: FaDrawPolygon, label: "Draw polygon" },
  { name: "select", icon: Edit3, label: "Edit / Delete" },
];

export default function Toolbox({ activeTool, setActiveTool, clientMode = false }: ToolboxProps) {
  const tools = clientMode ? clientToolList : toolList
  return (
    <TooltipProvider>
      <div className="absolute top-10 right-2 bg-popover text-popover-foreground rounded-md shadow p-3 flex flex-col gap-4 z-10">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Tooltip key={tool.name}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                  variant={activeTool === tool.name ? "default" : "secondary"}
                  onClick={() => setActiveTool(tool.name)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
