import {
  useCreatePetReminder,
  useDeletePetReminder,
  usePetById,
  usePetReminders,
  useUpdatePetProfile,
  useUpdatePetReminder,
} from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function formatDate(value?: string | null) {
  if (!value) return "No registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function PetRecordModal() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuthStore();
  const petId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: pet } = usePetById(petId ?? undefined);
  const { mutateAsync: updatePet, isPending } = useUpdatePetProfile(user?.id);
  const { data: reminders } = usePetReminders(petId ?? undefined);
  const { mutateAsync: createReminder, isPending: isCreatingReminder } =
    useCreatePetReminder();
  const { mutateAsync: updateReminder, isPending: isUpdatingReminder } =
    useUpdatePetReminder();
  const { mutateAsync: removeReminder, isPending: isDeletingReminder } =
    useDeletePetReminder();
  const [editMode, setEditMode] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    birthdate: "",
    sex: "",
    weight_kg: "",
    last_vaccine_at: "",
    last_deworming_at: "",
    sterilized: null as boolean | null,
    allergies: "",
    chronic_conditions: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pet) return;
    setForm({
      name: pet.name ?? "",
      species: pet.species ?? "",
      breed: pet.breed ?? "",
      birthdate: pet.birthdate ?? "",
      sex: pet.sex ?? "",
      weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : "",
      last_vaccine_at: pet.last_vaccine_at ?? "",
      last_deworming_at: pet.last_deworming_at ?? "",
      sterilized: pet.sterilized ?? null,
      allergies: pet.allergies ?? "",
      chronic_conditions: pet.chronic_conditions ?? "",
    });
  }, [pet]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  const toggleSterilized = () => {
    setForm((prev) => ({
      ...prev,
      sterilized:
        prev.sterilized == null ? true : prev.sterilized ? false : null,
    }));
  };

  const handleCreateReminder = async () => {
    if (!petId) return;
    if (!reminderTitle.trim() || !reminderDate.trim()) {
      setError("Completa el nombre y la fecha del recordatorio.");
      return;
    }
    setError(null);
    try {
      if (editingReminderId) {
        await updateReminder({
          id: editingReminderId,
          title: reminderTitle.trim(),
          description: reminderDescription.trim()
            ? reminderDescription.trim()
            : null,
          due_at: reminderDate.trim(),
        });
      } else {
        await createReminder({
          pet_id: petId,
          title: reminderTitle.trim(),
          description: reminderDescription.trim()
            ? reminderDescription.trim()
            : null,
          due_at: reminderDate.trim(),
        });
      }
      setReminderTitle("");
      setReminderDescription("");
      setReminderDate("");
      setEditingReminderId(null);
      setShowReminderModal(false);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el recordatorio.");
    }
  };

  const getReminderTone = (dueAt: string) => {
    const now = new Date();
    const due = new Date(`${dueAt}T00:00:00`);
    if (Number.isNaN(due.getTime())) return styles.reminderNeutral;
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return styles.reminderOverdue;
    if (diffDays <= 7) return styles.reminderSoon;
    return styles.reminderNeutral;
  };

  const handleSave = async () => {
    if (!petId) return;
    setError(null);
    const weight =
      form.weight_kg.trim().length === 0 ? null : Number(form.weight_kg);
    if (form.weight_kg.trim().length > 0 && Number.isNaN(weight)) {
      setError("Peso inválido.");
      return;
    }

    try {
      await updatePet({
        pet_id: petId,
        name: form.name.trim() ? form.name.trim() : null,
        species: form.species.trim() ? form.species.trim() : null,
        breed: form.breed.trim() ? form.breed.trim() : null,
        birthdate: form.birthdate.trim() ? form.birthdate.trim() : null,
        sex: form.sex.trim() ? form.sex.trim() : null,
        weight_kg: weight,
        last_vaccine_at: form.last_vaccine_at.trim()
          ? form.last_vaccine_at.trim()
          : null,
        last_deworming_at: form.last_deworming_at.trim()
          ? form.last_deworming_at.trim()
          : null,
        sterilized: form.sterilized,
        allergies: form.allergies.trim() ? form.allergies.trim() : null,
        chronic_conditions: form.chronic_conditions.trim()
          ? form.chronic_conditions.trim()
          : null,
      });
      setEditMode(false);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo actualizar la ficha.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(insets.top, 20) : 0}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.title}>
          Ficha de {pet?.name ?? "mascota"}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setEditMode((prev) => !prev)}>
            <Text style={styles.editText}>
              {editMode ? "Cancelar" : "Editar"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.card,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) + (editMode ? 140 : 20),
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Información básica</Text>
        {editMode ? (
          <>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <Text style={styles.fieldLabel}>Especie</Text>
            <TextInput
              style={styles.input}
              value={form.species}
              onChangeText={(value) => setForm((prev) => ({ ...prev, species: value }))}
            />
            <Text style={styles.fieldLabel}>Raza</Text>
            <TextInput
              style={styles.input}
              value={form.breed}
              onChangeText={(value) => setForm((prev) => ({ ...prev, breed: value }))}
            />
            <Text style={styles.fieldLabel}>Fecha de nacimiento (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.birthdate}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, birthdate: value }))
              }
            />
            <Text style={styles.fieldLabel}>Sexo</Text>
            <TextInput
              style={styles.input}
              value={form.sex}
              onChangeText={(value) => setForm((prev) => ({ ...prev, sex: value }))}
            />
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{pet?.name ?? "No registrado"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Especie</Text>
              <Text style={styles.value}>{pet?.species ?? "No registrado"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Raza</Text>
              <Text style={styles.value}>{pet?.breed ?? "No registrado"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <Text style={styles.value}>{formatDate(pet?.birthdate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Sexo</Text>
              <Text style={styles.value}>{pet?.sex ?? "No registrado"}</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Salud</Text>
        {editMode ? (
          <>
            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={form.weight_kg}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, weight_kg: value }))
              }
            />
            <Text style={styles.fieldLabel}>Última vacuna (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.last_vaccine_at}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, last_vaccine_at: value }))
              }
            />
            <Text style={styles.fieldLabel}>Última desparasitación (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.last_deworming_at}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, last_deworming_at: value }))
              }
            />
            <Text style={styles.fieldLabel}>Esterilizado</Text>
            <Pressable style={styles.toggleButton} onPress={toggleSterilized}>
              <Text style={styles.toggleText}>
                {form.sterilized == null
                  ? "No registrado"
                  : form.sterilized
                    ? "Sí"
                    : "No"}
              </Text>
            </Pressable>
            <Text style={styles.fieldLabel}>Alergias</Text>
            <TextInput
              style={styles.input}
              value={form.allergies}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, allergies: value }))
              }
            />
            <Text style={styles.fieldLabel}>Condiciones crónicas</Text>
            <TextInput
              style={styles.input}
              value={form.chronic_conditions}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, chronic_conditions: value }))
              }
            />
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Peso</Text>
              <Text style={styles.value}>
                {pet?.weight_kg != null ? `${pet.weight_kg} kg` : "No registrado"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Última vacuna</Text>
              <Text style={styles.value}>{formatDate(pet?.last_vaccine_at)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Última desparasitación</Text>
              <Text style={styles.value}>
                {formatDate(pet?.last_deworming_at)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Esterilizado</Text>
              <Text style={styles.value}>
                {pet?.sterilized == null
                  ? "No registrado"
                  : pet.sterilized
                    ? "Sí"
                    : "No"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Alergias</Text>
              <Text style={styles.value}>{pet?.allergies ?? "No registrado"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Condiciones crónicas</Text>
              <Text style={styles.value}>
                {pet?.chronic_conditions ?? "No registrado"}
              </Text>
            </View>
          </>
        )}
        <View style={styles.remindersHeader}>
          <Text style={styles.sectionTitle}>Recordatorios</Text>
          <Pressable
            style={styles.reminderAddButton}
            onPress={() => setShowReminderModal(true)}
          >
            <Text style={styles.reminderAddText}>+</Text>
          </Pressable>
        </View>

        {reminders && reminders.length === 0 && (
          <Text style={styles.mutedText}>Sin recordatorios todavía.</Text>
        )}
        {reminders?.map((reminder) => (
          <Pressable
            key={reminder.id}
            style={[styles.reminderCard, getReminderTone(reminder.due_at)]}
            onPress={() => {
              setEditingReminderId(reminder.id);
              setReminderTitle(reminder.title);
              setReminderDescription(reminder.description ?? "");
              setReminderDate(reminder.due_at);
              setShowReminderModal(true);
            }}
          >
            <Text style={styles.reminderTitle}>{reminder.title}</Text>
            <Text style={styles.reminderDate}>
              {formatDate(reminder.due_at)}
            </Text>
            {reminder.description ? (
              <Text style={styles.reminderDescription}>
                {reminder.description}
              </Text>
            ) : null}
          </Pressable>
        ))}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {editMode && (
          <Pressable
            style={[styles.saveButton, isPending && styles.saveDisabled]}
            onPress={handleSave}
            disabled={isPending}
          >
            <Text style={styles.saveText}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReminderModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>
                  {editingReminderId ? "Editar recordatorio" : "Nuevo recordatorio"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del recordatorio"
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Fecha (YYYY-MM-DD)"
                  value={reminderDate}
                  onChangeText={setReminderDate}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción (opcional)"
                  value={reminderDescription}
                  onChangeText={setReminderDescription}
                  multiline
                />
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setShowReminderModal(false);
                      setEditingReminderId(null);
                    }}
                  >
                    <Text style={styles.secondaryText}>Cancelar</Text>
                  </Pressable>
                  {editingReminderId ? (
                    <Pressable
                      style={[
                        styles.primaryButton,
                        (isUpdatingReminder || isDeletingReminder) &&
                          styles.disabledButton,
                      ]}
                      onPress={async () => {
                        await handleCreateReminder();
                      }}
                      disabled={isUpdatingReminder || isDeletingReminder}
                    >
                      <Text style={styles.primaryText}>
                        {isUpdatingReminder ? "Guardando..." : "Guardar"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        styles.primaryButton,
                        isCreatingReminder && styles.disabledButton,
                      ]}
                      onPress={handleCreateReminder}
                      disabled={isCreatingReminder}
                    >
                      <Text style={styles.primaryText}>
                        {isCreatingReminder ? "Guardando..." : "Guardar"}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {editingReminderId ? (
                  <Pressable
                    style={[
                      styles.deleteButton,
                      isDeletingReminder && styles.disabledButton,
                    ]}
                    onPress={async () => {
                      if (!editingReminderId) return;
                      await removeReminder(editingReminderId);
                      setShowReminderModal(false);
                      setEditingReminderId(null);
                      setReminderTitle("");
                      setReminderDescription("");
                      setReminderDate("");
                    }}
                    disabled={isDeletingReminder}
                  >
                    <Text style={styles.deleteText}>
                      {isDeletingReminder ? "Borrando..." : "Borrar recordatorio"}
                    </Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "600" },
  editText: { color: "#111", fontWeight: "600" },
  closeText: { color: "#333" },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginTop: 12,
    marginBottom: 8,
  },
  mutedText: { color: "#666", marginBottom: 8 },
  remindersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  reminderAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderAddText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  reminderCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
    marginBottom: 10,
  },
  reminderTitle: { fontWeight: "700", color: "#111" },
  reminderDate: { color: "#555", marginTop: 4 },
  reminderDescription: { color: "#444", marginTop: 6 },
  reminderSoon: { borderLeftWidth: 4, borderLeftColor: "#f39c12" },
  reminderOverdue: { borderLeftWidth: 4, borderLeftColor: "#e74c3c" },
  reminderNeutral: { borderLeftWidth: 4, borderLeftColor: "#bbb" },
  modalKeyboard: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
  },
  modalContent: {
    paddingBottom: 4,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryText: { color: "#111", fontWeight: "600" },
  disabledButton: { backgroundColor: "#bbb" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  deleteButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#ffe7e7",
    alignItems: "center",
  },
  deleteText: { color: "#c0392b", fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { color: "#666", flex: 1 },
  value: { color: "#111", flex: 1, textAlign: "right" },
  fieldLabel: { color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 10,
  },
  toggleText: { fontWeight: "600", color: "#444" },
  errorText: { color: "#c0392b", marginBottom: 10 },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveDisabled: { backgroundColor: "#bbb" },
  saveText: { color: "#fff", fontWeight: "600" },
});
