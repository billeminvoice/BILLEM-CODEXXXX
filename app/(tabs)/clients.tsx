import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, SafeAreaView, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useClients } from '@/hooks/useClients';
import { useAlert } from '@/template';
import { ClientCard, Input, Button } from '@/components';
import { addressService, type AddressSuggestion } from '@/services/addressService';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';

function NewClientModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const { showAlert } = useAlert();

  const searchAddresses = async (value: string) => {
    setAddress(value);
    const suggestions = await addressService.autocomplete(value);
    setAddressSuggestions(suggestions);
  };

  const applyAddress = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.street || suggestion.label);
    setCity(suggestion.city || city);
    setState(suggestion.state || state);
    setZipCode(suggestion.zipCode || zipCode);
    setCountry(suggestion.country || country);
    setAddressSuggestions([]);
  };

  const handleSave = () => {
    if (!name.trim()) { showAlert('Required', 'Client name is required.'); return; }
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim(), address: address.trim(), city: city.trim(), state: state.trim(), zipCode: zipCode.trim(), country: country.trim() });
    setName(''); setEmail(''); setPhone(''); setCompany(''); setAddress(''); setCity(''); setState(''); setZipCode(''); setCountry('United States'); setAddressSuggestions([]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New client</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input label="Client name" placeholder="John Smith" value={name} onChangeText={setName} leftIcon="person" required />
            <Input label="Email" placeholder="client@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="email" />
            <Input label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
            <Input label="Company" placeholder="Company Inc." value={company} onChangeText={setCompany} leftIcon="business" />
            <Input label="Address" placeholder="123 Main St, City, State" value={address} onChangeText={searchAddresses} leftIcon="home" />
            {addressSuggestions.length > 0 ? (
              <View style={styles.addressDropdown}>
                {addressSuggestions.map((suggestion) => (
                  <Pressable key={suggestion.id} style={styles.addressRow} onPress={() => applyAddress(suggestion)}>
                    <Text style={styles.addressRowText}>{suggestion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.addressRowGrid}>
              <View style={{ flex: 1 }}><Input label="City" placeholder="City" value={city} onChangeText={setCity} /></View>
              <View style={{ flex: 1 }}><Input label="State" placeholder="State" value={state} onChangeText={setState} /></View>
            </View>
            <View style={styles.addressRowGrid}>
              <View style={{ flex: 1 }}><Input label="ZIP" placeholder="ZIP" value={zipCode} onChangeText={setZipCode} /></View>
              <View style={{ flex: 1 }}><Input label="Country" placeholder="Country" value={country} onChangeText={setCountry} /></View>
            </View>
            <Button title="Save Client" onPress={handleSave} fullWidth size="lg" />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ClientsScreen() {
  const { clients, loadClients, createClient, deleteClient } = useClients();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = useMemo(() =>
    clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  const handleDelete = (id: string, name: string) => {
    showAlert('Delete client', `Remove ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteClient(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Pressable onPress={() => setShowNew(true)} style={styles.addBtn}>
          <MaterialIcons name="person-add" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search clients..." placeholderTextColor={Colors.textTertiary} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={styles.clientRow}>
            <View style={{ flex: 1 }}>
              <ClientCard client={item} onPress={() => {}} />
            </View>
            <Pressable onPress={() => handleDelete(item.id, item.name)} style={styles.delBtn} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={20} color={Colors.textTertiary} />
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>{search ? 'No matching clients' : 'No clients yet'}</Text>
            <Text style={styles.emptySubtitle}>Add a client to start sending invoices</Text>
            {!search ? <Button title="Add first client" onPress={() => setShowNew(true)} size="sm" style={{ marginTop: 8 }} /> : null}
          </View>
        }
      />

      <NewClientModal visible={showNew} onClose={() => setShowNew(false)} onSave={async (d) => { await createClient(d); setShowNew(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.title, color: Colors.text, includeFontPadding: false },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingRight: 12, ...Shadow.sm },
  searchIcon: { paddingLeft: 14, paddingRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 12, includeFontPadding: false },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  delBtn: { paddingLeft: 8, paddingVertical: 12 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { ...Typography.subheading, color: Colors.textSecondary, includeFontPadding: false },
  emptySubtitle: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', includeFontPadding: false },
  modalScreen: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  modalContent: { padding: Spacing.xl, gap: Spacing.md },
  addressDropdown: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface },
  addressRow: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  addressRowText: { ...Typography.bodySmall, color: Colors.text, includeFontPadding: false },
  addressRowGrid: { flexDirection: 'row', gap: 10 },
});
