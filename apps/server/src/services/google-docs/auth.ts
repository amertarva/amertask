interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

function readServiceAccountConfig(): ServiceAccountConfig | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
        project_id?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
          projectId: parsed.project_id,
        };
      }
    } catch {
      console.error(
        "[google-docs] GOOGLE_SERVICE_ACCOUNT_JSON tidak valid. Pastikan format JSON benar.",
      );
      return null;
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    clientEmail,
    privateKey,
    projectId,
  };
}

export async function getGoogleAuth() {
  const serviceAccount = readServiceAccountConfig();
  if (!serviceAccount) {
    throw new Error(
      "Credential Google Docs belum lengkap. Isi GOOGLE_SERVICE_ACCOUNT_JSON atau GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY di environment variables.",
    );
  }

  const { GoogleAuth } = await import("google-auth-library");

  return new GoogleAuth({
    credentials: {
      client_email: serviceAccount.clientEmail,
      private_key: serviceAccount.privateKey,
      project_id: serviceAccount.projectId,
    },
    scopes: ["https://www.googleapis.com/auth/documents"],
  });
}
