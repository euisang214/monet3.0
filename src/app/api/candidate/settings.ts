import { prisma } from "../../../../lib/db";
import { s3 } from "../../../../lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function getCandidateSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { candidateProfile: true },
  });

  if (!user) return null;

  let resumeUrl = user.candidateProfile?.resumeUrl ?? null;
  if (resumeUrl && process.env.AWS_S3_BUCKET) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: resumeUrl,
      });
      resumeUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch {
      // ignore S3 errors and fall back to stored URL
    }
  }

  return {
    email: user.email,
    resumeUrl,
  };
}

