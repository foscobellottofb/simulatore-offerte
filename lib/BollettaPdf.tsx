import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Polyline, Rect, Line, Image } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { RisultatoCalcolo, InputSimulazione } from './types';
import { consumoNelPeriodo } from './calcoli';

// Logo Enel reale, letto da /public e incorporato come base64 (siamo lato server,
// dentro app/api/pdf/route.ts, quindi fs è disponibile).
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo-enel.png');
const LOGO_BASE64 = fs.existsSync(LOGO_PATH)
  ? `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`
  : null;

/**
 * Template ricalcato sulla struttura delle bollette sintetiche Enel Energia:
 * box con fascia colorata in testa (navy per l'importo, verde per il
 * consumo, come nell'originale) + corpo bianco, box grigio con POD/potenza/
 * indirizzo, "Scontrino dell'energia" con voci principali e "di cui"
 * indentati, filigrana "SIMULAZIONE" per non confonderla con una bolletta
 * reale. Box "Contatti" e "Segnalazione guasti" affiancati con icone lineari,
 * sul modello delle bollette Enel Business.
 *
 * Il logo Enel reale viene letto da /public/logo-enel.png; se il file non è
 * presente (es. non è stato caricato) si usa un fallback tipografico.
 */

const NAVY = '#12224C';
const GRAY_HEADER = '#6C6F76';
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
  logoRow: { flexDirection: 'row' },
  logoSub: { fontSize: 7, color: '#666', marginTop: 2 },
  fiscaleBox: { flexDirection: 'row', gap: 22, marginTop: 4 },
  fiscaleLabel: { fontSize: 6.5, fontWeight: 700, color: '#111', borderBottomWidth: 1, borderBottomColor: NAVY, paddingBottom: 1, marginBottom: 2 },
  fiscaleValue: { fontSize: 8, color: NAVY },
  badge: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    width: 56,
    paddingVertical: 8,
    alignItems: 'center'
  },
  badgeText: { fontSize: 6.5, fontWeight: 700, textAlign: 'center', marginTop: 4 },
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
  },

  contattiRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  contattiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    overflow: 'hidden'
  },
  contattiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NAVY,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  guastiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GRAY_HEADER,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  contattiBody: { flexDirection: 'row', padding: 12, gap: 16 },
  contattiCol: { flex: 1, gap: 9 },
  contattiItem: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  contattiIconWrap: { paddingTop: 1 },
  contattiLabel: { fontSize: 8, fontWeight: 700, color: '#111' },
  contattiValue: { fontSize: 7.5, color: '#666', marginTop: 1, lineHeight: 1.35 },
  guastiBody: { padding: 12, gap: 10 },
  guastiLabel: { fontSize: 7.5, fontWeight: 700, color: '#111', marginBottom: 2 },
  guastiValue: { fontSize: 7.5, color: '#666', lineHeight: 1.4 },

  offertaBox: { marginTop: 14, borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 12 },
  offertaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  offertaLabel: { fontSize: 6.5, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  offertaValue: { fontSize: 8.5, fontWeight: 700, color: '#111' },
  offertaFormula: { fontSize: 7.5, color: '#444', marginTop: 6, lineHeight: 1.4 }
});

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function Watermark() {
  return <Text style={styles.watermark}>SIMULAZIONE</Text>;
}

