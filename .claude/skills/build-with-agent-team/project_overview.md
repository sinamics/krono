# Spesifikasjon: MVA-Regnskapsprogram for Enkeltpersonforetak (ENK)

## Bakgrunn og problem

Jeg driver et enkeltpersonforetak (ENK) som selger software til utlandet. Jeg er registrert i Merverdiavgiftsregisteret. Jeg maa levere MVA-melding til Skatteetaten 6 ganger i aaret (hver 2. maaned). I dag gjoer jeg dette manuelt i et Excel-ark og fyller inn paa skatteetaten.no for haand. Jeg trenger et program som automatiserer beregningene og gir meg ferdig utfylte tall per termin.

---

## Mine inntekter og utgifter

### Salg (inntekter) - Kode 52
- All omsetning er salg av software til kunder i utlandet
- Faktureres med 0% MVA (fritatt, ikke unntatt) etter merverdiavgiftsloven 6-21 og 6-22
- Foeres paa MVA-kode 52 Utfoersel av varer og tjenester
- Kun grunnlag (totalbeloep) rapporteres, MVA er alltid 0
- Fritatt omsetning gir full fradragsrett for inngaaende MVA

### Utgifter fra utenlandske leverandoerer - Kode 86
Tjenester kjoept fra utlandet uten norsk MVA. Omvendt avgiftsplikt (reverse charge) gjelder.

Eksempler paa mine utgifter:
- Microsoft 365 / Outlook-abonnementer (maanedlig, fakturert i EUR/USD)
- Domeneregistreringer fra utenlandske registrarer
- Tuxis (nederlandsk hosting/backup, fakturert i EUR)
- Andre SaaS-tjenester fra utlandet

Regler for kode 86:
- Grunnlag = totalbeleopet omregnet til NOK (beleopet er UTEN norsk MVA)
- Beregnet MVA = grunnlag x 0.25 (25% av grunnlag)
- Fradrag = samme beloep som beregnet MVA, men med negativt fortegn
- Netto MVA-effekt = alltid 0 (beregnet MVA og fradrag nuller hverandre ut)
- MAA likevel rapporteres i MVA-meldingen
- Valuta maa omregnes til NOK etter kurs paa fakturadato eller betalingsdato

### Utgifter fra norske leverandoerer - Kode 1
Kjoep i Norge der fakturaen inkluderer 25% MVA.

Eksempler:
- Telenor internett/bredbaand (maanedlig)
- Norsk programvare, kontorrekvisita, utstyr

Regler for kode 1 (KRITISK - vanlig feilkilde):
- Beloepene paa fakturaen er INKLUDERT MVA
- MVA-beloep til fradrag = totalbeloep inkl. MVA x 0.2 (IKKE x 0.25!)
- Forklaring: Grunnlag 878.40 kr x 0.25 = 219.60 MVA. Total = 1098 kr. Altsaa: 1098 x 0.2 = 219.60
- Kun MVA-beleopet foeres i meldingen (ikke grunnlag), med negativt fortegn
- Krav: Selger maa vaere registrert i MVA-registeret, faktura maa ha org.nr med MVA

---

## MVA-meldingen - struktur per termin

Terminer: Jan-Feb, Mar-Apr, Mai-Jun, Jul-Aug, Sep-Okt, Nov-Des
Frist: 10. i maaneden etter terminen (f.eks. 10. februar for nov-des)

### Hva som fylles inn hos Skatteetaten:

Kode 52:
- Grunnlag: Sum salg til utlandet i terminen (fortegn: +)
- Sats: 0%
- MVA: 0

Kode 86 (to deler):
- Del 1 - Beregnet avgift:
  - Grunnlag: Sum utenlandske kjoep i terminen, uten MVA (fortegn: +)
  - Sats: 25%
  - MVA: Grunnlag x 0.25 (fortegn: +)
- Del 2 - Fradrag:
  - MVA: Samme beloep som beregnet MVA (fortegn: -)

Kode 1:
- MVA fradrag: Sum norske kjoep inkl. MVA x 0.2 (fortegn: -)
- Ingen grunnlag fylles inn

### Resultat-formel
Sum MVA = 0 (kode 52) + beregnet86 - fradrag86 - fradragKode1
= -fradragKode1
Negativt tall = penger tilbake fra staten.

---

## Spesielle regler

