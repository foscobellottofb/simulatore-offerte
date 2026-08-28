import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { RisultatoCalcolo, InputSimulazione } from './types';

/**
 * Template ricalcato sulla struttura delle bollette sintetiche Enel Energia:
 * box con fascia colorata in testa (navy per l'importo, verde per il
 * consumo, come nell'originale) + corpo bianco, box grigio con POD/potenza/
 * indirizzo, "Scontrino dell'energia" con voci principali e "di cui"
 * indentati, filigrana "SIMULAZIONE" per non confonderla con una bolletta
 * reale.
 *
 * NOTA: non è incluso il logo Enel ufficiale (marchio registrato) — al suo
 * posto c'è una ricostruzione tipografica dello stesso stile.
 */

const NAVY = '#0F1F3D';
const GREEN = '#00843D';
const PAPER = '#F4F6F5';
const LINE = '#DCE1E6';

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 9, fontFamily: 'Helvetica', color: '#1A1A1A' },
  watermark: {
    position: 'absolute',
    top: 340,
    left: -60,
    width: 700,
    fontSize: 64,
    color: '#EDEFF1',
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-30deg)',
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 12
  },
  logo: { fontSize: 26, fontWeight: 700, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5, color: NAVY },
  logoSub: { fontSize: 7, color: '#666', marginTop: 2 },
  badge: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    textAlign: 'center'
  },
  body: { paddingHorizontal: 32, paddingBottom: 40 },
  clienteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  clienteBlock: { fontSize: 9, lineHeight: 1.5 },
  clienteLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', marginBottom: 2 },

  callouts: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  calloutBox: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  calloutHeaderNavy: { backgroundColor: NAVY, color: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 10, fontSize: 8, fontWeight: 700 },
  calloutHeaderGreen: { backgroundColor: GREEN, color: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 10, fontSize: 8, fontWeight: 700 },
  calloutBody: { padding: 12 },
  calloutValueBig: { fontSize: 22, fontWeight: 700, color: '#111' },
  calloutSub: { fontSize: 7, color: '#666', marginTop: 4 },

  infoRow: {
    flexDirection: 'row',
    backgroundColor: PAPER,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
    gap: 20
  },
  infoLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 9, fontWeight: 700 },

  sectionBar: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 9,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 2
  },
  riepilogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE
  },
  riepilogoLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  riepilogoValore: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  diCuiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 10, paddingVertical: 1.5 },
  diCuiLabel: { fontSize: 7.5, color: '#666' },
  diCuiValore: { fontSize: 7.5, color: '#666' },

  tableHeadRow: {
    flexDirection: 'row',
    backgroundColor: PAPER,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 7.5,
    color: '#666',
    textTransform: 'uppercase'
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE
  },
  rowBold: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: PAPER,
    fontFamily: 'Helvetica-Bold'
  },
  colLabel: { flex: 3 },
  colVal: { flex: 1, textAlign: 'right' },

  totaleBox: {
    marginTop: 14,
    backgroundColor: NAVY,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totaleLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: 700 },
  totaleValue: { color: '#FFFFFF', fontSize: 20, fontWeight: 700 },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 8
  }
});

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function Watermark() {
  return <Text style={styles.watermark}>SIMULAZIONE</Text>;
}

