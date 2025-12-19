import { create } from "zustand";

type PetSelectionState = {
  selectedPetId: string | null;
  setSelectedPetId: (petId: string | null) => void;
};

export const usePetSelectionStore = create<PetSelectionState>((set) => ({
  selectedPetId: null,
  setSelectedPetId: (petId) => set({ selectedPetId: petId }),
}));
