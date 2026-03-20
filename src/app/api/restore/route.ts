import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";

const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const organizationId = session.organizationId;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Ingen fil" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);

  const dataFile = zip.file("data.json");
  if (!dataFile) {
    return NextResponse.json(
      { error: "Ugyldig backup: mangler data.json" },
      { status: 400 }
    );
  }

  const data = JSON.parse(await dataFile.async("string"));

  // Backward compatible: v1 backups (userId-based) and v2 (organizationId-based)
  // are both supported. All data is re-assigned to the current user's organizationId
  // regardless of what the backup contained. Old IDs (userId, supplierId, etc.) are
  // only used for internal mapping (e.g. supplier old→new ID) and receipt URL remapping.

  // --- Restore suppliers ---
  const supplierIdMap = new Map<string, string>();
  if (data.suppliers?.length) {
    for (let i = 0; i < data.suppliers.length; i += BATCH_SIZE) {
      const batch = data.suppliers.slice(i, i + BATCH_SIZE);
      for (const s of batch) {
        const newSupplier = await db.supplier.create({
          data: {
            organizationId,
            name: s.name,
            country: s.country ?? "Norge",
            currency: s.currency ?? "NOK",
            type: s.type,
            defaultMvaCode: s.defaultMvaCode,
            defaultCategory: s.defaultCategory,
            orgNr: s.orgNr,
            vatId: s.vatId,
          },
        });
        supplierIdMap.set(s.id, newSupplier.id);
      }
    }
  }

  // --- Restore receipt files ---
  const receiptUrlMap = new Map<string, string>();
  const uploadEntries = Object.entries(zip.files).filter(
    ([name]) => name.startsWith("uploads/") && !name.endsWith("/")
  );

  const uploadDir = path.join(process.cwd(), "public", "uploads", organizationId);
  if (uploadEntries.length > 0) {
    await mkdir(uploadDir, { recursive: true });
  }

  for (const [archivePath, zipEntry] of uploadEntries) {
    const content = await zipEntry.async("nodebuffer");
    const ext = path.extname(archivePath);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const diskPath = path.join(uploadDir, safeName);
    await writeFile(diskPath, content);
    const newUrl = `/uploads/${organizationId}/${safeName}`;
    receiptUrlMap.set(`/${archivePath}`, newUrl);
  }

  // --- Restore transactions in batches ---
  let transactionCount = 0;
  const transactions = data.transactions ?? [];

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    for (const tx of batch) {
      const mappedSupplierId = tx.supplierId
        ? supplierIdMap.get(tx.supplierId)
        : null;
      const mappedReceiptUrl = tx.receiptUrl
        ? receiptUrlMap.get(tx.receiptUrl) ?? tx.receiptUrl
        : null;

      const newTx = await db.transaction.create({
        data: {
          organizationId,
          date: new Date(tx.date),
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency ?? "NOK",
          exchangeRate: tx.exchangeRate ?? 1,
          amountNOK: tx.amountNOK,
          type: tx.type,
          mvaCode: tx.mvaCode,
          supplierId: mappedSupplierId,
          category: tx.category,
          receiptUrl: mappedReceiptUrl,
          isRecurring: tx.isRecurring ?? false,
          recurringDay: tx.recurringDay,
          notes: tx.notes,
          termPeriod: tx.termPeriod,
          externalId: tx.externalId,
          bilagsnummer: tx.bilagsnummer,
          deletedAt: tx.deletedAt ? new Date(tx.deletedAt) : null,
        },
      });
      transactionCount++;

      // Restore audit logs
      if (tx.auditLogs?.length) {
        await db.auditLog.createMany({
          data: tx.auditLogs.map(
            (log: { action: string; changes: string; createdAt: string }) => ({
              transactionId: newTx.id,
              userId: session.userId,
              action: log.action,
              changes: log.changes,
              createdAt: new Date(log.createdAt),
            })
          ),
        });
      }
    }
  }

  // --- Restore MVA terms ---
  if (data.mvaTerms?.length) {
    for (const term of data.mvaTerms) {
      await db.mvaTerm.upsert({
        where: {
          organizationId_year_term: { organizationId, year: term.year, term: term.term },
        },
        update: {
          kode52Grunnlag: term.kode52Grunnlag,
          kode86Grunnlag: term.kode86Grunnlag,
          kode86Mva: term.kode86Mva,
          kode86Fradrag: term.kode86Fradrag,
          kode1MvaFradrag: term.kode1MvaFradrag,
          totalMva: term.totalMva,
          status: term.status,
          submittedAt: term.submittedAt ? new Date(term.submittedAt) : null,
          deadline: new Date(term.deadline),
        },
        create: {
          organizationId,
          year: term.year,
          term: term.term,
          kode52Grunnlag: term.kode52Grunnlag,
          kode86Grunnlag: term.kode86Grunnlag,
          kode86Mva: term.kode86Mva,
          kode86Fradrag: term.kode86Fradrag,
          kode1MvaFradrag: term.kode1MvaFradrag,
          totalMva: term.totalMva,
          status: term.status,
          submittedAt: term.submittedAt ? new Date(term.submittedAt) : null,
          deadline: new Date(term.deadline),
        },
      });
    }
  }

  // --- Restore business settings ---
  if (data.businessSettings) {
    const s = data.businessSettings;
    await db.businessSettings.upsert({
      where: { organizationId },
      update: {
        orgNr: s.orgNr,
        businessName: s.businessName,
        address: s.address,
        ekomPrivatePercent: s.ekomPrivatePercent ?? 0,
        defaultCurrency: s.defaultCurrency ?? "NOK",
      },
      create: {
        organizationId,
        orgNr: s.orgNr,
        businessName: s.businessName,
        address: s.address,
        ekomPrivatePercent: s.ekomPrivatePercent ?? 0,
        defaultCurrency: s.defaultCurrency ?? "NOK",
      },
    });
  }

  // --- Restore integrations ---
  if (data.integrations?.length) {
    for (const integ of data.integrations) {
      const name = integ.name ?? "Standard";
      await db.integration.upsert({
        where: {
          organizationId_provider_name: {
            organizationId,
            provider: integ.provider,
            name,
          },
        },
        update: { apiKey: integ.apiKey, isActive: integ.isActive ?? true },
        create: {
          organizationId,
          provider: integ.provider,
          name,
          apiKey: integ.apiKey,
          isActive: integ.isActive ?? true,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    restored: {
      suppliers: supplierIdMap.size,
      transactions: transactionCount,
      mvaTerms: data.mvaTerms?.length ?? 0,
      receipts: receiptUrlMap.size,
    },
  });
}
