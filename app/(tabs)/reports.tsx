import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { Header } from '@/components';
import { DASHBOARD_METRICS, AR_AGING, MOCK_PROVIDERS } from '@/constants/mockData';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';

const REPORT_TYPES = [
  { key: 'financial', label: 'Financial', icon: 'account-balance' },
  { key: 'visit', label: 'Visit', icon: 'event-note' },
  { key: 'charge', label: 'Charge', icon: 'receipt-long' },
  { key: 'payment', label: 'Payment', icon: 'payments' },
  { key: 'ar', label: 'AR Aging', icon: 'hourglass-bottom' },
  { key: 'denial', label: 'Denial', icon: 'cancel' },
  { key: 'provider', label: 'Provider', icon: 'medical-services' },
  { key: 'claims', label: 'Claims', icon: 'assignment' },
];

const MONTHLY_DATA = [
  { month: 'Jan', charges: 52100, payments: 44800, adjustments: 3100 },
  { month: 'Feb', charges: 48300, payments: 41200, adjustments: 2800 },
  { month: 'Mar', charges: 55900, payments: 48600, adjustments: 3600 },
  { month: 'Apr', charges: 58320, payments: 49800, adjustments: 4100 },
];

const DENIAL_REASONS = [
  { reason: 'CO-4: Service inconsistent with diagnosis', count: 8, percentage: 32 },
  { reason: 'CO-11: Diagnosis inconsistent with procedure', count: 5, percentage: 20 },
  { reason: 'CO-97: Payment adjusted for prior payer', count: 4, percentage: 16 },
  { reason: 'CO-18: Duplicate claim/service', count: 3, percentage: 12 },
  { reason: 'PR-1: Deductible not met', count: 3, percentage: 12 },
  { reason: 'Other reasons', count: 2, percentage: 8 },
];

const VISIT_TYPES = [
  { type: 'Office Visit – New Patient', count: 34, revenue: 8925 },
  { type: 'Office Visit – Established', count: 87, revenue: 16905 },
  { type: 'Annual Wellness Visit', count: 18, revenue: 4680 },
  { type: 'Chronic Care Management', count: 12, revenue: 3120 },
  { type: 'Preventive Care', count: 5, revenue: 1250 },
];

const CHARGE_DATA = [
  { code: '99214', desc: 'Office Visit Est. Mod.', units: 42, charge: 9660, avg: 230 },
  { code: '99213', desc: 'Office Visit Est. Low', units: 38, charge: 6840, avg: 180 },
  { code: '93306', desc: 'Echocardiography', units: 6, charge: 5100, avg: 850 },
  { code: '93000', desc: 'ECG Routine', units: 29, charge: 2175, avg: 75 },
  { code: '85025', desc: 'CBC with Differential', units: 31, charge: 1395, avg: 45 },
  { code: '71046', desc: 'X-Ray Chest 2 Views', units: 14, charge: 1680, avg: 120 },
  { code: '99215', desc: 'Office Visit Est. High', units: 8, charge: 2480, avg: 310 },
  { code: '36415', desc: 'Routine Venipuncture', units: 22, charge: 550, avg: 25 },
];

const PAYMENT_DATA = [
  { payer: 'BlueCross BlueShield', payments: 18420, claims: 28, avg: 658, method: 'ERA/835' },
  { payer: 'Aetna', payments: 12180, claims: 19, avg: 641, method: 'ERA/835' },
  { payer: 'United Healthcare', payments: 9640, claims: 14, avg: 689, method: 'Check' },
  { payer: 'Medicare', payments: 7850, claims: 22, avg: 357, method: 'ERA/835' },
  { payer: 'Cigna', payments: 4210, claims: 8, avg: 526, method: 'EFT' },
  { payer: 'Medicaid', payments: 1200, claims: 6, avg: 200, method: 'Check' },
  { payer: 'Patient Payments', payments: 3180, claims: 41, avg: 78, method: 'Card/Cash' },
];

function getAgingColor(bucket: string) {
  if (bucket.includes('0-30')) return Colors.success;
  if (bucket.includes('31-60')) return Colors.info;
  if (bucket.includes('61-90')) return Colors.warning;
  return Colors.danger;
}

// ──────────────────────────────────────────
// CSV GENERATION HELPERS
// ──────────────────────────────────────────
function escCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToLine(cells: (string | number)[]): string {
  return cells.map(escCsv).join(',');
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [rowToLine(headers), ...rows.map(rowToLine)];
  return lines.join('\n');
}

