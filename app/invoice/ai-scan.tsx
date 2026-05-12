import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useAuth } from '@/hooks/useAuth';
import { aiService } from '@/services/aiService';
import { storage } from '@/services/storageService';
import { invoiceService } from '@/services/invoiceService';
import { STORAGE_KEYS, PLANS } from '@/constants/config';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import { useAlert } from '@/template';
import type { PlanId } from '@/types';
import type { AIExtractionResult } from '@/services/aiService';

type Stage = 'pick' | 'scanning' | 'review' | 'error';

interface ScanStep {
  label: string;
  done: boolean;
}

export default function AIScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [stage, setStage] = useState<Stage>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AIExtractionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { label: 'Reading image pixels...', done: false },
    { label: 'Extracting text with OCR...', done: false },
    { label: 'Identifying line items...', done: false },
    { label: 'Calculating totals...', done: false },
    { label: 'Structuring invoice data...', done: false },
  ]);

  const plan = PLANS[((user as any)?.planId || 'free') as PlanId];

  const checkScanLimit = async () => {
    if (plan.aiScansPerMonth === -1) return true;
    const stored = await storage.get<{ month: string; count: number }>(STORAGE_KEYS.AI_SCAN_COUNT);
    const month = new Date().toISOString().slice(0, 7);
    const count = stored?.month === month ? stored.count : 0;
    if (count >= plan.aiScansPerMonth) {
      showAlert(
        'Scan limit reached',
        `Your ${plan.name} plan includes ${plan.aiScansPerMonth} AI scan(s)/month. Upgrade to Pro for unlimited scans.`,
        [
          { text: 'Upgrade', onPress: () => router.push('/settings/plans') },
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
        ]
      );
      return false;
    }
    return true;
  };

  const consumeScan = async () => {
    if (plan.aiScansPerMonth === -1) return;
    const stored = await storage.get<{ month: string; count: number }>(STORAGE_KEYS.AI_SCAN_COUNT);
    const month = new Date().toISOString().slice(0, 7);
    const count = stored?.month === month ? stored.count : 0;
    await storage.set(STORAGE_KEYS.AI_SCAN_COUNT, { month, count: count + 1 });
  };

  const pickImage = async () => {
    const ok = await checkScanLimit();
    if (!ok) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please grant photo library access in Settings to use AI scanning.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsEditing: false,
    });
    if (picked.canceled || !picked.assets[0]) return;
    runScan(picked.assets[0].uri);
  };

  const pickDocument = async () => {
    const ok = await checkScanLimit();
    if (!ok) return;
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets[0]) return;
    runScan(picked.assets[0].uri);
  };

  const pasteScreenshot = async () => {
    const ok = await checkScanLimit();
    if (!ok) return;
    try {
      const image = await Clipboard.getImageAsync({ format: 'png' });
      if (!image?.data) {
        showAlert('Clipboard empty', 'Copy a screenshot first, then tap Paste Screenshot.');
        return;
      }
      await runScanDataUrl(image.data);
    } catch {
      showAlert('Paste unavailable', 'This device or browser does not allow image clipboard access here.');
    }
  };

  const takePhoto = async () => {
    const ok = await checkScanLimit();
    if (!ok) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please grant camera access in Settings.');
      return;
    }
    const taken = await ImagePicker.launchCameraAsync({
      quality: 0.92,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (taken.canceled || !taken.assets[0]) return;
    runScan(taken.assets[0].uri);
  };

  const animateSteps = () => {
    const delays = [200, 600, 1200, 1800, 2400];
    delays.forEach((delay, i) => {
      setTimeout(() => {
        setScanSteps((prev) => prev.map((s, idx) => (idx <= i ? { ...s, done: true } : s)));
      }, delay);
    });
  };

  const runScan = async (uri: string) => {
    setImageUri(uri);
    setScanSteps((prev) => prev.map((s) => ({ ...s, done: false })));
    setStage('scanning');
    animateSteps();

    try {
      const extracted = await aiService.extractFromImage(uri);
      await consumeScan();
      setResult(extracted);
      setStage('review');
    } catch (e: any) {
      const msg = e.message || 'Could not analyze the image. Please try a clearer photo.';
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const runScanDataUrl = async (dataUrl: string) => {
    setImageUri(dataUrl);
    setScanSteps((prev) => prev.map((s) => ({ ...s, done: false })));
    setStage('scanning');
    animateSteps();

    try {
      const extracted = await aiService.extractFromDataUrl(dataUrl);
      await consumeScan();
      setResult(extracted);
      setStage('review');
    } catch (e: any) {
      const msg = e.message || 'Could not analyze the image. Please try a clearer screenshot.';
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const handleUseData = () => {
    if (!result) return;
    const lineItems = result.lineItems.map((li) => ({
      ...invoiceService.newLineItem(),
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
      amount: li.quantity * li.rate,
    }));
    const prefill = JSON.stringify({
      clientName: result.clientName,
      clientEmail: result.clientEmail,
      clientAddress: result.clientAddress,
      lineItems,
      taxRate: result.taxRate,
      discountValue: result.discountValue,
      discountType: result.discountType,
      notes: result.notes,
      dueDate: result.dueDate,
      issueDate: result.issueDate,
      currency: result.currency,
    });
    router.replace({ pathname: '/invoice/create', params: { prefill } });
  };

  /* ── Pick stage ── */
  if (stage === 'pick') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Invoice Scan</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.pickContent} showsVerticalScrollIndicator={false}>
          <Image
            source={require('@/assets/images/ai-scan-hero.png')}
            style={styles.heroImg}
            contentFit="contain"
            transition={200}
          />

          <View style={styles.aiBadge}>
            <MaterialIcons name="auto-awesome" size={14} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>AI extraction · Line items in seconds</Text>
          </View>

          <Text style={styles.pickTitle}>Upload your document</Text>
          <Text style={styles.pickSubtitle}>
            Point at a receipt, estimate, or screenshot — our AI reads every line item, price, and client detail automatically.
          </Text>

          <View style={styles.uploadOptions}>
            <Pressable onPress={pickImage} style={styles.uploadCard}>
              <LinearGradient colors={['#EFF6FF', '#F0FDF4']} style={styles.uploadCardGrad}>
                <MaterialIcons name="photo-library" size={36} color={Colors.primary} />
                <Text style={styles.uploadCardTitle}>Photo Library</Text>
                <Text style={styles.uploadCardDesc}>Select from camera roll</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={takePhoto} style={styles.uploadCard}>
              <LinearGradient colors={['#FDF2F8', '#FFF7ED']} style={styles.uploadCardGrad}>
                <MaterialIcons name="camera-alt" size={36} color={Colors.accent} />
                <Text style={styles.uploadCardTitle}>Take Photo</Text>
                <Text style={styles.uploadCardDesc}>Capture document now</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.secondaryUploadRow}>
            <Pressable onPress={pickDocument} style={styles.secondaryUploadBtn}>
              <MaterialIcons name="upload-file" size={18} color={Colors.primary} />
              <Text style={styles.secondaryUploadText}>Upload PDF or document</Text>
            </Pressable>
            <Pressable onPress={pasteScreenshot} style={styles.secondaryUploadBtn}>
              <MaterialIcons name="content-paste" size={18} color={Colors.accent} />
              <Text style={[styles.secondaryUploadText, { color: Colors.accent }]}>Paste screenshot</Text>
            </Pressable>
          </View>

          <View style={styles.supportedList}>
            <Text style={styles.supportedTitle}>Works great with</Text>
            {[
              'Receipts & invoices',
              'Estimates & quotes',
              'Screenshots of messages',
              'Purchase orders',
              'Expense reports',
              'Handwritten notes',
            ].map((item) => (
              <View key={item} style={styles.supportedItem}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.supportedText}>{item}</Text>
              </View>
            ))}
          </View>

          {plan.aiScansPerMonth !== -1 ? (
            <View style={styles.limitBanner}>
              <MaterialIcons name="info-outline" size={16} color={Colors.warning} />
              <Text style={styles.limitText}>
                {plan.name} plan: {plan.aiScansPerMonth} AI scan/month.{' '}
                <Text onPress={() => router.push('/settings/plans')} style={styles.limitLink}>
                  Upgrade for unlimited
                </Text>
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ── Scanning stage ── */
  if (stage === 'scanning') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.scanningContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.scanThumb} contentFit="cover" />
          ) : null}
          <LinearGradient
            colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.95)']}
            style={styles.scanGradient}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
            </View>
          </View>
          <View style={styles.scanInfo}>
            <LinearGradient colors={['#3B82F6', '#818CF8']} style={styles.scanSpinner}>
              <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
            <Text style={styles.scanTitle}>Analyzing your document…</Text>
            <Text style={styles.scanSubtitle}>AI is reading every detail. This takes a few seconds.</Text>
            <View style={styles.scanStepsList}>
              {scanSteps.map((step, i) => (
                <View key={i} style={styles.scanStep}>
                  {step.done
                    ? <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                    : <View style={styles.scanStepDot} />}
                  <Text style={[styles.scanStepText, step.done && styles.scanStepDone]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Error stage ── */
  if (stage === 'error') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Scan Failed</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.errorContent}>
          <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.errorIcon}>
            <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          </LinearGradient>
          <Text style={styles.errorTitle}>Could not extract data</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <View style={styles.errorTips}>
            <Text style={styles.errorTipsTitle}>Tips for better results:</Text>
            {[
              'Ensure the document is well-lit',
              'Keep the camera steady and in focus',
              'Make sure text is clearly visible',
              'Try a flat surface without glare',
            ].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <MaterialIcons name="lightbulb-outline" size={14} color={Colors.warning} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
          <View style={styles.errorActions}>
            <Pressable onPress={() => setStage('pick')} style={styles.retryBtn}>
              <MaterialIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/invoice/create')} style={styles.manualBtn}>
              <Text style={styles.manualText}>Create manually</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Review stage ── */
  const confidencePct = Math.round((result?.confidence || 0) * 100);
  const confColor = confidencePct >= 85 ? Colors.success : confidencePct >= 65 ? Colors.warning : Colors.error;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: result?.currency || 'USD' }).format(n);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => setStage('pick')} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Extracted Data</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
        {/* Confidence bar */}
        <View style={styles.confidenceCard}>
          <View style={styles.confRow}>
            <MaterialIcons name="auto-awesome" size={18} color={confColor} />
            <Text style={styles.confTitle}>AI Confidence</Text>
            <Text style={[styles.confPct, { color: confColor }]}>{confidencePct}%</Text>
          </View>
          <View style={styles.confBarBg}>
            <View style={[styles.confBarFill, { width: `${confidencePct}%` as any, backgroundColor: confColor }]} />
          </View>
          <Text style={styles.confHint}>
            {confidencePct >= 85
              ? 'High accuracy — data looks great!'
              : confidencePct >= 65
              ? 'Good accuracy — review any highlighted fields'
              : 'Low accuracy — please review all fields carefully'}
          </Text>
        </View>

        {/* Client info */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Client information</Text>
          <View style={styles.reviewCard}>
            <ReviewRow label="Name" value={result?.clientName} placeholder="Not detected" />
            <ReviewRow label="Email" value={result?.clientEmail} placeholder="Not detected" />
            {result?.clientPhone ? <ReviewRow label="Phone" value={result.clientPhone} /> : null}
            {result?.clientAddress ? <ReviewRow label="Address" value={result.clientAddress} /> : null}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.reviewLabel}>Line Items</Text>
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>{result?.lineItems.length} items</Text>
            </View>
          </View>
          {result?.lineItems.map((item, i) => (
            <View key={i} style={[styles.reviewCard, { gap: 6 }]}>
              <Text style={styles.reviewItemDesc}>{item.description}</Text>
              <View style={styles.reviewItemMath}>
                <Text style={styles.reviewKey}>{item.quantity} × {fmt(item.rate)}</Text>
                <Text style={styles.reviewItemAmt}>{fmt(item.quantity * item.rate)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Summary</Text>
          <View style={styles.reviewCard}>
            {result?.taxRate ? <ReviewRow label="Tax rate" value={`${result.taxRate}%`} /> : null}
            {result?.discountValue ? <ReviewRow label="Discount" value={`${result.discountValue}%`} /> : null}
            {result?.currency ? <ReviewRow label="Currency" value={result.currency} /> : null}
            {result?.dueDate ? <ReviewRow label="Due date" value={result.dueDate} /> : null}
            {result?.issueDate ? <ReviewRow label="Issue date" value={result.issueDate} /> : null}
            {result?.invoiceNumber ? <ReviewRow label="Invoice #" value={result.invoiceNumber} /> : null}
            {result?.notes ? <ReviewRow label="Notes" value={result.notes} /> : null}
          </View>
        </View>

        <View style={styles.reviewActions}>
          <Pressable onPress={() => setStage('pick')} style={styles.reviewBtnSecondary}>
            <MaterialIcons name="refresh" size={16} color={Colors.textSecondary} />
            <Text style={styles.reviewBtnSecText}>Scan again</Text>
          </Pressable>
          <Pressable onPress={handleUseData} style={styles.reviewBtnPrimary}>
            <LinearGradient colors={['#3B82F6', '#818CF8']} style={styles.reviewBtnGrad}>
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={styles.reviewBtnText}>Use this data</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  const hasValue = value && value.trim().length > 0;
  return (
    <View style={rrStyles.row}>
      <Text style={rrStyles.key}>{label}</Text>
      <Text style={[rrStyles.val, !hasValue && rrStyles.placeholder]}>
        {hasValue ? value : (placeholder || '—')}
      </Text>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  key: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, includeFontPadding: false },
  val: { ...Typography.bodySmall, color: Colors.text, fontWeight: '500', flex: 2, textAlign: 'right', includeFontPadding: false },
  placeholder: { color: Colors.textTertiary, fontStyle: 'italic', fontWeight: '400' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.heading, color: Colors.text, includeFontPadding: false },

  // Pick
  pickContent: { padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  heroImg: { width: '100%', height: 200 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  aiBadgeText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600', includeFontPadding: false },
  pickTitle: { ...Typography.title, color: Colors.text, textAlign: 'center', includeFontPadding: false },
  pickSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, includeFontPadding: false },
  uploadOptions: { flexDirection: 'row', gap: 14, width: '100%' },
  uploadCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  uploadCardGrad: { padding: Spacing.lg, alignItems: 'center', gap: 8 },
  uploadCardTitle: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  uploadCardDesc: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  secondaryUploadRow: { flexDirection: 'row', gap: 10, width: '100%' },
  secondaryUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 12,
    ...Shadow.sm,
  },
  secondaryUploadText: { ...Typography.buttonSm, color: Colors.primary, textAlign: 'center', includeFontPadding: false },
  supportedList: { width: '100%', gap: 10 },
  supportedTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: 4, includeFontPadding: false },
  supportedItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  supportedText: { ...Typography.body, color: Colors.text, includeFontPadding: false },
  limitBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.warningLight, padding: Spacing.md,
    borderRadius: Radius.md, width: '100%',
  },
  limitText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, includeFontPadding: false },
  limitLink: { color: Colors.primary, fontWeight: '600' },

  // Scanning
  scanningContainer: { flex: 1, position: 'relative' },
  scanThumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  scanGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scannerFrame: { width: 220, height: 160, position: 'relative' },
  scannerCorner: { position: 'absolute', width: 24, height: 24, borderColor: '#3B82F6', borderWidth: 3 },
  scannerCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  scannerCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  scannerCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  scannerCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, gap: 12, alignItems: 'center' },
  scanSpinner: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { ...Typography.title, color: '#fff', textAlign: 'center', includeFontPadding: false },
  scanSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', includeFontPadding: false },
  scanStepsList: { gap: 8, alignSelf: 'stretch' },
  scanStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanStepDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  scanStepText: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.6)', includeFontPadding: false },
  scanStepDone: { color: '#fff', fontWeight: '500' },

  // Error
  errorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 16 },
  errorIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { ...Typography.title, color: Colors.text, textAlign: 'center', includeFontPadding: false },
  errorMsg: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, includeFontPadding: false },
  errorTips: { width: '100%', backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: Spacing.md, gap: 8 },
  errorTipsTitle: { ...Typography.label, color: Colors.text, marginBottom: 4, includeFontPadding: false },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { ...Typography.bodySmall, color: Colors.textSecondary, includeFontPadding: false },
  errorActions: { flexDirection: 'row', gap: 12, width: '100%' },
  retryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md,
  },
  retryText: { ...Typography.button, color: '#fff', includeFontPadding: false },
  manualBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  manualText: { ...Typography.button, color: Colors.textSecondary, includeFontPadding: false },

  // Review
  reviewContent: { padding: Spacing.xl, gap: Spacing.md },
  confidenceCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confTitle: { ...Typography.label, color: Colors.text, flex: 1, includeFontPadding: false },
  confPct: { ...Typography.heading, includeFontPadding: false },
  confBarBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: 6, borderRadius: 3 },
  confHint: { ...Typography.caption, color: Colors.textSecondary, includeFontPadding: false },
  reviewSection: { gap: 8 },
  reviewSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewLabel: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, includeFontPadding: false },
  reviewBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  reviewBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', includeFontPadding: false },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: 8, ...Shadow.sm },
  reviewItemDesc: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  reviewItemMath: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewKey: { ...Typography.bodySmall, color: Colors.textSecondary, includeFontPadding: false },
  reviewItemAmt: { ...Typography.subheading, color: Colors.primary, includeFontPadding: false },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  reviewBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14,
  },
  reviewBtnSecText: { ...Typography.button, color: Colors.textSecondary, includeFontPadding: false },
  reviewBtnPrimary: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  reviewBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  reviewBtnText: { ...Typography.button, color: '#fff', includeFontPadding: false },
});
