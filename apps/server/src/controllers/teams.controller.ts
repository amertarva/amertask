import { teamsService } from "../services/teams.service";
import { errors } from "../lib/errors";

export const teamsController = {
  async list({ currentUser }: any) {
    console.log("GET /teams - currentUser:", currentUser);

    if (!currentUser || !currentUser.sub) {
      throw new Error("currentUser not found in context");
    }

    const teams = await teamsService.getUserTeams(
      currentUser.sub,
      currentUser.email,
    );
    return teams; // Return array directly, not wrapped in object
  },

  async create({ currentUser, body }: any) {
    const team = await teamsService.createTeam(currentUser.sub, body);
    return team;
  },

  async getBySlug({ params }: any) {
    const team = await teamsService.getTeamBySlug(params.teamSlug);
    const stats = await teamsService.getTeamStats(team.id);

    return {
      ...team,
      stats,
    };
  },

  async getMembers({ teamId }: any) {
    const members = await teamsService.getTeamMembers(teamId);
    return { members };
  },

  async getMemberDetail({ teamId, params }: any) {
    const member = await teamsService.getTeamMemberDetail(
      teamId,
      params.memberId,
    );

    return { member };
  },

  async removeMember({ teamId, userRole, currentUser, params }: any) {
    if (!currentUser?.sub) {
      throw errors.unauthorized("User tidak valid untuk mengeluarkan anggota");
    }

    if (!["owner", "admin", "pm"].includes(userRole)) {
      throw errors.forbidden(
        "Hanya owner/admin/pm yang dapat mengeluarkan anggota",
      );
    }

    const result = await teamsService.removeTeamMember({
      teamId,
      requesterRole: userRole,
      requesterUserId: currentUser.sub,
      requesterEmail: currentUser.email,
      memberUserId: params.memberId,
    });

    return {
      success: true,
      message: "Anggota berhasil dikeluarkan",
      ...result,
    };
  },

  async leaveTeam({ teamId, userRole, currentUser }: any) {
    if (!currentUser?.sub) {
      throw errors.unauthorized("User tidak valid untuk keluar tim");
    }

    const result = await teamsService.leaveTeam({
      teamId,
      userRole,
      userId: currentUser.sub,
      email: currentUser.email,
    });

    return {
      success: true,
      message: "Berhasil keluar dari tim",
      ...result,
    };
  },

  async createInvite({ teamId, userRole, currentUser, body }: any) {
    if (!currentUser?.sub || !currentUser?.email) {
      throw errors.unauthorized("User tidak valid untuk membuat undangan");
    }

    if (!["owner", "admin", "pm"].includes(userRole)) {
      throw errors.forbidden(
        "Hanya owner/admin/pm yang dapat mengundang anggota",
      );
    }

    return await teamsService.createTeamInviteLink({
      teamId,
      inviterId: currentUser.sub,
      inviterEmail: currentUser.email,
      inviterName: currentUser.name,
      role: body?.role,
      expiresInHours: body?.expiresInHours,
    });
  },

  async previewInvite({ currentUser, body }: any) {
    return await teamsService.previewTeamInvite(
      body.token,
      currentUser.sub,
      currentUser.email,
    );
  },

  async acceptInvite({ currentUser, body }: any) {
    return await teamsService.acceptTeamInvite(
      body.token,
      currentUser.sub,
      currentUser.email,
    );
  },

  async rejectInvite({ body }: any) {
    return await teamsService.rejectTeamInvite(body.token);
  },

  async getSettings({ teamId }: any) {
    // Get by ID directly
    const { data, error } = await (await import("../lib/supabase")).supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle<{
        id: string;
        name: string;
        slug: string;
        type: string;
        start_date: string | null;
        end_date: string | null;
        owner_id: string;
        company: string | null;
        work_area: string | null;
        description: string | null;
        github_repo: string | null;
        google_docs_url: string | null;
        created_at: string;
        updated_at: string;
      }>();

    if (error || !data) {
      throw errors.notFound("Tim tidak ditemukan");
    }

    return {
      id: data.id,
      teamId: data.id,
      name: data.name,
      slug: data.slug,
      type: data.type,
      startDate: data.start_date,
      endDate: data.end_date,
      projectManagerId: data.owner_id,
      company: data.company,
      workArea: data.work_area,
      description: data.description,
      integrations: {
        githubRepo: data.github_repo,
        googleDocsUrl: data.google_docs_url,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateSettings({ teamId, userRole, body }: any) {
    // Only owner/admin/pm can update
    if (!["owner", "admin", "pm"].includes(userRole)) {
      throw errors.forbidden(
        "Hanya owner/admin/pm yang dapat mengubah pengaturan",
      );
    }

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.slug) updates.slug = body.slug.toUpperCase();
    if (body.type) updates.type = body.type;
    if (body.startDate !== undefined) updates.start_date = body.startDate;
    if (body.endDate !== undefined) updates.end_date = body.endDate;
    if (body.projectManagerId !== undefined)
      updates.owner_id = body.projectManagerId;
    if (body.company !== undefined) updates.company = body.company;
    if (body.workArea !== undefined) updates.work_area = body.workArea;
    if (body.description !== undefined) updates.description = body.description;
    if (body.integrations?.githubRepo !== undefined)
      updates.github_repo = body.integrations.githubRepo;
    if (body.integrations?.googleDocsUrl !== undefined)
      updates.google_docs_url = body.integrations.googleDocsUrl;

    const team = await teamsService.updateTeamSettings(teamId, updates);

    return {
      id: team.id,
      teamId: team.id,
      name: team.name,
      slug: team.slug,
      type: team.type,
      startDate: team.start_date,
      endDate: team.end_date,
      projectManagerId: team.owner_id,
      company: team.company,
      workArea: team.work_area,
      description: team.description,
      integrations: {
        githubRepo: team.github_repo,
        googleDocsUrl: team.google_docs_url,
      },
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    };
  },

  async remove({ teamId, userRole }: any) {
    // Hanya owner yang boleh menghapus proyek karena sifatnya permanen.
    if (userRole !== "owner") {
      throw errors.forbidden("Hanya owner yang dapat menghapus proyek");
    }

    const deletedProject = await teamsService.deleteTeam(teamId);

    return {
      success: true,
      message: "Proyek berhasil dihapus",
      project: deletedProject,
    };
  },
};
