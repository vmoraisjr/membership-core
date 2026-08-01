export const SHEEP_BRAND_NAME = "Sheep";
export const SHEEP_BRAND_SUBTITLE =
  "Sistema de Assinatura e Fidelidade";
export const SHEEP_BRAND_SIGNATURE = `${SHEEP_BRAND_NAME} ${SHEEP_BRAND_SUBTITLE}`;
export const SHEEP_SYMBOL_BLUE_PATH =
  "/brand/sheep/sheep-symbol-blue.png";
export const SHEEP_SYMBOL_DARK_PATH =
  "/brand/sheep/sheep-symbol-dark.png";
export const SHEEP_SYMBOL_WHITE_PATH =
  "/brand/sheep/sheep-symbol-white.png";
export const SHEEP_APP_ICON_LIGHT_PATH =
  "/brand/sheep/sheep-app-icon-light.png";
export const SHEEP_APP_ICON_DARK_PATH =
  "/brand/sheep/sheep-app-icon-dark.png";
export const SHEEP_LOCKUP_PATH =
  "/brand/sheep/sheep-lockup.png";
export const SHEEP_LOGO_PATH =
  SHEEP_LOCKUP_PATH;

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
