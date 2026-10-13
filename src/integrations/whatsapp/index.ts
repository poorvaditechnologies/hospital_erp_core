import { config } from "../../lib/config";
import { WhatsAppProvider } from "./provider.interface";
import { StubWhatsAppAdapter } from "./stub.adapter";

// TODO(phase3-real-bsp): once WHATSAPP_API_KEY is set, branch here to a real adapter
// (aisensy.adapter.ts / interakt.adapter.ts) implementing the same WhatsAppProvider interface.
export function getWhatsAppProvider(): WhatsAppProvider {
  if (!config.whatsappApiKey) {
    return new StubWhatsAppAdapter();
  }
  return new StubWhatsAppAdapter();
}
