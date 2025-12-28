import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";
import { SAMPLE_RATE } from "../constants";

export class GeminiTTSService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateTTS(
    text: string, 
    voiceId: string, 
    languageCode: string,
    mode: 'PRESET' | 'CLONE', 
    personality?: string,
    referenceAudio?: { data: string; mimeType: string }
  ): Promise<AudioBuffer> {
    try {
      let response: GenerateContentResponse;
      const languageText = `Language: ${languageCode}.`;

      if (mode === 'CLONE' && referenceAudio) {
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-native-audio-preview-09-2025",
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: referenceAudio.data,
                    mimeType: referenceAudio.mimeType,
                  },
                },
                {
                  text: `Listen to the voice in this audio carefully. ${languageText} Now, speak the following text using the EXACT same voice, tone, accent, and style as the speaker in the audio. Just the speech. Text: "${text}"`,
                },
              ],
            },
          ],
          config: {
            responseModalities: [Modality.AUDIO],
          },
        });
      } else {
        const personalityInstruction = personality ? `${personality} ` : '';
        const prompt = `${personalityInstruction}${languageText} Say this precisely as written: ${text}`;
        
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceId },
              },
            },
          },
        });
      }

      const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("No audio data received. Check if your text is valid for the selected language.");
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });

      const bytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, audioContext, SAMPLE_RATE, 1);
      
      return audioBuffer;
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      throw error;
    }
  }
}