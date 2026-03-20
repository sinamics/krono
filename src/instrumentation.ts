export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncStripe, syncPaypal, syncExchangeRates } = await import("./cronTasks");
    syncStripe();
    syncPaypal();
    syncExchangeRates();
  }
}
