/**
 * Accueil parent — maquettes design/Main.dc.html et ParentAccueilVide.dc.html.
 * Le bouton « Ajouter un enfant » est fixe sous l'en-tête : seule la liste en dessous défile.
 */
import { Redirect, router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GRADE_LABELS, SUBJECT_LABELS, cycleOf } from "@educationplus/shared";
import { colors, fonts, radius } from "@educationplus/ui-tokens";
import { useStore } from "@/data/store";
import { Button } from "@/ui/kit";

const DAYS = ["", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

export default function Home() {
  const { account, children, requests, signOut } = useStore();
  if (!account) return <Redirect href="/" />;

  const firstName = account.name.split(" ")[0];
  const initials = account.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  function confirmSignOut() {
    Alert.alert("Se déconnecter ?", "Les informations enregistrées sur ce téléphone seront effacées.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => signOut().then(() => router.replace("/")) },
    ]);
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      {/* En-tête */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>Espace parent</Text>
          <Text style={s.hello} numberOfLines={1}>
            Bonjour, {firstName}
          </Text>
        </View>
        <View style={s.avatar} accessibilityLabel={account.name}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Bouton fixe, ne défile pas */}
      <View style={s.fixedAction}>
        <Button label="+  Ajouter un enfant" href="/enfant" />
      </View>

      {/* Contenu défilant */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        {children.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Ajoutez votre premier enfant</Text>
            <Text style={s.muted}>
              Indiquez sa classe. Au primaire, le répétiteur couvre toutes les matières ; au secondaire, vous choisissez
              les matières.
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.section}>Mes enfants</Text>
            {children.map((c) => {
              const childRequests = requests.filter((r) => r.childId === c.id);
              return (
                <View key={c.id} style={s.card}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={s.childBadge}>
                      <Text style={s.childBadgeText}>{c.firstName[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{c.firstName}</Text>
                      <Text style={s.muted}>
                        {GRADE_LABELS[c.grade]} · {cycleOf(c.grade) === "PRIMAIRE" ? "Primaire" : "Secondaire"}
                      </Text>
                    </View>
                  </View>
                  {childRequests.length > 0 ? (
                    <View style={s.requestBox}>
                      <Text style={s.requestTitle}>Demande publiée · recherche d&apos;enseignants</Text>
                      <Text style={s.mutedSmall}>
                        {childRequests[0]!.subjects.map((x) => SUBJECT_LABELS[x]).join(", ")} ·{" "}
                        {childRequests[0]!.weekdays.map((d) => DAYS[d]).join(" ")} {childRequests[0]!.startTime}–
                        {childRequests[0]!.endTime} · {childRequests[0]!.neighbourhood}
                      </Text>
                    </View>
                  ) : (
                    <Button
                      label="Chercher un répétiteur"
                      variant="outline"
                      href={{ pathname: "/demande", params: { childId: c.id } }}
                    />
                  )}
                </View>
              );
            })}
          </>
        )}
        <Pressable accessibilityRole="button" onPress={confirmSignOut} style={s.signOut}>
          <Text style={s.signOutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  kicker: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  hello: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" },
  fixedAction: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  section: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.hero, padding: 20, gap: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  mutedSmall: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 16, gap: 12 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  childBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  childBadgeText: { fontFamily: fonts.display, fontSize: 18, color: colors.primary },
  requestBox: { backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12, gap: 4 },
  requestTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.warningText },
  signOut: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.dangerText },
});
