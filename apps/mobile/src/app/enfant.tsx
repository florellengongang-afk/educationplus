/** Ajouter un enfant — maquette design/ParentEnfants.dc.html (prénom + classe, collecte minimale). */
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GRADE_LABELS, PRIMARY_GRADES, SECONDARY_GRADES, childSchema, cycleOf, type Grade } from "@educationplus/shared";
import { colors } from "@educationplus/ui-tokens";
import { useStore } from "@/data/store";
import { Button, Chip, Field, Notice, styles } from "@/ui/kit";

export default function AddChild() {
  const { addChild } = useStore();
  const [firstName, setFirstName] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const res = childSchema.safeParse({ firstName, grade });
    if (!res.success) {
      setError(res.error.issues[0]?.message ?? "Vérifiez les informations.");
      return;
    }
    setBusy(true);
    await addChild(res.data);
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Ajouter un enfant</Text>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Prénom de l'enfant" autoCapitalize="words" />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Primaire</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PRIMARY_GRADES.map((g) => (
                <Chip key={g} label={GRADE_LABELS[g]} selected={grade === g} onPress={() => setGrade(g)} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Secondaire</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SECONDARY_GRADES.map((g) => (
                <Chip key={g} label={GRADE_LABELS[g]} selected={grade === g} onPress={() => setGrade(g)} />
              ))}
            </View>
          </View>

          {grade ? (
            <Notice tone="info">
              {cycleOf(grade) === "PRIMAIRE"
                ? "Primaire : le répétiteur accompagne l'enfant dans toutes les matières."
                : "Secondaire : vous choisirez les matières dans la demande de cours."}
            </Notice>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Enregistrer l'enfant" onPress={save} disabled={busy} />
          <Button label="Annuler" variant="outline" onPress={() => router.back()} />
          <Text style={[styles.muted, { fontSize: 13, textAlign: "center" }]}>
            Nous ne demandons que le prénom et la classe.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
