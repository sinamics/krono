"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="no">
      <body className="antialiased">
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "1rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#ef4444" }}
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div>
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Kritisk feil
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#737373",
                marginTop: "0.5rem",
              }}
            >
              Applikasjonen støtte på en kritisk feil. Prøv å laste siden på
              nytt.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "#171717",
              color: "#fafafa",
              cursor: "pointer",
            }}
          >
            Last inn på nytt
          </button>
        </div>
      </body>
    </html>
  );
}
