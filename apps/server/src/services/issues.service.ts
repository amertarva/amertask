import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";
import type { IssueFilters } from "../types";

function toIssueDbPayload(payload: any) {
  const mappedPayload = {
    title: payload?.title,
    description: payload?.description,
    status: payload?.status,
    priority: payload?.priority,
    labels: payload?.labels,
    assignee_id: payload?.assigneeId ?? payload?.assignee_id,
    parent_issue_id: payload?.parentIssueId ?? payload?.parent_issue_id,
    source: payload?.source,
    is_triaged: payload?.isTriaged ?? payload?.is_triaged,
    reason: payload?.reason,
    triage_reason: payload?.triageReason ?? payload?.triage_reason,
    plan_info: payload?.planInfo ?? payload?.plan_info,
  };

  return Object.fromEntries(
    Object.entries(mappedPayload).filter(([, value]) => value !== undefined),
  );
}

function isMissingTriageReasonColumn(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  const details = String(error?.details ?? "").toLowerCase();
  const hint = String(error?.hint ?? "").toLowerCase();

  const mentionsColumn = [message, details, hint].some((entry) =>
    entry.includes("triage_reason"),
  );

  if (!mentionsColumn) return false;

  return [message, details, hint].some(
    (entry) =>
      (entry.includes("column") && entry.includes("does not exist")) ||
      (entry.includes("column") && entry.includes("could not find")) ||
      (entry.includes("schema cache") && entry.includes("could not find")),
  );
}

function isUnsupportedBugStatusError(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  const details = String(error?.details ?? "").toLowerCase();
  const hint = String(error?.hint ?? "").toLowerCase();

  const combined = `${message} ${details} ${hint}`;

  const isEnumError =
    combined.includes("invalid input value") && combined.includes("enum");
  const isCheckConstraintError =
    combined.includes("violates check constraint") ||
    (combined.includes("check constraint") && combined.includes("status"));

  return (isEnumError || isCheckConstraintError) && combined.includes("bug");
}

function buildLegacyReasonFallbackPayload(payload: Record<string, any>) {
  if (payload.triage_reason === undefined) {
    return payload;
  }

  const fallbackPayload = { ...payload };

  if (
    fallbackPayload.reason === undefined ||
    fallbackPayload.reason === null ||
    fallbackPayload.reason === ""
  ) {
    fallbackPayload.reason = fallbackPayload.triage_reason;
  }

  delete fallbackPayload.triage_reason;
  return fallbackPayload;
}

