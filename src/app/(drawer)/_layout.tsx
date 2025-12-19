import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { PetDrawerContent } from "@/components/pet-drawer-content";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      drawerContent={(props) => <PetDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerLeft: () => <DrawerToggleButton tintColor={Colors[colorScheme ?? "light"].text} />,
        headerStyle: { backgroundColor: Colors[colorScheme ?? "light"].background },
        headerTintColor: Colors[colorScheme ?? "light"].text,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: "Pettii",
        }}
      />
    </Drawer>
  );
}
