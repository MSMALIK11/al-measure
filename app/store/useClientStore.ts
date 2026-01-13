import { create } from "zustand";
import { persist } from "zustand/middleware";

// FeatureInfo type
export type FeatureInfo = {
  type: string;
  area?: number;
  length?: number;
  unit?: string;
  id: string;
  createdAt: string;
  updatedAt: string;
};

// Store state type
type FeatureInfoState = {
  features: FeatureInfo[];
  addFeature: (partial: Omit<FeatureInfo, "id" | "createdAt" | "updatedAt">) => FeatureInfo;
  updateFeature: (id: string, updates: Partial<Omit<FeatureInfo, "id" | "createdAt">>) => void;
  removeFeature: (id: string) => void;
  clearFeatures: () => void;
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

// Create the store
export const useFeatureStore = create<FeatureInfoState>()(
  persist(
    (set) => ({
      features: [],
      isOpen: false,

      openModal: () => set({ isOpen: true }),
      closeModal: () => set({ isOpen: false }),
      addFeature: (partial) => {
        const now = new Date().toISOString();
        const feature: FeatureInfo = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          ...partial,
        };
        set((s) => ({ features: [feature, ...s.features] }));
        return feature;
      },

      updateFeature: (id, updates) =>
        set((s) => ({
          features: s.features.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        })),

      removeFeature: (id) =>
        set((s) => ({ features: s.features.filter((f) => f.id !== id) })),

      clearFeatures: () => set({ features: [] }),
    }),
    {
      name: "feature-info-db",
    }
  )
);
