import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const agents = [
  {
    id: 'clara-previdencia' as const,
    name: 'Dra. Clara Previdência',
    role: 'Especialista em Direito Previdenciário',
    icon: '👩‍⚖️',
    color: 'from-blue-500 to-purple-500',
    description: 'Revisão de benefícios do INSS'
  },
  {
    id: 'carlos-consorcio' as const,
    name: 'Carlos Consórcio',
    role: 'Especialista em Consórcios',
    icon: '👨‍💼',
    color: 'from-purple-500 to-pink-500',
    description: 'Contemplação e renegociação'
  }
];

interface AgentSelectorProps {
  selectedAgent: 'clara-previdencia' | 'carlos-consorcio';
  onAgentChange: (agent: 'clara-previdencia' | 'carlos-consorcio') => void;
}

export const AgentSelector = ({ selectedAgent, onAgentChange }: AgentSelectorProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className={cn(
            "p-6 cursor-pointer transition-all duration-300 hover:scale-105",
            selectedAgent === agent.id 
              ? `bg-gradient-to-br ${agent.color} text-white shadow-xl` 
              : "bg-card hover:shadow-lg"
          )}
          onClick={() => onAgentChange(agent.id)}
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl">{agent.icon}</div>
            <div className="flex-1">
              <h3 className={cn(
                "text-2xl font-bold mb-1",
                selectedAgent === agent.id ? "text-white" : "text-foreground"
              )}>
                {agent.name}
              </h3>
              <p className={cn(
                "text-sm mb-2",
                selectedAgent === agent.id ? "text-white/90" : "text-muted-foreground"
              )}>
                {agent.role}
              </p>
              <p className={cn(
                "text-xs",
                selectedAgent === agent.id ? "text-white/80" : "text-muted-foreground"
              )}>
                {agent.description}
              </p>
            </div>
            {selectedAgent === agent.id && (
              <div className="bg-white/20 rounded-full p-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
