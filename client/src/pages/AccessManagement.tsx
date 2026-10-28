import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
export function AccessManagementPage() {
  const [offset, setOffset] = useState(0);
  const [target, setTarget] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const utils = trpc.useUtils();
  const pending = trpc.registration.getPendingRegistrations.useQuery({
    limit: 20,
    offset,
  });
  const approve = trpc.registration.approveRegistration.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      utils.registration.getPendingRegistrations.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const updateRole = trpc.rbac.updateUserRole.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      setTarget("");
    },
    onError: e => toast.error(e.message),
  });
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold">Gestão de acesso</h1>
        <p className="text-slate-600 mt-2">
          Analise os cadastros e conceda acesso aos módulos com dados de SST.
        </p>
      </header>
      <section className="border rounded-xl bg-white p-5 space-y-4">
        <h2 className="font-semibold">
          Cadastros pendentes ({pending.data?.total ?? "…"})
        </h2>
        {pending.isLoading && <p role="status">Carregando cadastros…</p>}
        {pending.error && (
          <p role="alert" className="text-red-700">
            {pending.error.message}
          </p>
        )}
        {pending.data?.users.length === 0 && (
          <p className="text-slate-500">
            Nenhum cadastro pendente nesta página.
          </p>
        )}
        <div className="divide-y">
          {pending.data?.users.map(user => (
            <article
              key={user.id}
              className="py-4 flex flex-wrap justify-between gap-4"
            >
              <div>
                <h3 className="font-medium">
                  {user.name}{" "}
                  <span className="text-slate-400 text-sm">#{user.id}</span>
                </h3>
                <p className="text-sm">{user.email}</p>
                <p className="text-sm text-slate-500">
                  {user.companyName} · {user.cnpj || "CNPJ não informado"}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  disabled={approve.isPending}
                  onClick={() =>
                    approve.mutate({ userId: user.id, approved: true })
                  }
                >
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  disabled={approve.isPending}
                  onClick={() => {
                    const reason = window.prompt("Motivo da rejeição:");
                    if (reason !== null)
                      approve.mutate({
                        userId: user.id,
                        approved: false,
                        rejectionReason: reason,
                      });
                  }}
                >
                  Rejeitar
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!offset}
            onClick={() => setOffset(Math.max(0, offset - 20))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!pending.data || offset + 20 >= pending.data.total}
            onClick={() => setOffset(offset + 20)}
          >
            Próxima
          </Button>
        </div>
      </section>
      <section className="border rounded-xl bg-white p-5 space-y-3">
        <h2 className="font-semibold">Perfil de acesso</h2>
        <p className="text-sm text-slate-600">
          A aprovação permite autenticar. O perfil de administrador permite
          acessar os dados de todas as unidades desta implantação. Conceda-o
          apenas aos responsáveis autorizados.
        </p>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={e => {
            e.preventDefault();
            if (window.confirm("Confirmar alteração de perfil deste usuário?"))
              updateRole.mutate({ userId: Number(target), newRole: role });
          }}
        >
          <Input
            aria-label="ID do usuário"
            type="number"
            min={1}
            step={1}
            required
            placeholder="ID do usuário"
            className="max-w-48"
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
          <select
            aria-label="Perfil"
            className="border rounded px-3"
            value={role}
            onChange={e => setRole(e.target.value as "user" | "admin")}
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
          <Button disabled={updateRole.isPending}>Salvar perfil</Button>
        </form>
      </section>
    </div>
  );
}
