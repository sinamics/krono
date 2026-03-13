import { NextResponse } from "next/server";
import archiver from "archiver";
import path from "path";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { PassThrough } from "stream";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";

const BATCH_SIZE = 1000;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const userId = session.userId;

  const passthrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 5 } });
  archive.pipe(passthrough);

  // Stream JSON manually so we never hold all rows in memory
  const jsonStream = new PassThrough();
  archive.append(jsonStream, { name: "data.json" });

  // Write JSON in streaming fashion
  (async () => {
    try {
      const [suppliers, mvaTerms, settings, integrations] = await Promise.all([
        db.supplier.findMany({ where: { userId } }),
        db.mvaTerm.findMany({ where: { userId } }),
        db.businessSettings.findUnique({ where: { userId } }),
        db.integration.findMany({ where: { userId } }),
      ]);

      jsonStream.write(
        `{\n"version":1,\n"exportedAt":"${new Date().toISOString()}",\n`
      );
      jsonStream.write(`"suppliers":${JSON.stringify(suppliers)},\n`);
      jsonStream.write(`"mvaTerms":${JSON.stringify(mvaTerms)},\n`);
      jsonStream.write(`"businessSettings":${JSON.stringify(settings)},\n`);
      jsonStream.write(`"integrations":${JSON.stringify(integrations)},\n`);

      // Stream transactions in batches
      jsonStream.write(`"transactions":[\n`);

      let cursor: string | undefined;
      let first = true;

      while (true) {
        const batch = await db.transaction.findMany({
          where: { userId },
          include: { auditLogs: true },
          take: BATCH_SIZE,
          orderBy: { id: "asc" },
          ...(cursor
            ? { skip: 1, cursor: { id: cursor } }
            : {}),
        });

        if (batch.length === 0) break;

        for (const tx of batch) {
          const prefix = first ? "" : ",\n";
          first = false;
          jsonStream.write(prefix + JSON.stringify(tx));

          // Add receipt file to archive
          if (tx.receiptUrl) {
            const diskPath = path.join(process.cwd(), "public", tx.receiptUrl);
            try {
              const s = await stat(diskPath);
              if (s.isFile()) {
                const archivePath = tx.receiptUrl.replace(/^\//, "");
                archive.append(createReadStream(diskPath), {
                  name: archivePath,
                });
              }
            } catch {
              // File missing, skip
            }
          }
        }

        cursor = batch[batch.length - 1].id;
        if (batch.length < BATCH_SIZE) break;
      }

      jsonStream.write(`\n]\n}\n`);
      jsonStream.end();

      await archive.finalize();
    } catch (err) {
      jsonStream.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  const readable = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passthrough.on("end", () => {
        controller.close();
      });
      passthrough.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `krono-backup-${date}.zip`;

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