function generateCsv(reportKey: string, claims: ReturnType<typeof useApp>['claims']): { csv: string; name: string } {
  const date = new Date().toISOString().slice(0, 10);

  switch (reportKey) {
    case 'financial':
      return {
        name: `Financial_Report_${date}.csv`,
        csv: buildCsv(
          ['Month', 'Total Charges ($)', 'Payments ($)', 'Adjustments ($)', 'Net Revenue ($)'],
          MONTHLY_DATA.map(d => [
            d.month, d.charges, d.payments, d.adjustments, d.payments - d.adjustments,
          ])
        ),
      };

    case 'visit':
      return {
        name: `Visit_Report_${date}.csv`,
        csv: buildCsv(
          ['Visit Type', 'Count', 'Revenue ($)', 'Avg Revenue ($)'],
          VISIT_TYPES.map(v => [
            v.type, v.count, v.revenue, (v.revenue / v.count).toFixed(2),
          ])
        ),
      };

    case 'charge':
      return {
        name: `Charge_Report_${date}.csv`,
        csv: buildCsv(
          ['CPT Code', 'Description', 'Units', 'Total Charge ($)', 'Avg Charge ($)'],
          CHARGE_DATA.map(c => [c.code, c.desc, c.units, c.charge, c.avg])
        ),
      };

    case 'payment':
      return {
        name: `Payment_Report_${date}.csv`,
        csv: buildCsv(
          ['Payer', 'Total Payments ($)', 'Claims', 'Avg Payment ($)', 'Method'],
          PAYMENT_DATA.map(p => [p.payer, p.payments, p.claims, p.avg, p.method])
        ),
      };

    case 'ar':
      return {
        name: `AR_Aging_Report_${date}.csv`,
        csv: buildCsv(
          ['Aging Bucket', 'Amount ($)', 'Claims Count', 'Percentage (%)'],
          AR_AGING.map(r => [r.bucket, r.amount, r.count, r.percentage])
        ),
      };

    case 'denial':
      return {
        name: `Denial_Report_${date}.csv`,
        csv: buildCsv(
          ['Denial Reason', 'Count', 'Percentage (%)', 'Estimated Revenue at Risk ($)'],
          DENIAL_REASONS.map(d => [
            d.reason, d.count, d.percentage, (d.count * 350).toFixed(2),
          ])
        ),
      };

    case 'provider': {
      const providerRows = MOCK_PROVIDERS.map(p => {
        const pClaims = claims.filter(c => c.providerId === p.id);
        const charges = pClaims.reduce((s, c) => s + c.totalCharge, 0);
        const collected = pClaims.reduce((s, c) => s + c.paidAmount, 0);
        const rate = charges > 0 ? ((collected / charges) * 100).toFixed(1) : '0';
        return [p.name, p.specialty, p.npi, pClaims.length, charges.toFixed(2), collected.toFixed(2), `${rate}%`];
      });
      return {
        name: `Provider_Report_${date}.csv`,
        csv: buildCsv(
          ['Provider', 'Specialty', 'NPI', 'Claims', 'Total Charges ($)', 'Collected ($)', 'Collection Rate'],
          providerRows
        ),
      };
    }

    case 'claims':
    default:
      return {
        name: `Claims_Report_${date}.csv`,
        csv: buildCsv(
          ['Claim #', 'Patient', 'Provider', 'DOS', 'Insurance', 'Total Charge ($)', 'Allowed ($)', 'Paid ($)', 'Adjustments ($)', 'Patient Balance ($)', 'Status'],
          claims.map(c => [
            c.claimNumber, c.patientName, c.providerName, c.dos,
            c.insuranceCompany, c.totalCharge.toFixed(2), c.allowedAmount.toFixed(2),
            c.paidAmount.toFixed(2), c.adjustments.toFixed(2), c.patientBalance.toFixed(2), c.status,
          ])
        ),
      };
  }
}

