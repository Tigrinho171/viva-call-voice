import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "Aria" } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Voice IDs mapping
    const voiceIds: Record<string, string> = {
      'Aria': '9BWtsMINqrJLrRacOk9x',
      'Sarah': 'EXAVITQu4vr4xnSDxMaL',
      'Laura': 'FGY2WhTYpPnrIDTdsKH5',
      'Charlie': 'IKne3meq5aSn9XLyUdCD',
      'female': '9BWtsMINqrJLrRacOk9x', // Aria
      'male': 'IKne3meq5aSn9XLyUdCD', // Charlie
    };

    const voiceId = voiceIds[voice] || voiceIds['Aria'];

    console.log(`🎤 Generating speech with voice: ${voice} (${voiceId})`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    console.log('✅ Audio generated successfully');

    return new Response(
      JSON.stringify({ audio: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
