import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { errors, type AppError } from "../lib/errors";
import { resolveCandidateUserIds } from "../lib/userIdentity";
import { supabase } from "../lib/supabase";

type ExportType = "planning" | "backlog" | "execution";
type GoogleDocsServiceModule = typeof import("../services/google-docs.service");

let googleDocsServiceModulePromise: Promise<GoogleDocsServiceModule> | null =
  null;

async function getGoogleDocsService() {
  if (!googleDocsServiceModulePromise) {
    googleDocsServiceModulePromise = import("../services/google-docs.service");
  }

  const module = await googleDocsServiceModulePromise;
  return module.googleDocsService;
}

type TeamRole = "owner" | "pm" | "admin" | "member";

interface AuthUser {
  sub: string;
  email?: string;
}

interface TeamExportContext {
  id: string;
  slug: string;
  name: string;
  googleDocsUrl: string | null;
  role: TeamRole;
}

interface RawIssueUser {
  id: string;
  name: string;
  initials?: string | null;
}

type RawIssueUserRelation = RawIssueUser | RawIssueUser[] | null;

interface RawIssueRow {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  reason: string | null;
  plan_info: string | null;
  updated_at: string | null;
  created_at: string | null;
  assignee: RawIssueUserRelation;
  created_by: RawIssueUserRelation;
}

function pickRelatedUser(value: RawIssueUserRelation): RawIssueUser | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan server";
}

function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "number" && Number.isFinite(code)) {
    return code;
  }

  if (typeof code === "string") {
    const parsed = Number(code);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const responseStatus = (error as { response?: { status?: unknown } }).response
    ?.status;

  if (typeof responseStatus === "number" && Number.isFinite(responseStatus)) {
    return responseStatus;
  }

  return null;
}

function isAppError(error: unknown): error is AppError {
  return (
    !!error &&
    typeof error === "object" &&
    "statusCode" in error &&
    "code" in error &&
    "message" in error
  );
}

async function verifyAuth(headers: Record<string, string | undefined>) {
  const authHeader = headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw errors.unauthorized("Token tidak ditemukan");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw errors.unauthorized("Format token tidak valid");
  }

  const payload = await verifyJWT(token);
  return {
    sub: String(payload.sub || ""),
    email: payload.email,
  } satisfies AuthUser;
}

function resolveHighestRole(roles: string[]): TeamRole {
  const priority: Record<TeamRole, number> = {
    owner: 4,
    pm: 3,
    admin: 2,
    member: 1,
  };

  const normalizedRoles = roles
    .map((role) => String(role || "member").toLowerCase())
    .filter((role): role is TeamRole =>
      ["owner", "pm", "admin", "member"].includes(role),
    );

  if (normalizedRoles.length === 0) return "member";

  return normalizedRoles.sort((a, b) => priority[b] - priority[a])[0];
}

async function resolveTeamExportContext(
  teamSlug: string,
  currentUser: AuthUser,
): Promise<TeamExportContext> {
  const candidateUserIds = await resolveCandidateUserIds(
    currentUser.sub,
    currentUser.email,
  );

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, slug, name, owner_id, google_docs_url")
    .ilike("slug", teamSlug)
    .maybeSingle<{
      id: string;
      slug: string;
      name: string;
      owner_id: string;
      google_docs_url: string | null;
    }>();

  if (teamError) {
    throw errors.internal(`Gagal memeriksa tim: ${teamError.message}`);
  }

  if (!team) {
    throw errors.notFound("Tim tidak ditemukan");
  }

  if (candidateUserIds.includes(team.owner_id)) {
    return {
      id: team.id,
      slug: team.slug,
      name: team.name,
      googleDocsUrl: team.google_docs_url,
      role: "owner" as const,
    };
  }

  const { data: memberships, error: memberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team.id)
    .in("user_id", candidateUserIds);

  if (memberError) {
    throw errors.internal(
      `Gagal memeriksa akses anggota tim: ${memberError.message}`,
    );
  }

  if (!memberships || memberships.length === 0) {
    throw errors.forbidden("Anda tidak memiliki akses ke tim ini");
  }

  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    googleDocsUrl: team.google_docs_url,
    role: resolveHighestRole(
      memberships.map((membership) => String((membership as any).role || "")),
    ),
  };
}

function toPlanningItems(teamSlug: string, issues: RawIssueRow[]) {
  return issues
    .filter((issue) => issue.status === "backlog")
    .map((issue) => {
      const assignee = pickRelatedUser(issue.assignee);
      const createdBy = pickRelatedUser(issue.created_by);

      return {
        id: issue.id,
        number: issue.number,
        teamSlug,
        title: issue.title,
        description: issue.description ?? undefined,
        planInfo: issue.plan_info ?? undefined,
        assignedUser: assignee?.name ?? undefined,
        status: issue.status,
        priority: issue.priority,
        createdBy: createdBy?.name ?? undefined,
      };
    });
}

