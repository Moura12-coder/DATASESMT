import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bot, Send, User, Sparkles, ShieldAlert, FileText, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string; timestamp: Date };

const quickPrompts = [
  { icon: <ShieldAlert size={14} />, label: "Análise de riscos", prompt: "Analise os riscos mais críticos do sistema e sugira medidas de controle prioritárias." },
  { icon: <FileText size={14} />, label: "Gerar relatório PGR", prompt: "Com base nos dados do sistema, gere um resumo executivo do PGR com os principais pontos de atenção." },
  { icon: <Lightbulb size={14} />, label: "Sugestões de melhoria", prompt: "Quais são as principais melhorias que posso implementar no programa de SST da empresa?" },
  { icon: <ShieldAlert size={14} />, label: "Conformidade NRs", prompt: "Verifique a conformidade com as principais NRs e liste os itens que precisam de atenção." },
  { icon: <FileText size={14} />, label: "Checklist de inspeção", prompt: "Gere um checklist de inspeção de segurança para uma área industrial genérica." },
  { icon: <Lightbulb size={14} />, label: "Hierarquia de controles", prompt: "Explique a hierarquia de controles de riscos conforme a NR-01 e como aplicá-la." },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o **Assistente IA do DataSESMT Pro**, especializado em Saúde e Segurança do Trabalho.\n\nPosso ajudá-lo com:\n- Análise de riscos e medidas de controle\n- Geração de documentos SST (PGR, PCMSO, LTCAT)\n- Interpretação de Normas Regulamentadoras\n- Sugestões de melhoria do programa SST\n- Investigação de incidentes\n- Conformidade com o eSocial SST\n\nComo posso ajudá-lo hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: stats } = trpc.dashboard.stats.useQuery({});
  const { data: risks = [] } = trpc.risks.list.useQuery({});
  const { data: incidents = [] } = trpc.incidents.list.useQuery({});

  const askMutation = trpc.ai.ask.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant" as const, content: String(data.response ?? ''), timestamp: new Date() }]);
      setIsLoading(false);
    },
    onError: (e) => {
      toast.error("Erro ao consultar a IA: " + e.message);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const context = {
      totalEmployees: stats?.totalEmployees || 0,
      highRisks: stats?.highRisks || 0,
      daysWithoutAccident: stats?.daysWithoutAccident || 0,
      complianceScore: stats?.complianceScore || 0,
      recentRisks: risks.slice(0, 5).map(r => ({ description: r.description, type: r.type, level: r.riskLevel })),
      recentIncidents: incidents.slice(0, 3).map(i => ({ type: i.type, description: i.description, status: i.status })),
    };

    askMutation.mutate({
      message: content,
      context: JSON.stringify(context),
      history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Conversa reiniciada. Como posso ajudá-lo com SST hoje?",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            Assistente IA SST
          </h1>
          <p className="text-sm text-muted-foreground">IA especializada em Saúde e Segurança do Trabalho com contexto do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 border-emerald-200 text-emerald-700">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            IA Ativa
          </Badge>
          <Button variant="outline" size="sm" onClick={clearChat} className="text-xs h-8">
            <RotateCcw size={12} className="mr-1.5" /> Limpar
          </Button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="shrink-0">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Sugestões rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p, i) => (
            <Button key={i} variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => sendMessage(p.prompt)} disabled={isLoading}>
              {p.icon} {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-blue-500 to-purple-600 text-white")}>
                {msg.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 text-foreground rounded-tl-sm border border-border")}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                  {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white animate-pulse" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-tl-sm border border-border px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Faça uma pergunta sobre SST, riscos, NRs, documentos..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} size="icon">
              <Send size={16} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            A IA tem acesso ao contexto do sistema (funcionários, riscos, incidentes) para respostas personalizadas.
          </p>
        </div>
      </Card>
    </div>
  );
}
