import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, H, Header, T } from "@/components/ui";
import { requestQuote } from "@/lib/api";
import { useBooking } from "@/lib/booking";
import { C, F, R } from "@/theme";

const CATEGORIES = ["Groceries", "Electronics", "Merchandise", "Tours & Safaris", "BnB", "Building Materials", "Other"];

export default function Market() {
  const { b } = useBooking();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [open, setOpen] = useState(false);
  const [supplierContact, setSupplierContact] = useState("");
  const [phone, setPhone] = useState(b.phone);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await requestQuote({ description, category, supplierContact, customerPhone: phone });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Savvy Market" subtitle="Request a quote • we source it for you" back={false} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={s.ethical}>
          <Ionicons name="leaf" size={18} color={C.gold} />
          <Text style={s.ethicalText}>Ethical sourcing • vetted local suppliers</Text>
        </View>
        {done ? (
          <Card style={{ alignItems: "center", gap: 8 }}>
            <Ionicons name="checkmark-circle" size={56} color={C.trafficFree} />
            <H style={{ color: C.jungle }}>Request sent</H>
            <T style={{ textAlign: "center", color: C.muted }}>We&apos;ll WhatsApp you a quote shortly with the supplier price and our service margin shown separately.</T>
            <Button title="New request" variant="outline" onPress={() => { setDone(false); setDescription(""); }} style={{ alignSelf: "stretch", marginTop: 8 }} />
          </Card>
        ) : (
          <Card>
            <H style={{ fontSize: 19 }}>Request Quote</H>
            <Text style={s.label}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} multiline placeholder="What do you need? Quantity, brand, budget, deadline…" placeholderTextColor="#8A8A8A" style={[s.input, { height: 110, textAlignVertical: "top", paddingTop: 12 }]} />

            <Text style={s.label}>Category</Text>
            <Pressable onPress={() => setOpen((v) => !v)} style={[s.input, s.dropdown]}>
              <Text style={{ fontFamily: F.body, fontSize: 15 }}>{category}</Text>
              <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={C.jungle} />
            </Pressable>
            {open && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {CATEGORIES.map((c) => (
                  <Chip key={c} label={c} active={c === category} onPress={() => { setCategory(c); setOpen(false); }} />
                ))}
              </View>
            )}

            <Text style={s.label}>Supplier contact (optional)</Text>
            <TextInput value={supplierContact} onChangeText={setSupplierContact} placeholder="Preferred shop or supplier phone" placeholderTextColor="#8A8A8A" style={s.input} />

            <Text style={s.label}>Your phone</Text>
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+254 7XX XXX XXX" placeholderTextColor="#8A8A8A" style={s.input} />

            <View style={s.note}>
              <Ionicons name="information-circle" size={18} color={C.jungle} />
              <T style={{ flex: 1, fontSize: 13 }}>Our service margin is +15–20%, agreed case-by-case and shown separately before you pay. No hidden fees.</T>
            </View>
            {!!error && <T style={{ color: C.maroon, marginTop: 8 }}>{error}</T>}
            <Button title="Request Quote" icon="paper-plane" onPress={submit} loading={busy} disabled={description.trim().length < 5 || phone.replace(/\D/g, "").length < 9} style={{ marginTop: 14 }} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  ethical: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: C.jungle, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  ethicalText: { fontFamily: F.semi, color: C.gold, fontSize: 13 },
  label: { fontFamily: F.bodySemi, fontSize: 14, color: C.ink, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.border, backgroundColor: "#F7F5F0", borderRadius: R.button, paddingHorizontal: 12, height: 50, fontFamily: F.body, fontSize: 15, color: C.ink },
  dropdown: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  note: { flexDirection: "row", gap: 8, backgroundColor: C.mint, borderRadius: R.button, padding: 12, marginTop: 14 },
});
