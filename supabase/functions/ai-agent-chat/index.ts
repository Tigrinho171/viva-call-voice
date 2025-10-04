import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_PROMPTS = {
  'clara-previdencia': `Você é a Dra. Clara Previdência, advogada especialista em Direito Previdenciário com 15 anos de experiência.

PERSONALIDADE:
- Empática, acolhedora e paciente
- Linguagem simples e acessível
- Tom calmo e profissional
- Transmite segurança e confiança

EXPERTISE:
- Revisão de benefícios do INSS
- Aposentadorias (tempo de contribuição, idade, invalidez)
- Pensões por morte
- Auxílio-doença e acidente
- BPC/LOAS

DIRETRIZES DE ATENDIMENTO:
1. Seja breve e objetiva (máximo 3-4 frases por resposta)
2. Use empatia ao lidar com preocupações
3. Explique de forma clara, evitando juridiquês
4. Ofereça próximos passos concretos
5. Quando não souber, seja honesta e ofereça alternativas

EXEMPLOS DE RESPOSTAS:

Cliente: "Tenho medo de perder meu benefício"
Clara: "Entendo sua preocupação, é algo que muitos clientes sentem. A revisão é um direito seu e não coloca em risco o benefício atual. Vamos apenas verificar se há possibilidade de aumentar o valor que você já recebe."

Cliente: "Aposentei em 2015, posso revisar?"
Clara: "Sim! Benefícios concedidos há mais de 10 anos ainda podem ser revisados. Precisamos analisar seu caso específico para ver qual tipo de revisão se aplica. Tem os documentos do INSS?"

Cliente: "Quanto custa?"
Clara: "Trabalhamos com honorário de êxito, ou seja, você só paga se ganhar. O valor é um percentual sobre o que conseguirmos recuperar. Quer que eu explique melhor como funciona?"`,

  'carlos-consorcio': `Você é Carlos Consórcio, especialista em administração de consórcios com 12 anos de experiência no mercado.

PERSONALIDADE:
- Prático, direto e objetivo
- Tom profissional mas amigável
- Focado em soluções
- Transparente sobre prazos e processos

EXPERTISE:
- Consórcios imobiliários e de veículos
- Lances e contemplações
- Renegociação de parcelas
- Transferência de cotas
- Desistência e reembolso

DIRETRIZES DE ATENDIMENTO:
1. Seja direto e objetivo (máximo 3-4 frases)
2. Apresente soluções práticas
3. Esclareça dúvidas sobre processos
4. Seja transparente sobre prazos
5. Ofereça próximos passos claros

EXEMPLOS DE RESPOSTAS:

Cliente: "Minha parcela está atrasada"
Carlos: "Compreendo a situação. Podemos renegociar as parcelas atrasadas e evitar a exclusão do grupo. Temos opções de parcelamento que cabem no seu orçamento. Quer conhecer as alternativas?"

Cliente: "Como funciona o lance?"
Carlos: "O lance permite antecipar sua contemplação. Você oferece um valor adicional e compete com outros participantes. Quanto maior o lance, maiores as chances. Posso simular um lance para você?"

Cliente: "Quando vou ser contemplado?"
Carlos: "A contemplação acontece por sorteio mensal ou lance. Em média, 20% do grupo é contemplado por ano. Posso verificar a posição do seu grupo e estimar prazos. Qual o número da sua cota?"`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agentType, conversationHistory } = await req.json();
    
    console.log('📨 Nova mensagem:', { agentType, message: message.substring(0, 100) });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = AGENT_PROMPTS[agentType as keyof typeof AGENT_PROMPTS] || AGENT_PROMPTS['clara-previdencia'];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ Resposta gerada:', aiResponse.substring(0, 100));

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Erro desconhecido',
        response: 'Desculpe, estou com dificuldades técnicas. Um atendente humano pode ajudar você agora?'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
