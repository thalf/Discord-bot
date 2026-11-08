export async function handleMessage(message, logError = console.error) {
  if (message.author.bot || !message.inGuild() || message.content !== "!ping") return;
  try {
    await message.reply({ content: "pong 🏓", allowedMentions: { repliedUser: false } });
  } catch {
    logError("Could not reply to !ping; check channel permissions.");
  }
}