function toBacklogItems(teamSlug: string, issues: RawIssueRow[]) {
  return issues
    .filter((issue) => issue.status === "backlog")
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      teamSlug,
      title: issue.title,
      description: issue.description ?? undefined,
      targetUser: issue.plan_info ?? undefined,
      priority: issue.priority,
      reason: issue.reason ?? undefined,
    }));
}

function toExecutionItems(teamSlug: string, issues: RawIssueRow[]) {
  const allowedStatuses = new Set([
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
    "cancelled",
  ]);

  return issues
    .filter((issue) => allowedStatuses.has(issue.status))
    .map((issue) => {
      const assignee = pickRelatedUser(issue.assignee);

      return {
        id: issue.id,
        number: issue.number,
        teamSlug,
        title: issue.title,
        assignedUser: assignee?.name ?? undefined,
        status: issue.status,
        notes: issue.description ?? undefined,
        updatedAt:
          issue.updated_at || issue.created_at || new Date().toISOString(),
      };
    });
}

function mapExportTypeToMessage(type: ExportType) {
  if (type === "planning") return "Planning";
  if (type === "backlog") return "Backlog";
  return "Execution";
}

export const exportRoutes = new Elysia({
  prefix: "/teams/:teamSlug/export",
}).post(
  "/docs",
  async ({ params, body, headers, set }) => {
    const { teamSlug } = params;
    const { type } = body;

    try {
      const currentUser = await verifyAuth(headers as Record<string, string>);
      const team = await resolveTeamExportContext(teamSlug, currentUser);
      const googleDocsService = await getGoogleDocsService();

      if (!team.googleDocsUrl) {
        set.status = 422;
        return {
          error: "DOCS_NOT_CONFIGURED",
          message:
            "Google Docs URL belum dikonfigurasi. Buka Settings proyek lalu isi Google Docs URL.",
        };
      }

      const documentId = googleDocsService.extractDocumentId(
        team.googleDocsUrl,
      );

      if (!documentId) {
        set.status = 422;
        return {
          error: "INVALID_DOCS_URL",
          message:
            "URL Google Docs tidak valid. Gunakan format https://docs.google.com/document/d/{ID}/edit.",
        };
      }

      const { data: issues, error: issuesError } = await supabase
        .from("issues")
        .select(
          `
          id,
          number,
          title,
          description,
          status,
          priority,
          reason,
          plan_info,
          updated_at,
          created_at,
          assignee:users!issues_assignee_id_fkey(id, name, initials),
          created_by:users!issues_created_by_id_fkey(id, name)
          `,
        )
        .eq("team_id", team.id)
        .eq("is_triaged", true)
        .order("number", { ascending: true });

      if (issuesError) {
        throw errors.internal(
          `Gagal mengambil data issue untuk export: ${issuesError.message}`,
        );
      }

      const issueList = (issues ?? []) as RawIssueRow[];
      let exportedCount = 0;

      if (type === "planning") {
        const planningItems = toPlanningItems(team.slug, issueList);
        exportedCount = planningItems.length;
        await googleDocsService.exportPlanning(
          documentId,
          planningItems,
          team.name,
        );
      }

      if (type === "backlog") {
        const backlogItems = toBacklogItems(team.slug, issueList);
        exportedCount = backlogItems.length;
        await googleDocsService.exportBacklog(
          documentId,
          backlogItems,
          team.name,
        );
      }

      if (type === "execution") {
        const executionItems = toExecutionItems(team.slug, issueList);
        exportedCount = executionItems.length;
        await googleDocsService.exportExecution(
          documentId,
          executionItems,
          team.name,
        );
      }

      return {
        success: true,
        message: `${mapExportTypeToMessage(type)} berhasil disalin ke Google Docs`,
        documentUrl: team.googleDocsUrl,
        exportedAt: new Date().toISOString(),
        totalItems: exportedCount,
      };
    } catch (error) {
      if (isAppError(error)) {
        set.status = error.statusCode;
        return {
          error: error.code,
          message: error.message,
        };
      }

      const statusCode = getErrorStatusCode(error);
      const message = getErrorMessage(error);

      console.error(
        `[export] POST /teams/${teamSlug}/export/docs (${type}) error:`,
        error,
      );

      if (
        statusCode === 403 ||
        /permission|insufficient|forbidden/i.test(message)
      ) {
        set.status = 403;
        return {
          error: "DOCS_PERMISSION_DENIED",
          message:
            "Tidak bisa menulis ke Google Docs. Pastikan dokumen sudah di-share ke email service account dengan akses Editor.",
        };
      }

      if (statusCode === 404 || /not found/i.test(message)) {
        set.status = 404;
        return {
          error: "DOCS_NOT_FOUND",
          message:
            "Dokumen Google Docs tidak ditemukan. Cek kembali URL dokumen.",
        };
      }

      set.status = 500;
      return {
        error: "EXPORT_FAILED",
        message,
      };
    }
  },
  {
    body: t.Object({
      type: t.Union([
        t.Literal("planning"),
        t.Literal("backlog"),
        t.Literal("execution"),
      ]),
    }),
  },
);