// Icone lineari minimali (stile "feather"), riusate per Contatti/Segnalazione guasti.
function IconPhone({ color = '#FFFFFF', size = 11 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function IconMonitor({ color = NAVY, size = 11 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={3} width={20} height={14} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
      <Line x1={8} y1={21} x2={16} y2={21} stroke={color} strokeWidth={1.8} />
      <Line x1={12} y1={17} x2={12} y2={21} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconPin({ color = NAVY, size = 11 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={10} r={3} fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconMail({ color = NAVY, size = 11 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={4} width={20} height={16} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
      <Polyline points="22,6 12,13 2,6" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconTool({ color = '#FFFFFF', size = 11 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function BollettaPdf({
  risultato,
  input,
  nomeCliente,
  pod,
  indirizzoFornitura,
  codiceFiscalePiva
}: {
  risultato: RisultatoCalcolo;
  input: InputSimulazione;
  nomeCliente?: string;
  pod?: string;
  indirizzoFornitura?: string;
  codiceFiscalePiva?: string;
}) {
  const dataOggi = new Date().toLocaleDateString('it-IT');
  const consumoPeriodo = consumoNelPeriodo(input).toFixed(0);
  const etichettaCommodity = input.commodity === 'LUCE' ? 'ENERGIA ELETTRICA' : 'GAS NATURALE';

  const gruppi = [
    { label: 'Quota consumi', valore: risultato.riepilogo.quotaConsumi, gruppo: 'CONSUMI' as const },
    { label: 'Quota fissa e quota potenza', valore: risultato.riepilogo.quotaFissaEPotenza, gruppo: 'FISSA_POTENZA' as const },
    ...(risultato.riepilogo.altrePartite > 0
      ? [{ label: 'Altre partite', valore: risultato.riepilogo.altrePartite, gruppo: 'ALTRE' as const }]
      : []),
    { label: 'Accise e IVA', valore: risultato.riepilogo.acciseEIva, gruppo: 'ACCISE' as const }
  ];

  const HeaderPagina = () => (
    <View style={styles.header}>
      <View>
        {LOGO_BASE64 ? (
          <Image src={LOGO_BASE64} style={{ width: 72, height: 26 }} />
        ) : (
          <View style={styles.logoRow}>
            <Text style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Helvetica-Bold', color: '#E4572E' }}>e</Text>
            <Text style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Helvetica-Bold', color: '#EC407A' }}>n</Text>
            <Text style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Helvetica-Bold', color: '#42A5F5' }}>e</Text>
            <Text style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Helvetica-Bold', color: '#43A047' }}>l</Text>
          </View>
        )}
        <Text style={[styles.logoSub, { marginTop: 4 }]}>Enel SMB — Mercato libero dell'energia</Text>
        {codiceFiscalePiva && (
          <View style={styles.fiscaleBox}>
            <View>
              <Text style={styles.fiscaleLabel}>Codice Fiscale / Partita IVA</Text>
              <Text style={styles.fiscaleValue}>{codiceFiscalePiva}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.badge}>
        <Svg width="18" height="18" viewBox="0 0 24 24">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FFFFFF" />
        </Svg>
        <Text style={styles.badgeText}>{etichettaCommodity.split(' ')[0]}</Text>
        <Text style={styles.badgeText}>{etichettaCommodity.split(' ')[1]}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      {/* PAGINA 1 — riepilogo, come lo "Scontrino dell'energia" */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <HeaderPagina />

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

          <View style={styles.contattiRow}>
            <View style={styles.contattiBox}>
              <View style={styles.contattiHeader}>
                <IconPhone />
                <Text>Contatti</Text>
              </View>
              <View style={styles.contattiBody}>
                <View style={styles.contattiCol}>
                  <View style={styles.contattiItem}>
                    <View style={styles.contattiIconWrap}>
                      <IconMonitor />
                    </View>
                    <View>
                      <Text style={styles.contattiLabel}>Sito Web</Text>
                      <Text style={styles.contattiValue}>vai su enel.it</Text>
                    </View>
                  </View>
                  <View style={styles.contattiItem}>
                    <View style={styles.contattiIconWrap}>
                      <IconPin />
                    </View>
                    <View>
                      <Text style={styles.contattiLabel}>Spazio Enel</Text>
                      <Text style={styles.contattiValue}>vai su enel.it/spazio-enel</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.contattiCol}>
                  <View style={styles.contattiItem}>
                    <View style={styles.contattiIconWrap}>
                      <IconPhone color={NAVY} />
                    </View>
                    <View>
                      <Text style={styles.contattiLabel}>Numero gratuito 140</Text>
                      <Text style={styles.contattiValue}>
                        Dalle 7:00 alle 22:00{'\n'}dal lun. alla dom. (esclusi festivi)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.contattiItem}>
                    <View style={styles.contattiIconWrap}>
                      <IconMail />
                    </View>
                    <View>
                      <Text style={styles.contattiLabel}>Per posta</Text>
                      <Text style={styles.contattiValue}>
                        Enel Energia S.p.A. — Casella Postale{'\n'}8080 — 85100 Potenza
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.contattiBox}>
              <View style={styles.guastiHeader}>
                <IconTool />
                <Text>Segnalazione guasti</Text>
              </View>
              <View style={styles.guastiBody}>
                <View>
                  <Text style={styles.guastiLabel}>PER SEGNALAZIONI 803 500</Text>
                  <Text style={styles.guastiValue}>Numero Verde da rete fissa e cellulare, tutti i giorni 24 ore su 24</Text>
                </View>
                <View>
                  <Text style={styles.guastiLabel}>PER INFORMAZIONI</Text>
                  <Text style={styles.guastiValue}>
                    Scarica l'app gratuita Guasti e-distribuzione oppure invia un SMS con il tuo Codice{' '}
                    {input.commodity === 'LUCE' ? 'POD' : 'PDR'}
                    {pod ? ` ${pod}` : ''} al 320 20 41 500
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 6.5, color: '#999', marginTop: 6 }}>
            Documento di simulazione: non è previsto alcun pagamento e non è presente alcun codice QR di pagamento.
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento generato automaticamente a scopo di simulazione commerciale — non costituisce fattura né
          documento fiscale. Prezzi e condizioni contrattuali definitivi sono quelli riportati in offerta.
        </Text>
      </Page>

      {/* PAGINA 2 — dettaglio piatto di ogni voce, come "Dettaglio importi della bolletta" */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <HeaderPagina />

        <View style={styles.body}>
          <Text style={{ fontSize: 10, color: NAVY, fontWeight: 700, marginBottom: 8 }}>
            Dettaglio importi — {risultato.offerta.nome}
          </Text>

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

          <Text style={styles.sectionBar}>BOX DELL'OFFERTA</Text>
          <View style={styles.offertaBox}>
            <View style={styles.offertaGrid}>
              <View>
                <Text style={styles.offertaLabel}>Nome offerta</Text>
                <Text style={styles.offertaValue}>{risultato.offerta.nome}</Text>
              </View>
              <View>
                <Text style={styles.offertaLabel}>Tipologia</Text>
                <Text style={styles.offertaValue}>
                  {risultato.offerta.tipoPrezzo === 'VARIABILE_CAP'
                    ? 'Prezzo variabile con CAP'
                    : risultato.offerta.tipoPrezzo === 'PERSONALIZZATA'
                      ? 'Prezzo personalizzato'
                      : 'Prezzo fisso'}
                </Text>
              </View>
              <View>
                <Text style={styles.offertaLabel}>Durata</Text>
                <Text style={styles.offertaValue}>{risultato.offerta.durataMesi} mesi</Text>
              </View>
              <View>
                <Text style={styles.offertaLabel}>Vendibilità</Text>
                <Text style={styles.offertaValue}>{risultato.offerta.vendibilita}</Text>
              </View>
            </View>

            {risultato.offerta.tipoPrezzo === 'VARIABILE_CAP' && (
              <>
                <View style={styles.offertaGrid}>
                  {risultato.offerta.parametroAlfa != null && (
                    <View>
                      <Text style={styles.offertaLabel}>Parametro Alfa</Text>
                      <Text style={styles.offertaValue}>{risultato.offerta.parametroAlfa.toFixed(4)} €/{input.commodity === 'LUCE' ? 'kWh' : 'Smc'}</Text>
                    </View>
                  )}
                  {risultato.offerta.cap != null && (
                    <View>
                      <Text style={styles.offertaLabel}>CAP (tetto massimo)</Text>
                      <Text style={styles.offertaValue}>{risultato.offerta.cap.toFixed(4)} €/{input.commodity === 'LUCE' ? 'kWh' : 'Smc'}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.offertaFormula}>
                  Formula prezzo per la quota consumi: Prezzo ({input.commodity === 'LUCE' ? '€/kWh' : '€/Smc'}) = Indice di
                  riferimento di mercato ({input.commodity === 'LUCE' ? 'PUN' : 'PSV'}) + Alfa, con tetto massimo pari al
                  CAP indicato sopra. In questa simulazione, non avendo accesso all'indice di mercato in tempo reale, il
                  prezzo viene calcolato usando il CAP come scenario prudenziale (il costo massimo possibile per il
                  cliente). Dispacciamento, sbilanciamento e perdite di rete non sono simulati separatamente qui: sono
                  già inclusi nelle voci "Trasporto e oneri di sistema" del riepilogo, con parametri standard ARERA.
                </Text>
              </>
            )}
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
