import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VoiceControlsProps {
  settings: {
    rate: number;
    pitch: number;
    volume: number;
    voice: string;
  };
  onSettingsChange: (settings: any) => void;
}

export const VoiceControls = ({ settings, onSettingsChange }: VoiceControlsProps) => {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-semibold flex items-center gap-2">
        🎚️ Controles de Voz
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Velocidade: {settings.rate.toFixed(1)}x</Label>
          <Slider
            value={[settings.rate]}
            onValueChange={([rate]) => onSettingsChange({...settings, rate})}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label>Tom: {settings.pitch.toFixed(1)}</Label>
          <Slider
            value={[settings.pitch]}
            onValueChange={([pitch]) => onSettingsChange({...settings, pitch})}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label>Volume: {settings.volume.toFixed(1)}</Label>
          <Slider
            value={[settings.volume]}
            onValueChange={([volume]) => onSettingsChange({...settings, volume})}
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label>Timbre</Label>
          <Select value={settings.voice} onValueChange={(voice) => onSettingsChange({...settings, voice})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
