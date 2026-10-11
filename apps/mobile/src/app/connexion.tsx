/**
 * Inscription — maquette design/ParentConnexion.dc.html.
 * Phase 0 : validation locale avec les schémas partagés ; l'appel à l'API arrive en phase 1.
 */
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signupSchema } from "@educationplus/shared";
import { colors } from "@educationplus/ui-tokens";
import { Button, Chip, Field, Notice, styles } from "@/ui/kit";

type Errors = Partial<Record<"name" | "phone" | "password" | "acceptTerms", string>>;

export default function Signup() {
  const [role, setRole] = useState<"PARENT" | "TEACHER">("PARENT");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  function submit() {
    const res = signupSchema.safeParse({ name, phone, password, role, acceptTerms: accept });
    if (!res.success) {
      const next: Errors = {};
      for (const issue of res.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setDone(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <Text style={styles.h1}>Créer un compte</Text>
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Je suis</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip label="Parent" selected={role === "PARENT"} onPress={() => setRole("PARENT")} />
              <Chip label="Répétiteur" selected={role === "TEACHER"} onPress={() => setRole("TEACHER")} />
            </View>
          </View>
          <Field label="Nom complet" value={name} onChangeText={setName} placeholder="Ex. : Florence Ngo" error={errors.name} />
          <Field
            label="Numéro de téléphone"
            prefix="+237"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="6XX XX XX XX"
            error={errors.phone}
          />
          <Field
            label="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="8 caractères, dont un chiffre"
            error={errors.password}
          />
          <Chip
            label={accept ? "✓ J'accepte les conditions et la politique de confidentialité" : "J'accepte les conditions et la politique de confidentialité"}
            selected={accept}
            onPress={() => setAccept(!accept)}
          />
          {errors.acceptTerms ? <Text style={styles.error}>{errors.acceptTerms}</Text> : null}
          {done ? (
            <Notice tone="info">Informations valides. La création du compte et le code SMS arrivent en phase 1.</Notice>
          ) : null}
          <Button label="Créer mon compte" onPress={submit} />
          <Button label="Retour" variant="outline" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
