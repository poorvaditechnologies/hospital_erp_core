export interface SendTemplateMessageInput {
  toPhone: string;
  templateName: string;
  bodyText: string;
  variables?: Record<string, string>;
}

export interface SendTemplateMessageResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface CreateTemplateInput {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  bodyText: string;
}

export interface CreateTemplateResult {
  providerTemplateId: string;
}

export interface WhatsAppProvider {
  sendTemplateMessage(input: SendTemplateMessageInput): Promise<SendTemplateMessageResult>;
  createTemplate(input: CreateTemplateInput): Promise<CreateTemplateResult>;
  getTemplateStatus(providerTemplateId: string): Promise<"PENDING" | "APPROVED" | "REJECTED">;
}
