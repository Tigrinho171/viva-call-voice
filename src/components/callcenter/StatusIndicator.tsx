import { Card } from "@/components/ui/card";

interface StatusIndicatorProps {
  agent: string;
}

export const StatusIndicator = ({ agent }: StatusIndicatorProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        <div>
          <p className="font-semibold text-sm">Sistema Online</p>
          <p className="text-xs text-muted-foreground">
            {agent === 'clara-previdencia' ? 'Dra. Clara Previdência' : 'Carlos Consórcio'} • Lovable AI
          </p>
        </div>
      </div>
    </Card>
  );
};
