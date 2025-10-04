import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationHistoryProps {
  history: Array<{role: string, content: string, timestamp: Date}>;
  agent: string;
}

export const ConversationHistory = ({ history, agent }: ConversationHistoryProps) => {
  const exportConversation = () => {
    const text = history.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.role === 'user' ? 'CLIENTE' : agent.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhuma conversa ainda. Comece falando ou digitando uma mensagem.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📊 Histórico da Conversa</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportConversation}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-950 ml-8'
                  : 'bg-purple-100 dark:bg-purple-950 mr-8'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">
                  {msg.role === 'user' ? '👤 Cliente' : agent === 'clara-previdencia' ? '👩‍⚖️ Clara' : '👨‍💼 Carlos'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
