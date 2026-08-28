import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminAllowedEmails, staffProfiles } from "@/lib/db/schema";
import { SUPER_ADMIN_EMAIL } from "@/lib/auth/simple-auth";
import { logger } from "@/lib/logger";

/**
 * Single source of truth for "does this user get staff access, right now" —
 * used by both /api/admin/auth/check (the dedicated /admin/login Google
 * flow) and /api/admin/auth/elevate (the silent re-check after ANY login,
 * including the plain customer "Sign in with Google" button on /account).
 *
 * Before this existed, elevate only looked for an *already-existing*
 * staff_profiles row — a whitelisted email that had never specifically gone
 * through /admin/login once would never be recognized as staff, even
 * though they were on the whitelist the whole time. Checking the whitelist
 * here too means ANY successful login for a whitelisted email grants
 * access, matching what an admin actually expects.
 */
export async function resolveStaffAccess(
  user: { id: string; email: string },
): Promise<{ granted: boolean; role?: "admin" | "staff" }> {
  const email = user.email.toLowerCase().trim();

  const [allowed] = await db
    .select({ id: adminAllowedEmails.id })
    .from(adminAllowedEmails)
    .where(eq(adminAllowedEmails.email, email))
    .limit(1);

  if (!allowed) {
    return { granted: false };
  }

  const [existingStaff] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  if (existingStaff) {
    // Being in the whitelist re-grants access after removal, but does NOT
    // override an explicit `isActive: false` set by an admin — a
    // deactivated staff member stays deactivated until reactivated
    // deliberately, even if they're still whitelisted.
    if (!existingStaff.isActive) {
      logger.warn("Staff access denied: account is deactivated", { email });
      return { granted: false };
    }
    await db
      .update(staffProfiles)
      .set({ lastLoginAt: new Date() })
      .where(eq(staffProfiles.id, existingStaff.id));
    return { granted: true, role: existingStaff.role as "admin" | "staff" };
  }

  const role = email === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : "staff";
  await db.insert(staffProfiles).values({
    userId: user.id,
    email,
    role,
    isActive: true,
    lastLoginAt: new Date(),
  });
  logger.info("Staff profile auto-provisioned from whitelist", { email, role });
  return { granted: true, role };
}
