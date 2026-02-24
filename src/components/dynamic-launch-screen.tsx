import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

type DynamicLaunchScreenProps = {
  logoUrl?: string | null;
};

export function DynamicLaunchScreen({ logoUrl }: DynamicLaunchScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logoImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.logoFallback} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 70,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
});
