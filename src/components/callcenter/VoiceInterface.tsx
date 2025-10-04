import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VoiceControls } from "./VoiceControls";

interface VoiceInterfaceProps {
  agentType: 'clara-previdencia' | 'carlos-consorcio';
  conversationHistory: Array<{role: string, content: string, timestamp: Date}>;
  onConversationUpdate: (history: Array<{role: string, content: string, timestamp: Date}>) => void;
}

export const VoiceInterface = ({ agentType, conversationHistory, onConversationUpdate }: VoiceInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: 'female'
  });

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        if (finalTranscript) {
          handleSendMessage(finalTranscript);
          setTranscript("");
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Erro no reconhecimento:', event.error);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Verifique as permissões do microfone",
          variant: "destructive"
        });
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis.cancel();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
      toast({
        title: "Gravação iniciada",
        description: "Fale agora..."
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    const updatedHistory = [...conversationHistory, userMessage];
    onConversationUpdate(updatedHistory);
    setCurrentMessage("");
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          message,
          agentType,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      onConversationUpdate([...updatedHistory, assistantMessage]);
      speakResponse(data.response);

    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: "Erro na comunicação",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      const voices = speechSynthesis.getVoices();
      const selectedVoice = voiceSettings.voice === 'female'
        ? voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) || voices.find(v => v.lang === 'pt-BR')
        : voices.find(v => v.lang === 'pt-BR');
      
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <VoiceControls 
        settings={voiceSettings}
        onSettingsChange={setVoiceSettings}
      />

      <div className="space-y-4">
        <div className="flex gap-4">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Digite sua mensagem ou use o microfone..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(currentMessage);
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              size="icon"
              className="h-12 w-12"
            >
              {isRecording ? <MicOff /> : <Mic />}
            </Button>
            <Button
              onClick={() => handleSendMessage(currentMessage)}
              disabled={isProcessing || !currentMessage.trim()}
              size="icon"
              className="h-12 w-12"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Volume2 />}
            </Button>
          </div>
        </div>

        {transcript && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Transcrevendo...</p>
            <p className="text-foreground">{transcript}</p>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Reproduzindo resposta...</span>
          </div>
        )}
      </div>
    </Card>
  );
};
