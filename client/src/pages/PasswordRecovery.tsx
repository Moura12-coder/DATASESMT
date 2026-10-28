import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation();
  const change = trpc.auth.resetPassword.useMutation();
  const busy = request.isPending || change.isPending;
  const token = new URLSearchParams(window.location.search).get("token") || "";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (reset) {
        if (password !== confirmation) {
          setError("As senhas não conferem");
          return;
        }
        await change.mutateAsync({ token, newPassword: password });
        window.history.replaceState({}, "", "/reset-password");
        setPassword("");
        setConfirmation("");
        setMessage("Senha atualizada. Entre com sua nova senha.");
      } else setMessage((await request.mutateAsync({ email })).message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível concluir a operação"
      );
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white border shadow-sm p-8 space-y-5">
        <p className="text-blue-700 font-semibold">DataSESMT</p>
        <h1 className="text-2xl font-bold">
          {reset ? "Definir nova senha" : "Recuperar acesso"}
        </h1>
        <p className="text-slate-600 text-sm">
          {reset
            ? "Use uma senha de 8 a 128 caracteres."
            : "Informe seu email para receber um link de recuperação."}
        </p>
        {message ? (
          <p role="status" className="text-green-800">
            {message}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {reset ? (
              <>
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={busy}
                />
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  disabled={busy}
                />
              </>
            ) : (
              <>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={busy}
                />
              </>
            )}
            {error && (
              <p role="alert" className="text-red-700 text-sm">
                {error}
              </p>
            )}
            {reset && !token && (
              <p role="alert" className="text-red-700">
                Link inválido. Solicite uma nova recuperação.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={busy || (reset && !token)}
            >
              {busy ? "Processando…" : reset ? "Salvar senha" : "Enviar link"}
            </Button>
          </form>
        )}
        <Link href="/login" className="block text-blue-700 text-sm">
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}
