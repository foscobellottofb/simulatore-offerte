import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { RisultatoCalcolo, InputSimulazione } from './types';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#12181B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2 solid #00843D', paddingBottom: 12 },
  brand: { fontSize: 18, fontWeight: 700, color: '#00843D' },
  sub: { fontSize: 9, color: '#555', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6, color: '#00612C' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '0.5 solid #E1E5E2' },
  label: { flex: 1 },
  value: { width: 90, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 6, backgroundColor: '#F7F8F6' },
  totalLabel: { fontSize: 12, fontWeight: 700 },
  totalValue: { fontSize: 12, fontWeight: 700, width: 90, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, fontSize: 8, color: '#888', textAlign: 'center' }
});

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function BollettaPdf({
  risultato,
  input,
  nomeCliente
}: {
  risultato: RisultatoCalcolo;
  input: InputSimulazione;
  nomeCliente?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Enel Business</Text>
            <Text style={styles.sub}>Simulazione bolletta — {risultato.offerta.nome}</Text>
          </View>
          <View>
            <Text style={styles.sub}>Cliente: {nomeCliente || '—'}</Text>
            <Text style={styles.sub}>Periodo fatturato: {input.giorniFattura} giorni</Text>
            <Text style={styles.sub}>Potenza impegnata: {input.potenzaKw} kW</Text>
            <Text style={styles.sub}>Consumo annuo stimato: {input.consumoAnnuoKwh.toLocaleString('it-IT')} kWh</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Spesa per la materia energia</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Energia consumata nel periodo</Text>
          <Text style={styles.value}>{euro(risultato.spesaEnergia)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Corrispettivo di vendita (CCV)</Text>
          <Text style={styles.value}>{euro(risultato.spesaCcv)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Accise, trasmissione e oneri</Text>
        {risultato.righeDettaglio.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.label}>{r.etichetta}</Text>
            <Text style={styles.value}>{euro(r.valore)}</Text>
          </View>
        ))}

        <View style={styles.row}>
          <Text style={styles.label}>Imponibile</Text>
          <Text style={styles.value}>{euro(risultato.totaleImponibile)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>IVA</Text>
          <Text style={styles.value}>{euro(risultato.iva)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Totale bolletta simulata</Text>
          <Text style={styles.totalValue}>{euro(risultato.totaleBolletta)}</Text>
        </View>

        <Text style={styles.footer}>
          Documento generato automaticamente a scopo di simulazione commerciale — non costituisce fattura né
          documento fiscale. Prezzi e condizioni contrattuali definitivi sono quelli riportati in offerta.
        </Text>
      </Page>
    </Document>
  );
}