export function BollettaPdf({
  risultato,
  input,
  nomeCliente,
  pod,
  indirizzoFornitura
}: {
  risultato: RisultatoCalcolo;
  input: InputSimulazione;
  nomeCliente?: string;
  pod?: string;
  indirizzoFornitura?: string;
}) {
  const dataOggi = new Date().toLocaleDateString('it-IT');
  const consumoPeriodo = ((input.consumoAnnuoKwh * input.giorniFattura) / 365).toFixed(0);

  const gruppi = [
    { label: 'Quota consumi', valore: risultato.riepilogo.quotaConsumi, gruppo: 'CONSUMI' as const },
    { label: 'Quota fissa e quota potenza', valore: risultato.riepilogo.quotaFissaEPotenza, gruppo: 'FISSA_POTENZA' as const },
    ...(risultato.riepilogo.altrePartite > 0
      ? [{ label: 'Altre partite', valore: risultato.riepilogo.altrePartite, gruppo: 'ALTRE' as const }]
      : []),
    { label: 'Accise e IVA', valore: risultato.riepilogo.acciseEIva, gruppo: 'ACCISE' as const }
  ];

  return (
    <Document>
      {/* PAGINA 1 — riepilogo, come lo "Scontrino dell'energia" */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>enel</Text>
            <Text style={styles.logoSub}>Enel Business — Mercato libero dell'energia</Text>
          </View>
          <View style={styles.badge}>
            <Text>{input.commodity === 'LUCE' ? 'ENERGIA' : 'GAS'}</Text>
            <Text>ELETTRICA</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.clienteRow}>
            <View style={styles.clienteBlock}>
              <Text style={styles.clienteLabel}>Simulazione per</Text>
              <Text>{nomeCliente || 'Cliente'}</Text>
            </View>
            <View style={[styles.clienteBlock, { textAlign: 'right' }]}>
              <Text style={styles.clienteLabel}>Offerta simulata</Text>
              <Text>{risultato.offerta.nome}</Text>
              <Text style={{ fontSize: 7, color: '#666', marginTop: 2 }}>Documento generato il {dataOggi}</Text>
            </View>
          </View>

          {(pod || indirizzoFornitura) && (
            <View style={styles.infoRow}>
              {pod && (
                <View>
                  <Text style={styles.infoLabel}>POD</Text>
                  <Text style={styles.infoValue}>{pod}</Text>
                </View>
              )}
              <View>
                <Text style={styles.infoLabel}>Potenza impegnata</Text>
                <Text style={styles.infoValue}>{input.commodity === 'LUCE' ? `${input.potenzaKw} kW` : '—'}</Text>
              </View>
              {indirizzoFornitura && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Indirizzo di fornitura</Text>
                  <Text style={styles.infoValue}>{indirizzoFornitura}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.callouts}>
            <View style={styles.calloutBox}>
              <Text style={styles.calloutHeaderNavy}>IMPORTO SIMULATO</Text>
              <View style={styles.calloutBody}>
                <Text style={styles.calloutValueBig}>{euro(risultato.totaleBolletta)}</Text>
                <Text style={styles.calloutSub}>{input.giorniFattura} giorni di fornitura</Text>
              </View>
            </View>
            <View style={styles.calloutBox}>
              <Text style={styles.calloutHeaderGreen}>CONSUMO</Text>
              <View style={styles.calloutBody}>
                <Text style={styles.calloutValueBig}>
                  {consumoPeriodo} <Text style={{ fontSize: 12 }}>{input.commodity === 'LUCE' ? 'kWh' : 'Smc'}</Text>
                </Text>
                <Text style={styles.calloutSub}>Nel periodo simulato</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionBar}>SCONTRINO DELL'ENERGIA</Text>
          {gruppi.map((g, gi) => {
            const diCui =
              g.gruppo === 'ACCISE'
                ? [...risultato.righeDettaglio.filter((r) => r.gruppo === 'ACCISE'), { etichetta: 'IVA', valore: risultato.iva }]
                : risultato.righeDettaglio.filter((r) => r.gruppo === g.gruppo);
            return (
              <View key={gi}>
                <View style={styles.riepilogoRow}>
                  <Text style={styles.riepilogoLabel}>{g.label}</Text>
                  <Text style={styles.riepilogoValore}>{euro(g.valore)}</Text>
                </View>
                {diCui.map((r, i) => (
                  <View style={styles.diCuiRow} key={i}>
                    <Text style={styles.diCuiLabel}>di cui {r.etichetta.toLowerCase()}</Text>
                    <Text style={styles.diCuiValore}>{euro(r.valore)}</Text>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={styles.totaleBox}>
            <Text style={styles.totaleLabel}>TOTALE SIMULATO</Text>
            <Text style={styles.totaleValue}>{euro(risultato.totaleBolletta)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generato automaticamente a scopo di simulazione commerciale — non costituisce fattura né
          documento fiscale. Prezzi e condizioni contrattuali definitivi sono quelli riportati in offerta.
        </Text>
      </Page>

      {/* PAGINA 2 — dettaglio piatto di ogni voce, come "Dettaglio importi della bolletta" */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={[styles.header, { backgroundColor: PAPER, paddingVertical: 12 }]}>
          <Text style={{ fontSize: 10, color: NAVY, fontWeight: 700 }}>
            Dettaglio importi — {risultato.offerta.nome}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionBar}>TUTTE LE VOCI</Text>
          <View style={styles.tableHeadRow}>
            <Text style={styles.colLabel}>Descrizione</Text>
            <Text style={styles.colVal}>Importo</Text>
          </View>
          {risultato.righeDettaglio.map((r, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colLabel}>{r.etichetta}</Text>
              <Text style={styles.colVal}>{euro(r.valore)}</Text>
            </View>
          ))}
          <View style={styles.rowBold}>
            <Text style={styles.colLabel}>Imponibile</Text>
            <Text style={styles.colVal}>{euro(risultato.totaleImponibile)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>IVA</Text>
            <Text style={styles.colVal}>{euro(risultato.iva)}</Text>
          </View>

          <View style={styles.totaleBox}>
            <Text style={styles.totaleLabel}>TOTALE SIMULATO</Text>
            <Text style={styles.totaleValue}>{euro(risultato.totaleBolletta)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generato automaticamente a scopo di simulazione commerciale — non costituisce fattura né
          documento fiscale. Prezzi e condizioni contrattuali definitivi sono quelli riportati in offerta.
        </Text>
      </Page>
    </Document>
  );
}
