/**
 * Inscription parent — maquette design/ParentConnexion.dc.html.
 * Version de test : le compte est enregistré sur le téléphone (l'API et le code SMS arrivent en phase 1).
 */
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signupSchema } from "@educationplus/shared";
import { colors } from "@educationplus/ui-tokens";
import { useStore } from "@/data/store";
import { Button, Field, styles } from "@/ui/kit";

type Errors = Partial<Record<"name" | "phone" | "password" | "acceptTerms", string>>;

export default function Signup() {
  const { signUp } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const res = signupSchema.safeParse({ name, phone, password, role: "PARENT", acceptTerms: accept });
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
    setBusy(true);
    await signUp({ name: res.data.name, phone: res.data.phone });
    router.replace("/accueil");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Créer un compte parent</Text>
          <Field label="Nom complet" value={name} onChangeText={setName} placeholder="Votre nom" error={errors.name} />
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
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accept }}
            onPress={() => setAccept(!accept)}
            style={{ flexDirection: "row", gap: 12, alignItems: "center", minHeight: 44 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: accept ? colors.primary : colors.fieldBorder,
                backgroundColor: accept ? colors.primary : colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {accept ? <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>✓</Text> : null}
            </View>
            <Text style={[styles.muted, { flex: 1, fontSize: 14 }]}>
              J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
            </Text>
          </Pressable>
          {errors.acceptTerms ? <Text style={styles.error}>{errors.acceptTerms}</Text> : null}
          <Button label="Créer mon compte" onPress={submit} disabled={busy} />
          <Button label="Retour" variant="outline" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
