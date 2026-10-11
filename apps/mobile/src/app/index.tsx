/** Écran Bienvenue — maquette design/ParentBienvenue.dc.html. */
import { Redirect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@educationplus/ui-tokens";
import { useStore } from "@/data/store";
import { Button } from "@/ui/kit";

const PROMISES = [
  { title: "Un répétiteur à domicile", body: "Jusqu'à 10 enseignants se proposent, du SIL à la Terminale." },
  { title: "Suivez chaque cours à distance", body: "Appel, début, fin et compte rendu sur votre téléphone." },
  { title: "Payez à votre rythme", body: "Cycles de 30 jours : en une fois, en deux fois ou en plusieurs versements." },
];

export default function Welcome() {
  const { account } = useStore();
  if (account) return <Redirect href="/accueil" />;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>
          Education<Text style={{ color: colors.accentMint }}>Plus</Text>
        </Text>
        <Text style={styles.title}>Le soutien scolaire à domicile, suivi séance après séance.</Text>
        <View style={{ gap: 22, marginTop: 8 }}>
          {PROMISES.map((p) => (
            <View key={p.title} style={styles.row}>
              <View style={styles.dot} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>{p.title}</Text>
                <Text style={styles.rowBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button label="Créer un compte" variant="light" href="/connexion" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: 28, paddingTop: 40, gap: 24 },
  brand: { fontFamily: fonts.display, fontSize: 28, color: "#FFFFFF" },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: "#FFFFFF", letterSpacing: -1 },
  row: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  dot: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#0E4E3B" },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: "#FFFFFF" },
  rowBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.onPrimarySoft },
  actions: { padding: 24, gap: 10 },
});
