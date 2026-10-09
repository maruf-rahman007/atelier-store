function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/* Auth variables are checked on first read, so the storefront can run
 * without auth configured; only the auth server reads them. */
export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  get BETTER_AUTH_SECRET() {
    return required("BETTER_AUTH_SECRET");
  },
  get BETTER_AUTH_URL() {
    return required("BETTER_AUTH_URL");
  },
};
