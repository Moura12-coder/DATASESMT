import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GHEAuditHistoryProps {
  gheId: number;
}

export function GHEAuditHistory({ gheId }: GHEAuditHistoryProps) {
  const { data: auditLog = [], isLoading } = trpc.phase1.ghe.getAuditLog.useQuery({ gheId });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-green-600">Criado</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-600">Editado</Badge>;
      case "DELETE":
        return <Badge className="bg-red-600">Deletado</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>Rastreamento de todas as mudanças neste GHE</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!auditLog || auditLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>Rastreamento de todas as mudanças neste GHE</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Nenhuma alteração registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
        <CardDescription>Rastreamento de todas as mudanças neste GHE ({auditLog.length} registros)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Mudanças</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((log: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="text-sm">{log.userName || "Sistema"}</TableCell>
                  <TableCell className="text-sm">
                    {log.changes ? (
                      <div className="max-w-xs">
                        {Object.entries(log.changes).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-xs text-muted-foreground">
                            <span className="font-semibold">{key}:</span> {value.old} → {value.new}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
