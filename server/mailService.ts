import { TRPCError } from "@trpc/server";
export function requireMailConfiguration() {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.MAIL_FROM ||
    !process.env.APP_URL
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Recuperação de senha indisponível. Contate o administrador.",
    });
  }
  const url = new URL(process.env.APP_URL);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("APP_URL must use HTTPS");
}
export async function sendResetEmail(email: string, token: string) {
  requireMailConfiguration();
  const url = new URL("/reset-password", process.env.APP_URL);
  url.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [email],
      subject: "Redefina sua senha — DataSESMT",
      text: `Acesse o link para redefinir sua senha: ${url.toString()}\nO link expira em uma hora. Se você não solicitou, ignore esta mensagem.`,
    }),
  });
  if (!response.ok) throw new Error("Password reset email delivery failed");
}
