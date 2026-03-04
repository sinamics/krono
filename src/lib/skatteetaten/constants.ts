export const TERM_PERIODS: Record<number, string> = {
  1: "januar-februar",
  2: "mars-april",
  3: "mai-juni",
  4: "juli-august",
  5: "september-oktober",
  6: "november-desember",
};

const TEST_URLS = {
  altinnToken:
    "https://platform.tt02.altinn.no/authentication/api/v1/exchange/id-porten",
  validation:
    "https://idporten-api-sbstest.sits.no/api/mva/grensesnittstoette/mva-melding/valider",
  appBase:
    "https://skd.apps.tt02.altinn.no/skd/mva-melding-innsending-etm2",
  idPortenAuth:
    "https://login.test.idporten.no/authorize",
  idPortenToken:
    "https://test.idporten.no/token",
};

const PROD_URLS = {
  altinnToken:
    "https://platform.altinn.no/authentication/api/v1/exchange/id-porten",
  validation:
    "https://idporten.api.skatteetaten.no/api/mva/grensesnittstoette/mva-melding/valider",
  appBase:
    "https://skd.apps.altinn.no/skd/mva-melding-innsending-etm2",
  idPortenAuth:
    "https://login.idporten.no/authorize",
  idPortenToken:
    "https://idporten.no/token",
};

export function getUrls() {
  const env = process.env.SKATTEETATEN_ENV ?? "test";
  return env === "prod" ? PROD_URLS : TEST_URLS;
}
