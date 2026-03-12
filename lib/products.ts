/**
 * Al-Measure product line — software we build and sell
 */
export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  icon: string // lucide icon name
}

export const PRODUCTS: Product[] = [
  {
    id: "meridian",
    name: "Meridian",
    tagline: "AI-powered takeoff & measurement",
    description:
      "Precision measurement and quantity takeoff for landscaping, paving, irrigation, and hardscape. Draw on map, get areas and lengths in seconds.",
    icon: "Compass",
  },
  {
    id: "scope",
    name: "Scope",
    tagline: "Request & property assessment",
    description:
      "Manage client requests, property details, and assessments in one place. From submission to assignment with full audit trail.",
    icon: "FileSearch",
  },
  {
    id: "caliber",
    name: "Caliber",
    tagline: "QA & verification suite",
    description:
      "Quality assurance workflows and verification tools so every measurement and request meets your standards before it goes to the field.",
    icon: "CheckCircle2",
  },
  {
    id: "forge",
    name: "Forge",
    tagline: "Field operations & task workflow",
    description:
      "Task lists, maps, and tools for field crews. Assign work, track progress, and keep everyone aligned from office to site.",
    icon: "Hammer",
  },
  {
    id: "align",
    name: "Align",
    tagline: "Analytics & admin control",
    description:
      "Dashboards, user management, and process controls. One place to see status, assign roles, and run operations at scale.",
    icon: "LayoutDashboard",
  },
]
