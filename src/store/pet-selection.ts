import { create } from "zustand";

type PetSelectionState = {
  selectedPetId: string | null;
  selectedPetName: string | null;
  setSelectedPetId: (petId: string | null) => void;
  setSelectedPetName: (name: string | null) => void;
};

export const usePetSelectionStore = create<PetSelectionState>((set) => ({
  selectedPetId: null,
  selectedPetName: null,
  setSelectedPetId: (petId) => set({ selectedPetId: petId }),
  setSelectedPetName: (name) => set({ selectedPetName: name }),
}));