export default function ReportsScreen() {
  const { claims, appointments } = useApp();
  const { showAlert } = useAlert();
  const [activeReport, setActiveReport] = useState('financial');
  const [exporting, setExporting] = useState(false);

  const maxBar = Math.max(...MONTHLY_DATA.map(d => d.charges));
  const maxCharge = Math.max(...CHARGE_DATA.map(d => d.charge));

  const providerStats = MOCK_PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    color: p.color,
    claims: claims.filter(c => c.providerId === p.id).length,
    revenue: claims.filter(c => c.providerId === p.id).reduce((s, c) => s + c.paidAmount, 0),
    charges: claims.filter(c => c.providerId === p.id).reduce((s, c) => s + c.totalCharge, 0),
    visits: appointments.filter(a => a.providerId === p.id).length,
  }));

  const totalPayments = PAYMENT_DATA.reduce((s, d) => s + d.payments, 0);

  const handleExport = async (reportKey: string) => {
    if (exporting) return;
    setExporting(true);
    try {
      const { csv, name } = generateCsv(reportKey, claims);

      if (Platform.OS === 'web') {
        showAlert('Export Ready', `${name} has been generated. Download will begin shortly.`);
        setExporting(false);
        return;
      }

      const fileUri = FileSystem.cacheDirectory + name;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${name}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        showAlert('Export Saved', `Report saved to: ${fileUri}`);
      }
    } catch (err) {
      showAlert('Export Error', 'Could not generate the report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const ExportBtn = ({ reportKey, label }: { reportKey: string; label: string }) => (
    <Pressable
      onPress={() => handleExport(reportKey)}
      style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
      disabled={exporting}
    >
      {exporting ? (
        <ActivityIndicator size={12} color={Colors.primary} />
      ) : (
        <MaterialIcons name="download" size={14} color={Colors.primary} />
      )}
      <Text style={styles.exportText}>{exporting ? 'Exporting...' : 'Export Excel'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <Header
        title="Reports & Analytics"
        subtitle="Revenue Cycle Intelligence"
        rightAction={{
          icon: 'download',
          onPress: () => handleExport(activeReport),
        }}
      />

      {/* Report Type Tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {REPORT_TYPES.map(rt => (
            <Pressable
              key={rt.key}
              onPress={() => setActiveReport(rt.key)}
              style={[styles.tab, activeReport === rt.key && styles.tabActive]}
            >
              <MaterialIcons
                name={rt.icon as any}
                size={14}
                color={activeReport === rt.key ? '#fff' : 'rgba(255,255,255,0.45)'}
              />
              <Text style={[styles.tabText, activeReport === rt.key && styles.tabTextActive]}>
                {rt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ===== FINANCIAL REPORT ===== */}
        {activeReport === 'financial' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Financial Summary — April 2026</Text>
              <ExportBtn reportKey="financial" label="Financial Report" />
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderTopColor: Colors.primary }]}>
                <Text style={styles.kpiLabel}>Total Charges</Text>
                <Text style={styles.kpiValue}>${(DASHBOARD_METRICS.chargesThisMonth / 1000).toFixed(1)}k</Text>
                <Text style={[styles.kpiChange, { color: Colors.success }]}>▲ 12%</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.success }]}>
                <Text style={styles.kpiLabel}>Payments</Text>
                <Text style={styles.kpiValue}>${(DASHBOARD_METRICS.paymentsThisMonth / 1000).toFixed(1)}k</Text>
                <Text style={[styles.kpiChange, { color: Colors.success }]}>▲ 8%</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.warning }]}>
                <Text style={styles.kpiLabel}>Adjustments</Text>
                <Text style={styles.kpiValue}>${(DASHBOARD_METRICS.adjustmentsThisMonth / 1000).toFixed(1)}k</Text>
                <Text style={[styles.kpiChange, { color: Colors.danger }]}>▼ 3%</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Revenue Trend</Text>
              <View style={styles.chart}>
                {MONTHLY_DATA.map(d => (
                  <View key={d.month} style={styles.barGroup}>
                    <View style={styles.bars}>
                      <View style={[styles.bar, { height: (d.charges / maxBar) * 110, backgroundColor: Colors.primary }]} />
                      <View style={[styles.bar, { height: (d.payments / maxBar) * 110, backgroundColor: Colors.success }]} />
                      <View style={[styles.bar, { height: (d.adjustments / maxBar) * 110, backgroundColor: Colors.warning }]} />
                    </View>
                    <Text style={styles.barLabel}>{d.month}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.legend}>
                {[
                  { color: Colors.primary, label: 'Charges' },
                  { color: Colors.success, label: 'Payments' },
                  { color: Colors.warning, label: 'Adjustments' },
                ].map(l => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Key Performance Indicators</Text>
              {[
                { label: 'Collection Rate', value: `${DASHBOARD_METRICS.collectionRate}%`, status: 'warning' },
                { label: 'Denial Rate', value: `${DASHBOARD_METRICS.denialRate}%`, status: 'danger' },
                { label: 'Avg Days to Payment', value: `${DASHBOARD_METRICS.avgDaysToPayment} days`, status: 'info' },
                { label: 'AR Over 90 Days', value: `$${DASHBOARD_METRICS.arOver90.toLocaleString()}`, status: 'danger' },
                { label: 'Total Active Patients', value: DASHBOARD_METRICS.totalPatients.toLocaleString(), status: 'success' },
                { label: 'Claims This Month', value: String(DASHBOARD_METRICS.claimsThisMonth), status: 'info' },
              ].map(row => (
                <View key={row.label} style={styles.kpiRow2}>
                  <Text style={styles.kpiRow2Label}>{row.label}</Text>
                  <Text style={[styles.kpiRow2Value, { color: (Colors as any)[row.status] }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.collCard}>
              <View style={styles.collHeader}>
                <Text style={styles.cardTitle}>Collection Rate</Text>
                <Text style={[styles.collRate, { color: DASHBOARD_METRICS.collectionRate >= 90 ? Colors.success : Colors.warning }]}>
                  {DASHBOARD_METRICS.collectionRate}%
                </Text>
              </View>
              <View style={styles.collTrack}>
                <View style={[styles.collFill, { width: `${DASHBOARD_METRICS.collectionRate}%` as any, backgroundColor: DASHBOARD_METRICS.collectionRate >= 90 ? Colors.success : Colors.warning }]} />
              </View>
              <View style={styles.benchmarkRow}>
                <Text style={styles.benchmarkLabel}>Target: 95%</Text>
                <Text style={styles.benchmarkLabel}>Industry Avg: 90–95%</Text>
              </View>
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('financial')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Financial Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== VISIT REPORT ===== */}
        {activeReport === 'visit' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Visit Report — April 2026</Text>
              <ExportBtn reportKey="visit" label="Visit Report" />
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderTopColor: Colors.primary }]}>
                <Text style={styles.kpiLabel}>Total Visits</Text>
                <Text style={styles.kpiValue}>{VISIT_TYPES.reduce((s, v) => s + v.count, 0)}</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.success }]}>
                <Text style={styles.kpiLabel}>New Patients</Text>
                <Text style={styles.kpiValue}>34</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.warning }]}>
                <Text style={styles.kpiLabel}>No Shows</Text>
                <Text style={styles.kpiValue}>7</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Visit Type Breakdown</Text>
              {VISIT_TYPES.map((v) => (
                <View key={v.type} style={styles.visitRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.visitType}>{v.type}</Text>
                    <View style={styles.visitBarTrack}>
                      <View style={[styles.visitBarFill, { width: `${(v.count / 87) * 100}%` as any }]} />
                    </View>
                  </View>
                  <View style={styles.visitStats}>
                    <Text style={styles.visitCount}>{v.count}</Text>
                    <Text style={styles.visitRevenue}>${v.revenue.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Visit Summary by Provider</Text>
              {providerStats.map(ps => (
                <View key={ps.id} style={styles.providerVisitRow}>
                  <View style={[styles.providerDot, { backgroundColor: ps.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerRowName}>{ps.name}</Text>
                    <Text style={styles.providerRowSpec}>{ps.specialty}</Text>
                  </View>
                  <View style={styles.providerVisitStats}>
                    <Text style={styles.pvCount}>{ps.visits}</Text>
                    <Text style={styles.pvLabel}>visits</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Daily Visit Trend</Text>
              <View style={styles.weekGrid}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
                  const counts = [14, 12, 18, 16, 10];
                  const h = (counts[i] / 18) * 80;
                  return (
                    <View key={day} style={styles.weekCol}>
                      <Text style={styles.weekCount}>{counts[i]}</Text>
                      <View style={[styles.weekBar, { height: h }]} />
                      <Text style={styles.weekDay}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('visit')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Visit Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== CHARGE REPORT ===== */}
        {activeReport === 'charge' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Charge Report — April 2026</Text>
              <ExportBtn reportKey="charge" label="Charge Report" />
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderTopColor: Colors.primary }]}>
                <Text style={styles.kpiLabel}>Total Charges</Text>
                <Text style={styles.kpiValue}>${(DASHBOARD_METRICS.chargesThisMonth / 1000).toFixed(1)}k</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.info }]}>
                <Text style={styles.kpiLabel}>CPT Codes</Text>
                <Text style={styles.kpiValue}>{CHARGE_DATA.length}</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.success }]}>
                <Text style={styles.kpiLabel}>Total Units</Text>
                <Text style={styles.kpiValue}>{CHARGE_DATA.reduce((s, d) => s + d.units, 0)}</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Charges by CPT Code</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 1.2 }]}>CPT</Text>
                <Text style={[styles.thCell, { flex: 2 }]}>Description</Text>
                <Text style={[styles.thCell, { textAlign: 'right' }]}>Units</Text>
                <Text style={[styles.thCell, { textAlign: 'right' }]}>Total</Text>
              </View>
              {CHARGE_DATA.map((row, i) => (
                <View key={row.code} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={[styles.tdCell, { flex: 1.2, color: Colors.primary, fontWeight: '700' }]}>{row.code}</Text>
                  <Text style={[styles.tdCell, { flex: 2 }]} numberOfLines={1}>{row.desc}</Text>
                  <Text style={[styles.tdCell, { textAlign: 'right' }]}>{row.units}</Text>
                  <Text style={[styles.tdCell, { textAlign: 'right', fontWeight: '700' }]}>${row.charge.toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tdCell, { flex: 1.2 }]}></Text>
                <Text style={[styles.tdCell, { flex: 2, fontWeight: '700', color: Colors.textPrimary }]}>TOTAL</Text>
                <Text style={[styles.tdCell, { textAlign: 'right', fontWeight: '700' }]}>{CHARGE_DATA.reduce((s, d) => s + d.units, 0)}</Text>
                <Text style={[styles.tdCell, { textAlign: 'right', fontWeight: '800', color: Colors.primary }]}>
                  ${CHARGE_DATA.reduce((s, d) => s + d.charge, 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Top Procedures by Revenue</Text>
              {CHARGE_DATA.sort((a, b) => b.charge - a.charge).slice(0, 5).map(row => (
                <View key={row.code} style={styles.chargeBarRow}>
                  <View style={{ width: 56 }}>
                    <Text style={styles.chargeCode}>{row.code}</Text>
                    <Text style={styles.chargeAvg}>avg ${row.avg}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.chargeBarTrack}>
                      <View style={[styles.chargeBarFill, { width: `${(row.charge / maxCharge) * 100}%` as any }]} />
                    </View>
                  </View>
                  <Text style={styles.chargeTotal}>${row.charge.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('charge')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Charge Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== PAYMENT REPORT ===== */}
        {activeReport === 'payment' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Payment Report — April 2026</Text>
              <ExportBtn reportKey="payment" label="Payment Report" />
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderTopColor: Colors.success }]}>
                <Text style={styles.kpiLabel}>Total Payments</Text>
                <Text style={styles.kpiValue}>${(totalPayments / 1000).toFixed(1)}k</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.primary }]}>
                <Text style={styles.kpiLabel}>ERA Payments</Text>
                <Text style={styles.kpiValue}>$43.9k</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.warning }]}>
                <Text style={styles.kpiLabel}>Patient Pmts</Text>
                <Text style={styles.kpiValue}>$3.2k</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Payments by Payer</Text>
              {PAYMENT_DATA.map((row) => (
                <View key={row.payer} style={styles.paymentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payerName}>{row.payer}</Text>
                    <View style={styles.payerMeta}>
                      <View style={styles.methodChip}>
                        <Text style={styles.methodText}>{row.method}</Text>
                      </View>
                      <Text style={styles.payerClaims}>{row.claims} claims</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.payerAmount}>${row.payments.toLocaleString()}</Text>
                    <Text style={styles.payerAvg}>avg ${row.avg}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.paymentTotalRow}>
                <Text style={styles.paymentTotalLabel}>Total Received</Text>
                <Text style={styles.paymentTotalValue}>${totalPayments.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Payment Method Breakdown</Text>
              {[
                { method: 'ERA/Electronic (835)', amount: 43050, pct: 76 },
                { method: 'EFT Direct Deposit', amount: 8920, pct: 16 },
                { method: 'Check/Paper', amount: 2310, pct: 5 },
                { method: 'Patient Card/Cash', amount: 1680, pct: 3 },
              ].map(m => (
                <View key={m.method} style={styles.methodBarRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodBarLabel}>{m.method}</Text>
                    <View style={styles.chargeBarTrack}>
                      <View style={[styles.chargeBarFill, { width: `${m.pct}%` as any, backgroundColor: Colors.success }]} />
                    </View>
                  </View>
                  <View style={styles.methodBarRight}>
                    <Text style={styles.methodBarPct}>{m.pct}%</Text>
                    <Text style={styles.methodBarAmt}>${(m.amount / 1000).toFixed(1)}k</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('payment')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Payment Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== AR AGING REPORT ===== */}
        {activeReport === 'ar' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Accounts Receivable Aging</Text>
              <ExportBtn reportKey="ar" label="AR Aging Report" />
            </View>

            <View style={[styles.summaryBanner, { backgroundColor: Colors.navBg }]}>
              <View>
                <Text style={styles.bannerSub}>Total Outstanding AR</Text>
                <Text style={styles.bannerBig}>${AR_AGING.reduce((s, r) => s + r.amount, 0).toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bannerSub}>{AR_AGING.reduce((s, r) => s + r.count, 0)} open claims</Text>
                <Text style={[styles.bannerBig, { fontSize: FontSize.lg, color: Colors.danger }]}>
                  ${DASHBOARD_METRICS.arOver90.toLocaleString()} 90+
                </Text>
              </View>
            </View>

            {AR_AGING.map(row => (
              <View key={row.bucket} style={styles.agingCard}>
                <View style={styles.agingTop}>
                  <View style={[styles.agingColorBar, { backgroundColor: getAgingColor(row.bucket) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agingBucket}>{row.bucket}</Text>
                    <Text style={styles.agingCount}>{row.count} claims · {row.percentage}% of AR</Text>
                  </View>
                  <Text style={[styles.agingAmount, { color: getAgingColor(row.bucket) }]}>${row.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.agingBarTrack}>
                  <View style={[styles.agingBarFill, { width: `${row.percentage}%` as any, backgroundColor: getAgingColor(row.bucket) }]} />
                </View>
              </View>
            ))}

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>AR by Payer</Text>
              {[
                { payer: 'BlueCross BlueShield', ar: 22400, claims: 34 },
                { payer: 'United Healthcare', ar: 18600, claims: 22 },
                { payer: 'Aetna', ar: 12800, claims: 17 },
                { payer: 'Medicare', ar: 8200, claims: 18 },
                { payer: 'Cigna', ar: 7100, claims: 11 },
                { payer: 'Patient Balance', ar: 4580, claims: 23 },
              ].map(p => (
                <View key={p.payer} style={styles.arPayerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payerName}>{p.payer}</Text>
                    <Text style={styles.payerClaims}>{p.claims} claims</Text>
                  </View>
                  <Text style={styles.arPayerAmt}>${p.ar.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('ar')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export AR Aging Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== DENIAL REPORT ===== */}
        {activeReport === 'denial' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Denial Management Report</Text>
              <ExportBtn reportKey="denial" label="Denial Report" />
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderTopColor: Colors.danger }]}>
                <Text style={styles.kpiLabel}>Denial Rate</Text>
                <Text style={[styles.kpiValue, { color: Colors.danger }]}>{DASHBOARD_METRICS.denialRate}%</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.warning }]}>
                <Text style={styles.kpiLabel}>Denied Claims</Text>
                <Text style={styles.kpiValue}>{claims.filter(c => c.status === 'Denied').length}</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: Colors.danger }]}>
                <Text style={styles.kpiLabel}>Revenue at Risk</Text>
                <Text style={styles.kpiValue}>$4.2k</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Top Denial Reasons</Text>
              {DENIAL_REASONS.map(d => (
                <View key={d.reason} style={styles.denialRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.denialReason}>{d.reason}</Text>
                    <View style={styles.chargeBarTrack}>
                      <View style={[styles.chargeBarFill, { width: `${d.percentage}%` as any, backgroundColor: Colors.danger }]} />
                    </View>
                  </View>
                  <View style={styles.denialStats}>
                    <Text style={styles.denialCount}>{d.count}</Text>
                    <Text style={styles.denialPct}>{d.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Denial Rate by Payer</Text>
              {[
                { payer: 'United Healthcare', rate: 12.4, denied: 4 },
                { payer: 'Cigna', rate: 9.8, denied: 2 },
                { payer: 'Aetna', rate: 7.2, denied: 3 },
                { payer: 'BlueCross', rate: 5.1, denied: 2 },
                { payer: 'Medicare', rate: 3.2, denied: 1 },
              ].map(p => (
                <View key={p.payer} style={styles.denialPayerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payerName}>{p.payer}</Text>
                    <View style={styles.chargeBarTrack}>
                      <View style={[styles.chargeBarFill, {
                        width: `${(p.rate / 14) * 100}%` as any,
                        backgroundColor: p.rate > 10 ? Colors.danger : p.rate > 7 ? Colors.warning : Colors.success
                      }]} />
                    </View>
                  </View>
                  <View style={styles.denialStats}>
                    <Text style={[styles.denialCount, {
                      color: p.rate > 10 ? Colors.danger : p.rate > 7 ? Colors.warning : Colors.success
                    }]}>{p.rate}%</Text>
                    <Text style={styles.denialPct}>{p.denied} denied</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Denied Claims Requiring Action</Text>
              {claims.filter(c => c.status === 'Denied').map(c => (
                <View key={c.id} style={styles.deniedClaimRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dcPatient}>{c.patientName}</Text>
                    <Text style={styles.dcReason} numberOfLines={1}>{c.denialReason ?? 'Unknown reason'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dcAmount}>${c.totalCharge.toFixed(0)}</Text>
                    <Text style={styles.dcDate}>{c.dos}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('denial')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Denial Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== PROVIDER REPORT ===== */}
        {activeReport === 'provider' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Provider Performance Report</Text>
              <ExportBtn reportKey="provider" label="Provider Report" />
            </View>

            {providerStats.map(ps => (
              <View key={ps.id} style={styles.providerDetailCard}>
                <View style={styles.providerDetailHeader}>
                  <View style={[styles.providerAvatar, { backgroundColor: ps.color }]}>
                    <Text style={styles.providerAvatarText}>{ps.name.split(' ').slice(-1)[0][0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{ps.name}</Text>
                    <Text style={styles.providerSpec}>{ps.specialty}</Text>
                  </View>
                </View>
                <View style={styles.providerMetrics}>
                  {[
                    { label: 'Charges', value: `$${ps.charges.toFixed(0)}` },
                    { label: 'Collected', value: `$${ps.revenue.toFixed(0)}` },
                    { label: 'Claims', value: String(ps.claims) },
                    { label: 'Visits', value: String(ps.visits) },
                  ].map(m => (
                    <View key={m.label} style={styles.providerMetricCell}>
                      <Text style={styles.providerMetricValue}>{m.value}</Text>
                      <Text style={styles.providerMetricLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>
                {ps.charges > 0 ? (
                  <View style={styles.providerCollRow}>
                    <Text style={styles.collRateLabel}>Collection Rate</Text>
                    <Text style={styles.collRateValue}>
                      {ps.charges > 0 ? ((ps.revenue / ps.charges) * 100).toFixed(1) : '0'}%
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('provider')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Provider Report to Excel</Text>
            </Pressable>
          </>
        )}

        {/* ===== CLAIMS REPORT ===== */}
        {activeReport === 'claims' && (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Claims Summary Report</Text>
              <ExportBtn reportKey="claims" label="Claims Report" />
            </View>

            <View style={styles.claimStatusGrid}>
              {(['Paid', 'Submitted', 'Pending', 'Denied', 'Partial', 'Draft'] as const).map(s => {
                const count = claims.filter(c => c.status === s).length;
                const colorMap: Record<string, string> = {
                  Paid: Colors.success, Submitted: Colors.primary, Pending: Colors.warning,
                  Denied: Colors.danger, Partial: Colors.info, Draft: Colors.textMuted,
                };
                return (
                  <View key={s} style={[styles.statusCell, { borderTopColor: colorMap[s] }]}>
                    <Text style={[styles.statusCellNum, { color: colorMap[s] }]}>{count}</Text>
                    <Text style={styles.statusCellLabel}>{s}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Claims Summary KPIs</Text>
              {[
                { label: 'Total Claims This Month', value: String(DASHBOARD_METRICS.claimsThisMonth) },
                { label: 'Total Billed', value: `$${DASHBOARD_METRICS.chargesThisMonth.toLocaleString()}` },
                { label: 'Total Collected', value: `$${DASHBOARD_METRICS.paymentsThisMonth.toLocaleString()}` },
                { label: 'Total Adjustments', value: `$${DASHBOARD_METRICS.adjustmentsThisMonth.toLocaleString()}` },
                { label: 'Avg Days to Payment', value: `${DASHBOARD_METRICS.avgDaysToPayment} days` },
                { label: 'First-Pass Resolution Rate', value: '84.6%' },
              ].map(row => (
                <View key={row.label} style={styles.kpiRow2}>
                  <Text style={styles.kpiRow2Label}>{row.label}</Text>
                  <Text style={styles.kpiRow2Value}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>All Claims</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 1.8 }]}>Claim #</Text>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Patient</Text>
                <Text style={[styles.thCell, { textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.thCell, { textAlign: 'right' }]}>Status</Text>
              </View>
              {claims.map((c, i) => (
                <View key={c.id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={[styles.tdCell, { flex: 1.8, color: Colors.primary, fontSize: FontSize.xs }]}>
                    {c.claimNumber.replace('CLM-2026-', '#')}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1.5 }]} numberOfLines={1}>{c.patientName.split(' ')[0]}</Text>
                  <Text style={[styles.tdCell, { textAlign: 'right', fontWeight: '700' }]}>${c.totalCharge.toFixed(0)}</Text>
                  <Text style={[styles.tdCell, { textAlign: 'right', fontSize: FontSize.xs }]}>{c.status}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.exportLargeBtn} onPress={() => handleExport('claims')} disabled={exporting}>
              <MaterialIcons name="table-chart" size={18} color="#fff" />
              <Text style={styles.exportLargeText}>Export Claims Report to Excel</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  tabBar: { backgroundColor: Colors.navBg },
  tabContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    minWidth: 90,
    justifyContent: 'center',
  },
  exportText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  exportLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    ...Shadow.md,
  },
  exportLargeText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderTopWidth: 3,
    ...Shadow.sm,
  },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  kpiValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  kpiChange: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },

  chartCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  chartTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, marginVertical: Spacing.sm },
  barGroup: { alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 18, borderRadius: 4 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  metricsCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },

  kpiRow2: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  kpiRow2Label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  kpiRow2Value: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  collCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm },
  collHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collRate: { fontSize: FontSize.xxl, fontWeight: '800' },
  collTrack: { height: 10, backgroundColor: Colors.divider, borderRadius: 5, overflow: 'hidden' },
  collFill: { height: 10, borderRadius: 5 },
  benchmarkRow: { flexDirection: 'row', justifyContent: 'space-between' },
  benchmarkLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  visitType: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: '500', marginBottom: 4 },
  visitBarTrack: { height: 5, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden' },
  visitBarFill: { height: 5, backgroundColor: Colors.primary, borderRadius: 3 },
  visitStats: { alignItems: 'flex-end' },
  visitCount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  visitRevenue: { fontSize: FontSize.xs, color: Colors.success },
  providerVisitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  providerDot: { width: 10, height: 10, borderRadius: 5 },
  providerRowName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  providerRowSpec: { fontSize: FontSize.xs, color: Colors.textMuted },
  providerVisitStats: { alignItems: 'center' },
  pvCount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  pvLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, paddingTop: 8 },
  weekCol: { alignItems: 'center', gap: 4 },
  weekCount: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  weekBar: { width: 28, backgroundColor: Colors.primary, borderRadius: 4 },
  weekDay: { fontSize: FontSize.xs, color: Colors.textMuted },

  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: Colors.border },
  thCell: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tableRowAlt: { backgroundColor: Colors.surfaceAlt },
  tdCell: { fontSize: FontSize.xs, color: Colors.textPrimary, flex: 1 },
  tableTotalRow: { flexDirection: 'row', paddingTop: 10, borderTopWidth: 2, borderTopColor: Colors.border, marginTop: 4 },
  chargeBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  chargeCode: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  chargeAvg: { fontSize: FontSize.xs, color: Colors.textMuted },
  chargeBarTrack: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  chargeBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  chargeTotal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, width: 60, textAlign: 'right' },

  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 8 },
  payerName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  payerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  methodChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  methodText: { fontSize: 9, fontWeight: '600', color: Colors.primary },
  payerClaims: { fontSize: FontSize.xs, color: Colors.textMuted },
  payerAmount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },
  payerAvg: { fontSize: FontSize.xs, color: Colors.textMuted },
  paymentTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 2, borderTopColor: Colors.border, marginTop: 4,
  },
  paymentTotalLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  paymentTotalValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.success },
  methodBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  methodBarLabel: { fontSize: FontSize.xs, color: Colors.textPrimary, marginBottom: 4 },
  methodBarRight: { alignItems: 'flex-end', width: 50 },
  methodBarPct: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  methodBarAmt: { fontSize: FontSize.xs, color: Colors.textMuted },

  summaryBanner: { borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.md },
  bannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)' },
  bannerBig: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  agingCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm },
  agingTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agingColorBar: { width: 4, height: 40, borderRadius: 2 },
  agingBucket: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  agingCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  agingAmount: { fontSize: FontSize.lg, fontWeight: '800' },
  agingBarTrack: { height: 8, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  agingBarFill: { height: 8, borderRadius: 4 },
  arPayerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  arPayerAmt: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },

  denialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  denialReason: { fontSize: FontSize.xs, color: Colors.textPrimary, marginBottom: 4 },
  denialStats: { alignItems: 'flex-end', width: 44 },
  denialCount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.danger },
  denialPct: { fontSize: FontSize.xs, color: Colors.textMuted },
  denialPayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  deniedClaimRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 8 },
  dcPatient: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  dcReason: { fontSize: FontSize.xs, color: Colors.danger },
  dcAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  dcDate: { fontSize: FontSize.xs, color: Colors.textMuted },

  providerDetailCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, ...Shadow.sm },
  providerDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  providerAvatarText: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  providerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  providerSpec: { fontSize: FontSize.xs, color: Colors.textMuted },
  providerMetrics: { flexDirection: 'row', gap: 8 },
  providerMetricCell: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  providerMetricValue: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textPrimary },
  providerMetricLabel: { fontSize: 10, color: Colors.textMuted },
  providerCollRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  collRateLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  collRateValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },

  claimStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusCell: {
    flex: 1, minWidth: '30%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.sm, alignItems: 'center', borderTopWidth: 3, ...Shadow.sm,
  },
  statusCellNum: { fontSize: FontSize.xxl, fontWeight: '800' },
  statusCellLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
});
