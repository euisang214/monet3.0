import { prisma } from "../../../../lib/db";

export async function getProfessionalSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      flags: true,
      corporateEmailVerified: true,
      professionalProfile: { select: { verifiedAt: true } },
    },
  });
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const flags = (user.flags as any) || {};
  const timezone = flags.timezone || "";
  const verified =
    user.corporateEmailVerified || !!user.professionalProfile?.verifiedAt;

  return {
    email: user.email,
    fullName,
    timezone,
    verified,
  };
}

