import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'iamjoshuasin@gmail.com';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const result = await prisma.gym.updateMany({
    where: { registeredBy: null },
    data: { registeredBy: user.id },
  });

  console.log(`Done. Claimed ${result.count} gym(s) for ${user.displayName} (${user.email}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
