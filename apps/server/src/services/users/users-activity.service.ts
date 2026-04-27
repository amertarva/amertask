import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import { resolveCandidateUserIds } from "../../lib/userIdentity";

export async function getUserActivity(
  userId: string,
  days: number = 365,
  email?: string,
) {
  const candidateUserIds = await resolveCandidateUserIds(userId, email);

  console.log("📊 Getting user activity:", {
    userId,
    email,
    days,
    candidateUserIds,
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // @ts-ignore - Supabase type inference issue
  const { data: issues, error } = await supabase
    .from("issues")
    .select("created_at")
    .in("created_by_id", candidateUserIds)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error fetching activity:", error);
    throw errors.internal("Gagal mengambil aktivitas");
  }

  // Group by date
  const activityMap = new Map<string, number>();
  // @ts-ignore - Supabase type inference issue
  issues?.forEach((issue) => {
    // @ts-ignore - Supabase type inference issue
    const date = new Date(issue.created_at).toISOString().split("T")[0];
    activityMap.set(date, (activityMap.get(date) || 0) + 1);
  });

  // Convert to array
  const activities = Array.from(activityMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Calculate stats
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  // @ts-ignore - Supabase type inference issue
  const totalLast30Days =
    // @ts-ignore - Supabase type inference issue
    issues?.filter((i) => new Date(i.created_at) >= last30Days).length || 0;

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();

  while (currentStreak < 365) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (activityMap.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === today) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const dailyAverage = totalLast30Days / 30;

  console.log("Activity calculated:", {
    totalActivities: activities.length,
    totalLast30Days,
    currentStreak,
    dailyAverage: dailyAverage.toFixed(1),
  });

  return {
    activities,
    stats: {
      totalLast30Days,
      currentStreak,
      dailyAverage: parseFloat(dailyAverage.toFixed(1)),
    },
  };
}
