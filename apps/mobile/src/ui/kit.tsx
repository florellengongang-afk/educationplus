import { router, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, minTouch, radius } from "@educationplus/ui-tokens";

type Variant = "primary" | "outline" | "light" | "ghost";

const variantStyle = {
  primary: { bg: colors.primary, fg: "#FFFFFF", border: colors.primary },
  outline: { bg: "transparent", fg: colors.ink, border: colors.ink },
  light: { bg: "#FFFFFF", fg: colors.primary, border: "#FFFFFF" },
  /** Bouton secondaire sur fond vert. */
  ghost: { bg: "transparent", fg: "#FFFFFF", border: "#7FC9A8" },
} as const;

export function Button(props: { label: string; onPress?: () => void; href?: Href; variant?: Variant; disabled?: boolean }) {
  const v = variantStyle[props.variant ?? "primary"];
  const { href, onPress } = props;
  return (
    <Pressable
      accessibilityRole={href ? "link" : "button"}
      disabled={props.disabled}
      onPress={href ? () => router.push(href) : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, opacity: props.disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: v.fg }]}>{props.label}</Text>
    </Pressable>
  );
}

export function Chip(props: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected, disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        styles.chip,
        props.selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
      ]}
    >
      <Text style={[styles.chipText, props.selected ? { color: "#FFFFFF", fontFamily: fonts.bodyBold } : null]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string; error?: string; prefix?: string }) {
  const { label, error, prefix, ...input } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {prefix ? (
          <View style={[styles.input, { justifyContent: "center" }]}>
            <Text style={styles.inputText}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#6B7A73"
          style={[styles.input, styles.inputText, { flex: 1 }, error ? { borderColor: colors.danger } : null]}
          {...input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  const bg = tone === "warning" ? colors.warningSoft : colors.primarySoft;
  const fg = tone === "warning" ? "#4A2E0B" : colors.primaryDark;
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Text style={[styles.noticeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  chip: {
    minHeight: minTouch - 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  inputText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.dangerText },
  notice: { borderRadius: 14, padding: 14 },
  noticeText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, lineHeight: 22 },
});
