export async function hashPassword(plain: string): Promise<string> {
  if (typeof Bun !== "undefined") {
    return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
  }
  // @ts-expect-error - bcrypt is optional fallback dependency
  const { hash } = await import("bcrypt");
  return hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  if (typeof Bun !== "undefined") {
    return Bun.password.verify(plain, hashed);
  }
  // @ts-expect-error - bcrypt is optional fallback dependency
  const { compare } = await import("bcrypt");
  return compare(plain, hashed);
}
