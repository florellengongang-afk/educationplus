/**
 * Nouvelle demande (aperçu) — maquette design/ParentNouvelleDemande.dc.html,
 * adaptée aux règles du 11/10/2026 : cours uniquement à domicile ;
 * primaire = toutes les matières ; secondaire (6e → Terminale) = choix des matières.
 */
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GRADE_LABELS,
  PRIMARY_GRADES,
  SECONDARY_GRADES,
  SUBJECT_LABELS,
  cycleOf,
  normalizeSubjects,
  subjectsForGrade,
  type Grade,
  type Subject,
} from "@educationplus/shared";
import { colors } from "@educationplus/ui-tokens";
import { Button, Chip, Notice, styles } from "@/ui/kit";

export default function NewRequest() {
  const [grade, setGrade] = useState<Grade>("CM2");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const isPrimary = cycleOf(grade) === "PRIMAIRE";
  const available = useMemo(() => subjectsForGrade(grade), [grade]);

  function pickGrade(g: Grade) {
    setGrade(g);
    setSubjects((prev) => prev.filter((s) => subjectsForGrade(g).includes(s)));
    setMessage(null);
  }

  function toggle(s: Subject) {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function submit() {
    const res = normalizeSubjects(grade, subjects);
    setMessage(
      res.ok
        ? `Demande valide : ${GRADE_LABELS[grade]}, ${res.subjects.map((s) => SUBJECT_LABELS[s]).join(", ")}, à domicile.`
        : res.error,
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <Text style={styles.h1}>Nouvelle demande</Text>
        <Notice tone="info">Le répétiteur vient au domicile de l&apos;enfant.</Notice>

        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Primaire</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {PRIMARY_GRADES.map((g) => (
              <Chip key={g} label={GRADE_LABELS[g]} selected={grade === g} onPress={() => pickGrade(g)} />
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Secondaire</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SECONDARY_GRADES.map((g) => (
              <Chip key={g} label={GRADE_LABELS[g]} selected={grade === g} onPress={() => pickGrade(g)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Matières</Text>
          {isPrimary ? (
            <Notice tone="info">Au primaire, le répétiteur accompagne l&apos;enfant dans toutes les matières.</Notice>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {available.map((s) => (
                <Chip key={s} label={SUBJECT_LABELS[s]} selected={subjects.includes(s)} onPress={() => toggle(s)} />
              ))}
            </View>
          )}
        </View>

        {message ? <Notice>{message}</Notice> : null}
        <Button label="Vérifier la demande" onPress={submit} />
        <Button label="Retour" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
