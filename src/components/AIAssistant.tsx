import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  onClose?: () => void;
  analysisContext?: {
    location: string;
    businessType: string;
    successScore?: number;
    competitorCount?: number;
    satelliteData?: any;
    ndviData?: any;
    businesses?: any[];
  };
}

const AIAssistant: React.FC<AIAssistantProps> = ({ analysisContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your location analysis assistant. I can help you understand the data and insights about your selected location. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call OpenAI API directly
  const fetchAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return 'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.';
      }

      // Build context string from analysis data
      const contextData = analysisContext ? `
LOCATION ANALYSIS DATA:
- Location: ${analysisContext.location}
- Business Type: ${analysisContext.businessType}
- Success Score: ${analysisContext.successScore}%
- Competitors Found: ${analysisContext.competitorCount}

SATELLITE & NDVI ANALYSIS:
${analysisContext.satelliteData ? `
- Land Use Change: ${analysisContext.satelliteData.statistics?.change_percentage}% detected
- Analysis Type: ${analysisContext.satelliteData.model_info?.model_used || 'change_detection'}
` : ''}
${analysisContext.ndviData ? `
- NDVI Total Change: ${analysisContext.ndviData.change_analysis?.total_change_percentage}%
- Vegetation Change: ${analysisContext.ndviData.change_analysis?.vegetation_change}%
- Urban Change: ${analysisContext.ndviData.change_analysis?.urban_change}%
- Change Intensity: ${analysisContext.ndviData.change_analysis?.change_intensity}
- Valid Pixels Analyzed: ${analysisContext.ndviData.change_analysis?.valid_pixels}
` : ''}

TOP COMPETITORS:
${analysisContext.businesses?.slice(0, 5).map(b => `- ${b.name} (${b.rating}★, ${b.distance}km away)`).join('\n') || 'No competitor data available'}
` : 'No analysis data available yet.';

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a confident, data-driven location analysis AI for Tapak. ALWAYS base your answers on the ACTUAL analysis data provided below. Be direct and specific - cite exact numbers, percentages, and findings from the data.

${contextData}

FORMATTING RULES (CRITICAL):
1. Start with a relevant emoji that matches the topic (🌿 for vegetation, 🏙️ for urban, 💰 for business, 🌡️ for air quality, etc.)
2. Use a clear title/header line with **bold**
3. Add TWO line breaks between main sections for proper spacing
4. Break into sections with emojis:
   - 📊 Key Findings:
   - ✅ Positive Factors:
   - ⚠️ Considerations:
   - 💡 Recommendation:
5. Use bullet points (•) for lists
6. Bold important numbers using **text**
7. Keep paragraphs short (2-3 sentences max)
8. End with a clear action-oriented conclusion

STANDARD RESPONSE FORMAT:
🌡️ **Air Quality Assessment**


📊 **Key Findings:**
• Vegetation change: **+24.1%** (improving)
• Urban contraction: **-20.4%**
• Valid pixels analyzed: **1,168,237**


✅ **Positive Factors:**
• Significant vegetation increase improves air filtration
• Urban development slowing down reduces emissions


⚠️ **Considerations:**
• Ongoing land use change (**5.8%**) from construction
• Competition density: **59 businesses** may increase traffic


💡 **Recommendation:**
Based on satellite data showing improving vegetation, air quality trends are positive for respiratory health. The **+24.1%** vegetation increase is a strong indicator.


COMPREHENSIVE SUMMARY FORMAT (when asked for full analysis/summary):
🌟 **Comprehensive Analysis Complete** for Lat: [coords], Lon: [coords]


📊 **Satellite Analysis:**
• Land Use Change: **5.8%** detected
• Areas Analyzed: **1** regions
• Analysis Type: change_detection


🌿 **NDVI Vegetation Analysis:**
• Total Change: **122.9%**
• Vegetation Change: **+24.1%**
• Urban Change: **-20.4%**
• Change Intensity: high
• Valid Pixels: **1,168,237**


🔍 **Key Insights:**
• **Multi-Modal Analysis:** Both satellite imagery and NDVI data confirm land use changes
• **Vegetation Health:** Improving vegetation patterns detected
• **Urban Development:** Contraction in urban areas


📈 **Data Visualization:**
• Map View: Interactive satellite imagery and change polygons
• Analytics Dashboard: Detailed statistics and trend analysis
• NDVI Dashboard: Area charts and bar charts showing vegetation patterns


*Switch between tabs to explore the different visualizations and insights.*

Be confident, use real data, cite exact numbers, and ALWAYS follow these visual formats.`,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || 'Failed to fetch response');
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'Sorry, I could not get a response from the AI.';
    } catch (err) {
      console.error('OpenAI API Error:', err);
      return `Error contacting AI service: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Call OpenAI API
    const aiText = await fetchAIResponse(text);
    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative p-4 space-y-6">
        <div className="pb-4 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-foreground">Tapak AI</h2>
          <p className="text-sm max-w-sm text-foreground-muted font-body">
            Ask questions about your location analysis results
          </p>
        </div>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in ${message.isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${message.isUser
                  ? 'bg-white text-primary border border-primary/20'
                  : 'bg-gradient-to-br from-primary to-secondary text-white'
                }`}
            >
              {message.isUser ? 'U' : 'AI'}
            </div>
            <div
              className={`flex-1 space-y-2 max-w-[85%] ${message.isUser ? 'flex justify-end' : ''}`}
            >
              <div
                className={`rounded-2xl p-4 shadow-sm break-words ${message.isUser
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-[#F5F5F4] text-[#1C1917] rounded-tl-sm'
                  }`}
              >
                <div
                  className={`text-sm leading-relaxed prose max-w-none ${message.isUser ? 'prose-invert' : 'prose-stone'
                    } [&>strong]:font-bold`}
                  dangerouslySetInnerHTML={{
                    __html: message.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^• (.+)$/gm, '<div style="margin-left: 1rem; margin-bottom: 0.25rem;">• $1</div>')
                      .replace(/\n\n/g, '<div style="margin-bottom: 1rem;"></div>')
                      .replace(/\n/g, '<br />')
                  }}
                />
                <p className={`text-[10px] mt-2 font-medium ${message.isUser ? 'text-white/80' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#F5F5F4] px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-border">
        <div className="flex items-end gap-3 bg-[#F5F5F4] p-2 rounded-3xl border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-md transition-all duration-300">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 resize-none max-h-32 min-h-[44px] w-full px-4 py-3 bg-transparent border-none text-foreground text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
            disabled={isTyping}
            rows={1}
            style={{ height: 'auto', overflowY: 'hidden' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="h-10 w-10 bg-primary text-white rounded-full hover:bg-primary-hover hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 mb-0.5 mr-0.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;