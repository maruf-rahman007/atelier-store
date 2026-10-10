/* Pure form rules shared by the auth forms (instant feedback) and the auth
 * Server Actions (the real check). Safe to import from Client Components. */

export const PASSWORD_MIN_LENGTH = 8; // keep in sync with emailAndPassword.minPasswordLength
export const PASSWORD_MAX_LENGTH = 128; // Better Auth's default maximum
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

export type AuthField = "name" | "email" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;
export type AuthMode = "sign-in" | "sign-up";

/* Deliberately loose: one @, something either side, a dot in the domain.
 * The server is the authority on whether an address is usable. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(
  mode: AuthMode,
  field: AuthField,
  value: string,
): string | undefined {
  switch (field) {
    case "name": {
      const name = value.trim();
      if (!name) return "Enter your name.";
      if (name.length > NAME_MAX_LENGTH)
        return `Use ${NAME_MAX_LENGTH} characters or fewer.`;
      return;
    }
    case "email": {
      const email = value.trim();
      if (!email) return "Enter your email address.";
      if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email))
        return "Enter an email address like name@example.com.";
      return;
    }
    case "password": {
      if (!value) return "Enter your password.";
      /* Sign-in only checks presence: existing passwords may predate rules. */
      if (mode === "sign-in") return;
      if (value.length < PASSWORD_MIN_LENGTH)
        return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
      if (value.length > PASSWORD_MAX_LENGTH)
        return `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`;
      return;
    }
  }
}

export const fieldsFor = (mode: AuthMode): AuthField[] =>
  mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];

export function validateAuthForm(
  mode: AuthMode,
  values: Partial<Record<AuthField, string>>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fieldsFor(mode)) {
    const error = validateField(mode, field, values[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
