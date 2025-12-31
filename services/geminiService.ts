
import { GoogleGenAI, Type } from "@google/genai";
import { NetError, NetErrorKind } from "../kernel/network/gate";

/**
 * verifyCompliance - Procedura provjere integriteta artefakta.
 * Koristi determinističku mrežnu logiku.
 */
export async function verifyCompliance(opsContent: string, simCode: string): Promise<any> {
  if (!process.env.API_KEY) {
    throw new NetError(NetErrorKind.NETWORK_4XX, "SECURITY_BREACH: API_KEY_MISSING", 401);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit Order:
      Spec: ${opsContent}
      Logic: ${simCode}
      Determine if compliant. Return JSON: {compliant: boolean, verdict: string, discrepancies: string[]}`,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compliant: { type: Type.BOOLEAN },
            verdict: { type: Type.STRING },
            discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['compliant', 'verdict', 'discrepancies']
        }
      }
    });

    if (!response.text) {
      throw new NetError(NetErrorKind.NETWORK_MALFORMED_RESPONSE, "AI_RESPONSE_EMPTY");
    }
    
    return JSON.parse(response.text);
  } catch (error: any) {
    if (error instanceof NetError) throw error;

    const status = error?.status || error?.statusCode;
    const isTimeout = error?.message?.includes('timeout') || error?.name === 'AbortError';
    
    const kind = isTimeout ? NetErrorKind.NETWORK_TIMEOUT : 
                (status >= 500 ? NetErrorKind.NETWORK_5XX : NetErrorKind.NETWORK_4XX);

    throw new NetError(kind, error.message || "AI_GATEWAY_FAILURE", status);
  }
}
