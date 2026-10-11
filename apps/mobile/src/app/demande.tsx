/**
 * Nouvelle demande de cours à domicile — maquette design/ParentNouvelleDemande.dc.html.
 * Primaire = toutes les matières ; secondaire (6e → Terminale) = choix des matières.
 */
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GRADE_LABELS,
  SUBJECT_LABELS,
  courseRequestSchema,
  cycleOf,
  subjectsForGrade,
  type Subject,
} from "@educationplus/shared";
import { colors } from "@educationplus/ui-tokens";
import { useStore } from "@/data/store";
import { Button, Chip, Field, Notice, styles } from "@/ui/kit";

const DAYS = [
  { n: 1, label: "Lun" },
  { n: 2, label: "Mar" },
  { n: 3, label: "Mer" },
  { n: 4, label: "Jeu" },
  { n: 5, label: "Ven" },
  { n: 6, label: "Sam" },
  { n: 7, label: "Dim" },
];
const SLOTS = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["14:00", "16:00"],
  ["15:00", "17:00"],
  ["16:00", "18:00"],
  ["17:00", "19:00"],
] as const;
const DURATIONS = [1, 3, 6, 9];

/** "JJ/MM/AAAA" → "AAAA-MM-JJ" (ou null si invalide). */
function toIsoDate(fr: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

export default function NewRequest() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, addRequest } = useStore();
  const child = children.find((c) => c.id === childId);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [neighbourhood, setNeighbourhood] = useState("");
  const [city, setCity] = useState("Yaoundé");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [slot, setSlot] = useState<number | null>(null);
  const [duration, setDuration] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!child) return <Redirect href="/accueil" />;
  const isPrimary = cycleOf(child.grade) === "PRIMAIRE";

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function submit() {
    if (!child) return;
    if (slot === null) return setError("Choisissez un créneau horaire.");
    const iso = toIsoDate(startDate);
    if (!iso) return setError("Date de démarrage au format JJ/MM/AAAA.");
    const pair = SLOTS[slot]!;
    const res = courseRequestSchema.safeParse({
      childId: child.id,
      grade: child.grade,
      subjects,
      neighbourhood,
      city,
      weekdays: [...weekdays].sort(),
      startTime: pair[0],
      endTime: pair[1],
      durationMonths: duration,
      startDate: iso,
    });
    if (!res.success) return setError(res.error.issues[0]?.message ?? "Vérifiez la demande.");
    setError(null);
    setBusy(true);
    const r = res.data;
    await addRequest({
      childId: r.childId,
      grade: r.grade,
      subjects: r.subjects,
      neighbourhood: r.neighbourhood,
      city: r.city,
      weekdays: r.weekdays,
      startTime: r.startTime,
      endTime: r.endTime,
      startDate: r.startDate,
      durationMonths: r.durationMonths,
    });
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4 }}>
            <Text style={styles.muted}>
              {child.firstName} · {GRADE_LABELS[child.grade]}
            </Text>
            <Text style={styles.h1}>Chercher un répétiteur</Text>
          </View>
          <Notice tone="info">Le répétiteur vient à votre domicile.</Notice>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Matières</Text>
            {isPrimary ? (
              <Notice tone="info">Primaire : toutes les matières sont couvertes.</Notice>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {subjectsForGrade(child.grade).map((sub) => (
                  <Chip key={sub} label={SUBJECT_LABELS[sub]} selected={subjects.includes(sub)} onPress={() => setSubjects(toggle(subjects, sub))} />
                ))}
              </View>
            )}
          </View>

          <Field label="Quartier" value={neighbourhood} onChangeText={setNeighbourhood} placeholder="Ex. : Bastos" />
          <Field label="Ville" value={city} onChangeText={setCity} />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Jours</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DAYS.map((d) => (
                <Chip key={d.n} label={d.label} selected={weekdays.includes(d.n)} onPress={() => setWeekdays(toggle(weekdays, d.n))} />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Créneau</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SLOTS.map((p, i) => (
                <Chip key={p[0] + p[1]} label={`${p[0]}–${p[1]}`} selected={slot === i} onPress={() => setSlot(i)} />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Durée du programme</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DURATIONS.map((m) => (
                <Chip key={m} label={`${m} mois`} selected={duration === m} onPress={() => setDuration(m)} />
              ))}
            </View>
          </View>

          <Field
            label="Date de démarrage"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="JJ/MM/AAAA"
            keyboardType="numbers-and-punctuation"
          />

          {error ? <Notice>{error}</Notice> : null}
          <Button label="Publier la demande" onPress={submit} disabled={busy} />
          <Button label="Annuler" variant="outline" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
