export function readConfig(env = process.env) {
  const token = env.DISCORD_TOKEN?.trim();
  if (!token) throw new Error("DISCORD_TOKEN is required.");
  const webKey = env.WEB_KEY;
  if (!webKey || webKey.trim().length < 24 || webKey !== webKey.trim())
    throw new Error("WEB_KEY must contain at least 24 characters with no surrounding whitespace.");
  const value = env.PORT ?? "3000";
  if (!/^[0-9]+$/.test(value) || Number(value) < 1 || Number(value) > 65535)
    throw new Error("PORT must be an integer between 1 and 65535.");
  return { token, webKey, port: Number(value), host: env.HOST || "127.0.0.1" };
}
