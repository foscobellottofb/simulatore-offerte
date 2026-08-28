import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { BollettaPdf } from '@/lib/BollettaPdf';
import { RisultatoCalcolo, InputSimulazione } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body: { risultato: RisultatoCalcolo; input: InputSimulazione; nomeCliente?: string } = await req.json();

  const buffer = await renderToBuffer(
    BollettaPdf({ risultato: body.risultato, input: body.input, nomeCliente: body.nomeCliente })
  );

    return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bolletta-simulata-${body.risultato.offerta.nome.replace(/\s+/g, '-')}.pdf"`
    }
  });
}
