import "dotenv/config";
import bcrypt from "bcryptjs";
import { MathBranch, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.ADMIN_PHONE ?? "201201212002";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeThisAdminPassword123!";

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      name: process.env.ADMIN_NAME ?? "Eng. Shehab Elebady",
      parentPhone: adminPhone,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN
    },
    create: {
      name: process.env.ADMIN_NAME ?? "Eng. Shehab Elebady",
      phone: adminPhone,
      parentPhone: adminPhone,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN
    }
  });

  const existingExam = await prisma.exam.findFirst({
    where: { title: "Statics Foundations" }
  });

  if (!existingExam) {
    await prisma.exam.create({
      data: {
        title: "Statics Foundations",
        branch: MathBranch.STATICS,
        durationMinutes: 30,
        questions: {
          create: [
            {
              text: "A body is in equilibrium when the resultant force and resultant moment are both equal to what?",
              choices: {
                create: [
                  { text: "Zero", isCorrect: true },
                  { text: "One newton", isCorrect: false },
                  { text: "Maximum friction", isCorrect: false },
                  { text: "The body weight", isCorrect: false }
                ]
              }
            },
            {
              text: "If two concurrent forces are perpendicular, the magnitude of their resultant is found using which theorem?",
              choices: {
                create: [
                  { text: "Pythagoras theorem", isCorrect: true },
                  { text: "Lami theorem", isCorrect: false },
                  { text: "Binomial theorem", isCorrect: false },
                  { text: "Mean value theorem", isCorrect: false }
                ]
              }
            }
          ]
        }
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
