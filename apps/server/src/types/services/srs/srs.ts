export interface SrsDocument {
  id: string;
  teamId: string;
  version: string;
  purpose: string | null;
  scope: string | null;
  glossary: Array<{ term: string; definition: string }>;
  productPerspective: string | null;
  productFunctions: string | null;
  userCharacteristics: Array<{ role: string; description: string }>;
  generalConstraints: string | null;
  uiRequirements: string | null;
  hardwareInterface: string | null;
  softwareInterface: string | null;
  commInterface: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  googleDocsUrl: string | null;
}
