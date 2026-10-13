import { randomUUID } from "crypto";
import {
  CreateTemplateInput,
  CreateTemplateResult,
  SendTemplateMessageInput,
  SendTemplateMessageResult,
  WhatsAppProvider,
} from "./provider.interface";

// Stub adapter: no WHATSAPP_API_KEY configured yet. Simulates BSP behavior so the
// rest of the app (templates, send, message log, audit) can be built and tested end
// to end. Swap in a real adapter (aisensy.adapter.ts / interakt.adapter.ts) behind
// this same interface once BSP credentials are available — no other code changes.
export class StubWhatsAppAdapter implements WhatsAppProvider {
  async sendTemplateMessage(input: SendTemplateMessageInput): Promise<SendTemplateMessageResult> {
    console.log(`[whatsapp:stub] send "${input.templateName}" to ${input.toPhone}`);
    return { success: true, providerMessageId: randomUUID() };
  }

  async createTemplate(input: CreateTemplateInput): Promise<CreateTemplateResult> {
    console.log(`[whatsapp:stub] submit template "${input.name}" (${input.category}) for approval`);
    return { providerTemplateId: randomUUID() };
  }

  async getTemplateStatus(): Promise<"PENDING" | "APPROVED" | "REJECTED"> {
    return "APPROVED";
  }
}
