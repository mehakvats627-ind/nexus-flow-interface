export type ServiceId = "translation" | "code" | "image";

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  price: number;
  provider: string;
  description: string;
}

export const SERVICES: ServiceDefinition[] = [
  {
    id: "translation",
    name: "Translation",
    price: 1,
    provider: "TranslatePro",
    description: "Translate any text between 40+ languages with context awareness.",
  },
  {
    id: "code",
    name: "Code Generation",
    price: 2,
    provider: "CodeForge AI",
    description: "Generate production-ready code snippets from a plain prompt.",
  },
  {
    id: "image",
    name: "Image Generation",
    price: 2,
    provider: "PixelMind",
    description: "Create original artwork and visuals from a text description.",
  },
];

export function getServices(): ServiceDefinition[] {
  return SERVICES;
}

export function getService(id: ServiceId): ServiceDefinition {
  const svc = SERVICES.find((s) => s.id === id);
  if (!svc) throw new Error(`Service not found: ${id}`);
  return svc;
}

export function generateServiceOutput(id: ServiceId, requestId: string): string {
  switch (id) {
    case "translation":
      return `« Bonjour, le paiement autonome ${requestId} est validé sur Sepolia. »`;
    case "code":
      return `// Settle verified for ${requestId}\nexport const enforceBudget = (spent, cap) => spent <= cap;`;
    case "image":
      return `image://nexus/renders/holographic-cube-${requestId}.png`;
    default:
      return `deliverable-${requestId}`;
  }
}
