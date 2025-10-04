import { useState } from "react";
import { VoiceInterface } from "@/components/callcenter/VoiceInterface";
import { ConversationHistory } from "@/components/callcenter/ConversationHistory";
import { AgentSelector } from "@/components/callcenter/AgentSelector";
import { StatusIndicator } from "@/components/callcenter/StatusIndicator";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState<'clara-previdencia' | 'carlos-consorcio'>('clara-previdencia');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string, timestamp: Date}>>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Call Center Virtual
          </h1>
          <p className="text-xl text-muted-foreground">
            Atendimento inteligente com agentes virtuais especializados
          </p>
        </header>

        {/* Agent Selector */}
        <div className="max-w-4xl mx-auto mb-6">
          <AgentSelector 
            selectedAgent={selectedAgent} 
            onAgentChange={setSelectedAgent}
          />
        </div>

        {/* Status */}
        <div className="max-w-4xl mx-auto mb-6">
          <StatusIndicator agent={selectedAgent} />
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto space-y-6">
          <VoiceInterface 
            agentType={selectedAgent}
            conversationHistory={conversationHistory}
            onConversationUpdate={setConversationHistory}
          />

          <ConversationHistory 
            history={conversationHistory}
            agent={selectedAgent}
          />
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Powered by Lovable AI • Respostas em tempo real</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
