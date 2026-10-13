function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/* Auth and Stripe variables are checked on first read, so the storefront can
 * run without them configured; only auth and checkout read them. */
export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  get BETTER_AUTH_SECRET() {
    return required("BETTER_AUTH_SECRET");
  },
  get BETTER_AUTH_URL() {
    return required("BETTER_AUTH_URL");
  },
  /* The app's public origin, for Stripe return URLs. Same as BETTER_AUTH_URL. */
  get APP_URL() {
    return new URL(required("BETTER_AUTH_URL")).origin;
  },
  get STRIPE_SECRET_KEY() {
    return required("STRIPE_SECRET_KEY");
  },
  get STRIPE_WEBHOOK_SECRET() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
};
