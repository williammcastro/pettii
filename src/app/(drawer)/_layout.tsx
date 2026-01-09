import { PetDrawerContent } from "@/components/pet-drawer-content";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePetSelectionStore } from "@/store/pet-selection";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const selectedPetName = usePetSelectionStore((s) => s.selectedPetName);
  const headerTitle = selectedPetName ?? "Pettii";

  return (
    <Drawer
      drawerContent={(props) => <PetDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerLeft: () => <DrawerToggleButton tintColor={Colors[colorScheme ?? "light"].text} />,
        headerStyle: { backgroundColor: Colors[colorScheme ?? "light"].background },
        headerTintColor: Colors[colorScheme ?? "light"].text,
        headerTitle,
        headerShadowVisible: false,// revisar si la coloco luego, por ahora me gusta.
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{}}
      />
    </Drawer>
  );
}