export const issuesService = {
  async list(teamIdentifier: string, filters: IssueFilters) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let teamId = teamIdentifier;
    if (!isUuid.test(teamIdentifier)) {
      // @ts-ignore - Supabase type inference issue
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .ilike("slug", teamIdentifier)
        .maybeSingle<{ id: string }>();

      if (teamError) {
        console.error("Error resolving team by slug:", {
          teamSlug: teamIdentifier,
          error: teamError,
        });
        throw errors.internal(`Gagal mencari tim: ${teamError.message}`);
      }

      if (!team?.id) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(filters.limit || 20, 100);
        return {
          issues: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      teamId = team.id;
    }

    let query = supabase
      .from("issues")
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
        created_by:users!issues_created_by_id_fkey(id, name, avatar, initials)
      `,
        { count: "exact" },
      )
      .eq("team_id", teamId)
      .eq("is_triaged", true);

    // Filters
    if (filters.status) {
      const statuses = filters.status
        .split(",")
        .map((status) => status.trim())
        .filter(Boolean);

      if (statuses.length > 0) {
        query = query.in("status", statuses);
      }
    }
    if (filters.priority) {
      const priorities = filters.priority
        .split(",")
        .map((priority) => priority.trim())
        .filter(Boolean);

      if (priorities.length > 0) {
        query = query.in("priority", priorities);
      }
    }
    if (filters.assigneeId) {
      query = query.eq("assignee_id", filters.assigneeId);
    }
    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters.labels) {
      const labelArray = filters.labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);

      if (labelArray.length > 0) {
        query = query.contains("labels", labelArray);
      }
    }

    // Sorting
    const sortBy = filters.sortBy || "created_at";
    const sortDir = filters.sortDir === "asc";
    query = query.order(sortBy, { ascending: sortDir });

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching issues list:", {
        teamIdentifier,
        teamId,
        error,
      });
      throw errors.internal(`Gagal mengambil daftar issues: ${error.message}`);
    }

    return {
      issues: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("issues")
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(*),
        created_by:users!issues_created_by_id_fkey(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw errors.notFound("Issue tidak ditemukan");
    }

    return data;
  },

  async create(teamId: string, userId: string, payload: any) {
    // Get next issue number for team
    const { data: lastIssue } = (await supabase
      .from("issues")
      .select("number")
      .eq("team_id", teamId)
      .order("number", { ascending: false })
      .limit(1)
      .single()) as any;

    const nextNumber = (lastIssue?.number || 0) + 1;

    const dbPayload = toIssueDbPayload(payload) as Record<string, any>;

    const insertPayload = {
      ...dbPayload,
      team_id: teamId,
      created_by_id: userId,
      number: nextNumber,
    };

    let { data, error } = (await supabase
      .from("issues")
      // @ts-ignore - Supabase type inference issue
      .insert(insertPayload)
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(*),
        created_by:users!issues_created_by_id_fkey(*)
      `,
      )
      .single()) as any;

    if (error && isMissingTriageReasonColumn(error)) {
      console.warn(
        "[issuesService.create] Kolom triage_reason belum tersedia, fallback ke reason",
      );

      const fallbackInsertPayload =
        buildLegacyReasonFallbackPayload(insertPayload);

      ({ data, error } = (await supabase
        .from("issues")
        // @ts-ignore - Supabase type inference issue
        .insert(fallbackInsertPayload)
        .select(
          `
          *,
          assignee:users!issues_assignee_id_fkey(*),
          created_by:users!issues_created_by_id_fkey(*)
        `,
        )
        .single()) as any);
    }

    if (
      error &&
      dbPayload.status === "bug" &&
      isUnsupportedBugStatusError(error)
    ) {
      console.warn(
        "[issuesService.create] Status bug belum didukung DB, fallback update tanpa ubah status",
      );

      const fallbackInsertPayload = buildLegacyReasonFallbackPayload({
        ...insertPayload,
        is_triaged: false,
      });

      delete (fallbackInsertPayload as Record<string, any>).status;

      ({ data, error } = (await supabase
        .from("issues")
        // @ts-ignore - Supabase type inference issue
        .insert(fallbackInsertPayload)
        .select(
          `
          *,
          assignee:users!issues_assignee_id_fkey(*),
          created_by:users!issues_created_by_id_fkey(*)
        `,
        )
        .single()) as any);
    }

    if (error) {
      console.error("[issuesService.create] query error:", {
        teamId,
        userId,
        payload,
        error,
      });
      throw errors.internal(`Gagal membuat issue: ${error.message}`);
    }

    return data;
  },

  async update(id: string, payload: any) {
    const dbPayload = toIssueDbPayload(payload) as Record<string, any>;

    if (dbPayload.status === "bug" && dbPayload.is_triaged === undefined) {
      dbPayload.is_triaged = false;
    }

    const updatePayload = {
      ...dbPayload,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = (await supabase
      .from("issues")
      // @ts-ignore - Supabase type inference issue
      .update(updatePayload)
      .eq("id", id)
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(*),
        created_by:users!issues_created_by_id_fkey(*)
      `,
      )
      .single()) as any;

    if (error && isMissingTriageReasonColumn(error)) {
      console.warn(
        "[issuesService.update] Kolom triage_reason belum tersedia, fallback ke reason",
      );

      const fallbackUpdatePayload =
        buildLegacyReasonFallbackPayload(updatePayload);

      ({ data, error } = (await supabase
        .from("issues")
        // @ts-ignore - Supabase type inference issue
        .update(fallbackUpdatePayload)
        .eq("id", id)
        .select(
          `
          *,
          assignee:users!issues_assignee_id_fkey(*),
          created_by:users!issues_created_by_id_fkey(*)
        `,
        )
        .single()) as any);
    }

    if (
      error &&
      dbPayload.status === "bug" &&
      isUnsupportedBugStatusError(error)
    ) {
      console.warn(
        "[issuesService.update] Status bug belum didukung DB, fallback update tanpa ubah status",
      );

      const fallbackUpdatePayload = buildLegacyReasonFallbackPayload({
        ...updatePayload,
        is_triaged: false,
      });

      delete (fallbackUpdatePayload as Record<string, any>).status;

      ({ data, error } = (await supabase
        .from("issues")
        // @ts-ignore - Supabase type inference issue
        .update(fallbackUpdatePayload)
        .eq("id", id)
        .select(
          `
          *,
          assignee:users!issues_assignee_id_fkey(*),
          created_by:users!issues_created_by_id_fkey(*)
        `,
        )
        .single()) as any);
    }

    if (error) {
      console.error("[issuesService.update] query error:", {
        issueId: id,
        payload,
        error,
      });
      throw errors.internal(`Gagal update issue: ${error.message}`);
    }

    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("issues").delete().eq("id", id);

    if (error) {
      throw errors.internal("Gagal menghapus issue");
    }
  },
};
