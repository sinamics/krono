export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncStripe, syncPaypal } = await import("./cronTasks");
    syncStripe();
    syncPaypal();
  }
}
