import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/withAuth";

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const MEDIA_TYPE_MAP: Record<string, ImageMediaType> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const { imageUrl } = await request.json();
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl er påkrevd" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", imageUrl);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Filen ble ikke funnet" }, { status: 404 });
  }

  const ext = path.extname(imageUrl).toLowerCase();
  const isPdf = ext === ".pdf";
  const mediaType = MEDIA_TYPE_MAP[ext];

  if (!isPdf && !mediaType) {
    return NextResponse.json({ error: "Ugyldig filtype" }, { status: 400 });
  }

  const base64 = fileBuffer.toString("base64");

  const client = new Anthropic();

  const contentBlock: Anthropic.ContentBlockParam = isPdf
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType!,
          data: base64,
        },
      };

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: `Analyser denne kvitteringen/fakturaen og ekstraher følgende data som JSON:
{
  "description": "kort beskrivelse av kjøpet/tjenesten",
  "amount": 0.00,
  "currency": "NOK eller EUR eller USD",
  "date": "YYYY-MM-DD",
  "supplierName": "leverandørens navn",
  "category": "f.eks. Kontor, Reise, Mat, Programvare, Utstyr",
  "reference": "referansenummer, fakturanummer, ordrenummer eller KID-nummer hvis det finnes"
}

Regler:
- amount skal være et tall uten valutasymbol
- currency skal være en av: NOK, EUR, USD. Bruk NOK som standard hvis ukjent.
- date skal være i ISO-format (YYYY-MM-DD)
- reference skal inneholde referanse-/faktura-/ordre-/KID-nummer hvis det finnes i dokumentet, ellers null
- Svar KUN med JSON-objektet, ingen annen tekst.`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Ingen respons fra AI" }, { status: 500 });
    }

    const jsonStr = textBlock.text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("AI parsing failed:", e);
    return NextResponse.json(
      { error: "Kunne ikke analysere kvitteringen" },
      { status: 500 }
    );
  }
}
