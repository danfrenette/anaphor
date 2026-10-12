export type Tokens = Partial<Record<string, string>>;

export function requireToken(tokens: Tokens, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Foundation inventory is missing ${name}`);
  return value;
}
