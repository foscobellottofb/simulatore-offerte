import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { RisultatoCalcolo, InputSimulazione } from './types';

/**
 * Template ricalcato sulla struttura delle bollette sintetiche Enel Energia
 * (header con fascia blu navy, box "Importo da pagare", "Scontrino
 * dell'energia" a sezioni con fasce blu e colonne quantità/prezzo/importo).
 *
 * NOTA: non è incluso il logo Enel ufficiale (marchio registrato) — al suo
 * posto c'è una ricostruzione tipografica dello stesso stile. Se disponi del
 * file del logo autorizzato per uso interno, sostituiscilo qui.
 */

const NAVY = '#0F1F3D';
const NAVY_LIGHT = '#1B3A66';
const GREEN = '#00843D';
const PAPER = '#F4F6F5';
const LINE = '#DCE1E6';

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 9, fontFamily: 'Helvetica', color: '#1A1A1A' },
  header: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: { fontSize: 22, fontWeight: 700, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  logoSub: { fontSize: 7, color: '#B8C4D9', marginTop: 2 },
  badge: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    textAlign: 'center'
  },
  body: { paddingHorizontal: 32, paddingTop: 18, paddingBottom: 40 },
  clienteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  clienteBlock: { fontSize: 9, lineHeight: 1.5 },
  clienteLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  callouts: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  calloutImporto: {
    flex: 1.3,
    backgroundColor: NAVY,
    borderRadius: 4,
    padding: 14
  },
  calloutImportoLabel: { fontSize: 8, color: '#B8C4D9', marginBottom: 4 },
  calloutImportoValue: { fontSize: 24, fontWeight: 700, color: '#FFFFFF' },
  calloutConsumo: {
    flex: 1,
    backgroundColor: PAPER,
    borderRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: LINE
  },
  calloutConsumoLabel: { fontSize: 8, color: '#666', marginBottom: 4 },
  calloutConsumoValue: { fontSize: 20, fontWeight: 700, color: NAVY },
  sectionBar: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 9,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 2
  },
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
    marginTop: 16,
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

export function BollettaPdf({
  risultato,
  input,
  nomeCliente
}: {
  risultato: RisultatoCalcolo;
  input: InputSimulazione;
  nomeCliente?: string;
}) {
  const dataOggi = new Date().toLocaleDateString('it-IT');

  return (
    <Document>
      {/* PAGINA 1 — riepilogo sintetico, come lo "Scontrino dell'energia" */}
      <Page size="A4" style={styles.page}>
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

          <View style={styles.callouts}>
            <View style={styles.calloutImporto}>
              <Text style={styles.calloutImportoLabel}>Totale bolletta simulata</Text>
              <Text style={styles.calloutImportoValue}>{euro(risultato.totaleBolletta)}</Text>
            </View>
            <View style={styles.calloutConsumo}>
              <Text style={styles.calloutConsumoLabel}>Consumo nel periodo</Text>
              <Text style={styles.calloutConsumoValue}>
                {((input.consumoAnnuoKwh * input.giorniFattura) / 365).toFixed(0)}
                <Text style={{ fontSize: 11 }}> {input.commodity === 'LUCE' ? 'kWh' : 'Smc'}</Text>
              </Text>
              <Text style={{ fontSize: 7, color: '#666', marginTop: 4 }}>
                {input.giorniFattura} giorni {input.commodity === 'LUCE' ? `— ${input.potenzaKw} kW impegnati` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionBar}>SCONTRINO DELL'ENERGIA</Text>
          <View style={styles.tableHeadRow}>
            <Text style={styles.colLabel}>Voce</Text>
            <Text style={styles.colVal}>Importo</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Quota consumi</Text>
            <Text style={styles.colVal}>{euro(risultato.riepilogo.quotaConsumi)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Quota fissa e quota potenza</Text>
            <Text style={styles.colVal}>{euro(risultato.riepilogo.quotaFissaEPotenza)}</Text>
          </View>
          {risultato.riepilogo.altrePartite > 0 && (
            <View style={styles.row}>
              <Text style={styles.colLabel}>Altre partite</Text>
              <Text style={styles.colVal}>{euro(risultato.riepilogo.altrePartite)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.colLabel}>Accise e IVA</Text>
            <Text style={styles.colVal}>{euro(risultato.riepilogo.acciseEIva)}</Text>
          </View>

          <View style={styles.totaleBox}>
            <Text style={styles.totaleLabel}>TOTALE DA PAGARE</Text>
            <Text style={styles.totaleValue}>{euro(risultato.totaleBolletta)}</Text>
          </View>

          <Text style={{ fontSize: 7, color: '#888', marginTop: 10 }}>
            Per il dettaglio completo di ogni voce consulta la pagina successiva.
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento generato automaticamente a scopo di simulazione commerciale — non costituisce fattura né
          documento fiscale. Prezzi e condizioni contrattuali definitivi sono quelli riportati in offerta.
        </Text>
      </Page>

      {/* PAGINA 2 — dettaglio esploso di ogni voce, come "Dettaglio importi della bolletta" */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { paddingVertical: 12 }]}>
          <Text style={{ fontSize: 10, color: '#FFFFFF' }}>
            Dettaglio importi — {risultato.offerta.nome}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionBar}>SPESA PER LA MATERIA ENERGIA</Text>
          <View style={styles.tableHeadRow}>
            <Text style={styles.colLabel}>Descrizione</Text>
            <Text style={styles.colVal}>Importo</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Energia consumata nel periodo (materia prima)</Text>
            <Text style={styles.colVal}>{euro(risultato.spesaEnergia)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Corrispettivo di vendita (CCV)</Text>
            <Text style={styles.colVal}>{euro(risultato.spesaCcv)}</Text>
          </View>

          <Text style={styles.sectionBar}>TRASPORTO E ONERI DI SISTEMA</Text>
          <View style={styles.tableHeadRow}>
            <Text style={styles.colLabel}>Descrizione</Text>
            <Text style={styles.colVal}>Importo</Text>
          </View>
          {risultato.righeDettaglio
            .filter((r) => r.gruppo === 'CONSUMI' || r.gruppo === 'FISSA_POTENZA')
            .map((r, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.colLabel}>{r.etichetta}</Text>
                <Text style={styles.colVal}>{euro(r.valore)}</Text>
              </View>
            ))}

          {risultato.riepilogo.altrePartite > 0 && (
            <>
              <Text style={styles.sectionBar}>ALTRE PARTITE</Text>
              <View style={styles.tableHeadRow}>
                <Text style={styles.colLabel}>Descrizione</Text>
                <Text style={styles.colVal}>Importo</Text>
              </View>
              {risultato.righeDettaglio
                .filter((r) => r.gruppo === 'ALTRE')
                .map((r, i) => (
                  <View style={styles.row} key={i}>
                    <Text style={styles.colLabel}>{r.etichetta}</Text>
                    <Text style={styles.colVal}>{euro(r.valore)}</Text>
                  </View>
                ))}
            </>
          )}

          <Text style={styles.sectionBar}>IMPOSTE E IVA</Text>
          <View style={styles.tableHeadRow}>
            <Text style={styles.colLabel}>Descrizione</Text>
            <Text style={styles.colVal}>Importo</Text>
          </View>
          {risultato.righeDettaglio
            .filter((r) => r.gruppo === 'ACCISE')
            .map((r, i) => (
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
            <Text style={styles.totaleLabel}>TOTALE BOLLETTA</Text>
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
