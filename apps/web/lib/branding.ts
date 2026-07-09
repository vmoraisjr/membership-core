export const SHEEP_BRAND_NAME = "Sheep";
export const SHEEP_BRAND_SUBTITLE =
  "Sistema de Assinatura e Fidelidade";
export const SHEEP_BRAND_SIGNATURE = `${SHEEP_BRAND_NAME} ${SHEEP_BRAND_SUBTITLE}`;
export const SHEEP_LOGO_PATH =
  "/sheep-logo.svg";

export type WorkspaceBrand = {
  workspaceLabel: string;
  displayName: string;
  subtitle: string;
  logoUrl: string;
  isPlatform: boolean;
};

export function getClinicDisplayName(input: {
  name: string;
  brandName?: string | null;
}) {
  return input.brandName?.trim() || input.name;
}

export function getPlatformWorkspaceBrand(): WorkspaceBrand {
  return {
    workspaceLabel: "Plataforma Sheep",
    displayName: SHEEP_BRAND_NAME,
    subtitle: SHEEP_BRAND_SUBTITLE,
    logoUrl: SHEEP_LOGO_PATH,
    isPlatform: true,
  };
}

export function getClinicWorkspaceBrand(input: {
  name: string;
  brandName?: string | null;
  logoUrl?: string | null;
}): WorkspaceBrand {
  return {
    workspaceLabel: "Área da empresa",
    displayName: getClinicDisplayName(input),
    subtitle: "Operação local de assinaturas e fidelidade",
    logoUrl:
      input.logoUrl?.trim() ||
      SHEEP_LOGO_PATH,
    isPlatform: false,
  };
}