### EKOM-tjenester (telefon/internett)
- Sjablongbeloep for privat bruk: 4392 kr/aar (2025 og 2026), 366 kr/mnd
- Gjelder uansett antall abonnementer
- Min arbeidsgiver betaler mobiltelefon, saa jeg foerer kun internett i ENK
- Ved aarsavslutning maa privat andel tilbakefoeres skattemessig
- MVA-fradrag skal ogsaa korrigeres for privat bruk ved aarets slutt

### Valutahaandtering
- Utenlandske fakturaer (EUR, USD) maa omregnes til NOK
- Bruk kurs fra fakturadato eller betalingsdato
- Bankens kurs ved trekk fra konto er akseptabelt

### Krav til bilag
- Alle kjoep maa ha kvittering/faktura
- Norske fakturaer maa ha selgers org.nr + MVA
- Uten bilag = ingen fradrag

---

## Oensket funksjonalitet i programmet

### Registrering av transaksjoner
- Legg inn utgifter med: beskrivelse, beloep, valuta, leverandoer (norsk/utenlandsk), dato
- MVA-kode settes automatisk: utenlandsk = kode 86, norsk = kode 1
- Legg inn salg med: beskrivelse, beloep, kunde, dato (alltid kode 52)
- Faste maanedlige regninger (abonnementer) som repeteres automatisk
- Valutaomregning EUR/USD til NOK (hent kurs automatisk eller manuell input)

### Automatisk MVA-beregning per termin
- Kode 52: Summer salg per termin
- Kode 86: Summer utenlandske kjoep, beregn MVA x 0.25, beregn fradrag
- Kode 1: Summer norske kjoep (inkl. MVA), beregn MVA-fradrag x 0.2
- Vis ferdig utfylt MVA-melding per termin med alle koder og beloep

### Rapporter og eksport
- Oversikt over alle transaksjoner per maaned/termin/aar
- MVA-melding klar til utfylling hos Skatteetaten
- Aarsoppsummering med total salg, totale kostnader, total MVA tilbake
- Eksport til Excel/PDF

### Andre MVA-koder som kan bli relevante
- Kode 11: Inngaaende MVA 15% (mat/drikke)
- Kode 13: Inngaaende MVA 12% (hotell/transport)
- Kode 81: Import av fysiske varer fra utlandet

---

## Eksempel: MVA-melding Nov-Des 2025

### Registrerte utgifter:

Kode 86 (utland, uten MVA):
- Outlook egeland.io: 131.55 + 131.55 = 263.10 kr
- Outlook uavmatrix.com: 86.36 + 86.36 = 172.72 kr
- Tuxis Proxmox PBS: 237.55 + 237.55 = 475.10 kr
- Domene uavmatrix.com: 1234.00 kr
- Sum grunnlag kode 86: 2144.92 kr (rundet til 2145)

Kode 1 (Norge, inkl. MVA):
- Telenor internett: 1098.00 + 1098.00 = 2196.00 kr
- MVA fradrag kode 1: 2196 x 0.2 = 439.20 kr (rundet til 439)

Kode 52 (salg):
- Software salg: 3828 kr

### Ferdig MVA-melding:

Kode 52: Grunnlag 3828, Sats 0%, MVA 0
Kode 86 beregnet: Grunnlag 2145, Sats 25%, MVA +536
Kode 86 fradrag: MVA -536
Kode 1 fradrag: MVA -439
Sum MVA: -439

Resultat: 439 kr tilbake fra staten.

---

## Kritiske beregningsregler (VIKTIG FOR UTVIKLER)

1. Kode 86 (utland): Beloep er UTEN MVA -> beregn MVA med x 0.25
2. Kode 1 (Norge): Beloep er MED MVA -> beregn MVA med x 0.2
3. Kode 52 (salg utland): Kun grunnlag, MVA er alltid 0
4. Kode 86 gaar ALLTID i null (beregnet MVA = fradrag)
5. Negativt sum-beloep = penger tilbake fra staten
6. Frist for innlevering: 10. i maaneden etter terminen
7. Fakturadato bestemmer hvilken termin transaksjonen tilhoerer

---

## Tekniske notater
- Webapp (React/Next.js eller lignende)
- Lokal datalagring eller enkel database
- Ingen autentisering noedvendig (personlig bruk)
- Mulighet for aa legge ved bilag (bilde/PDF av kvittering)