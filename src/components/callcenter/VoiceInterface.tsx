import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VoiceControls } from "./VoiceControls";

interface VoiceInterfaceProps {
  agentType: 'clara-previdencia' | 'carlos-consorcio';
  conversationHistory: Array<{role: string, content: string, timestamp: Date}>;
  onConversationUpdate: (history: Array<{role: string, content: string, timestamp: Date}>) => void;
}

export const VoiceInterface = ({ agentType, conversationHistory, onConversationUpdate }: VoiceInterfaceProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: 'female'
  });
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // Se o agente estiver falando e o usuário começar a falar, interromper
        if (isSpeaking && audioRef.current) {
          console.log('🛑 Usuário interrompeu o agente');
          audioRef.current.pause();
          audioRef.current = null;
          setIsSpeaking(false);
        }
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        if (event.results[current].isFinal) {
          silenceTimerRef.current = setTimeout(() => {
            if (transcriptText.trim()) {
              handleSendMessage(transcriptText);
              setTranscript("");
            }
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: "Erro no reconhecimento de voz",
            description: "Não foi possível reconhecer sua fala.",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        if (isActive && !isSpeaking) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart prevented:', e);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isActive, isSpeaking]);

  const toggleActive = () => {
    if (isActive) {
      recognitionRef.current?.stop();
      setIsActive(false);
      setTranscript("");
      toast({
        title: "Chamada encerrada",
        description: "A conversação em tempo real foi finalizada.",
      });
    } else {
      recognitionRef.current?.start();
      setIsActive(true);
      toast({
        title: "Chamada iniciada",
        description: "Pode falar naturalmente. O sistema detectará automaticamente quando você parar de falar.",
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedHistory = [...conversationHistory, userMessage];
    onConversationUpdate(updatedHistory);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          message: message,
          agentType: agentType,
          conversationHistory: conversationHistory
        }
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      onConversationUpdate([...updatedHistory, assistantMessage]);
      await speakResponse(data.response);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro ao processar mensagem",
        description: "Não foi possível obter resposta do agente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text,
          voice: voiceSettings.voice === 'female' ? 'Aria' : 'Charlie'
        }
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audioRef.current = audio;
      
      audio.volume = voiceSettings.volume;
      audio.playbackRate = voiceSettings.rate;
      
      audio.onended = () => {
        audioRef.current = null;
        setIsSpeaking(false);
      };

      await audio.play();

    } catch (error) {
      console.error('Error speaking:', error);
      audioRef.current = null;
      setIsSpeaking(false);
      toast({
        title: "Erro na síntese de voz",
        description: "Não foi possível reproduzir o áudio.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Chamada em Tempo Real</h2>
        {isActive ? (
          <Badge variant="default" className="animate-pulse">
            🔴 AO VIVO
          </Badge>
        ) : (
          <Badge variant="secondary">
            Desconectado
          </Badge>
        )}
      </div>

      <VoiceControls 
        settings={voiceSettings}
        onSettingsChange={setVoiceSettings}
      />

      <div className="mt-6 space-y-6">
        <div className="flex justify-center">
          <Button
            onClick={toggleActive}
            size="lg"
            variant={isActive ? "destructive" : "default"}
            className="h-24 w-24 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform"
          >
            {isActive ? "🔴 Encerrar" : "📞 Iniciar"}
          </Button>
        </div>

        {isActive && (
          <div className="space-y-4">
            {transcript && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">Você está dizendo:</p>
                <p className="text-base">{transcript}</p>
              </div>
            )}

            {isProcessing && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-2 text-muted-foreground">Processando...</span>
                </div>
              </div>
            )}

            {isSpeaking && (
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <p className="text-lg font-medium animate-pulse">
                  🎤 Agente respondendo...
                </p>
              </div>
            )}

            {!transcript && !isProcessing && !isSpeaking && (
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-muted-foreground">
                  🎧 Escutando... Fale naturalmente
                </p>
              </div>
            )}
          </div>
        )}

        {!isActive && (
          <div className="text-center p-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground mb-2">
              Clique no botão acima para iniciar uma chamada em tempo real.
            </p>
            <p className="text-sm text-muted-foreground">
              Não é necessário clicar em botões durante a conversa. O sistema detectará automaticamente quando você parar de falar.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
