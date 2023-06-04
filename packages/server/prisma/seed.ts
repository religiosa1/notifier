import { PrismaClient } from '@prisma/client'
import { hash } from 'src/Authorization/hash';
import { AuthorizationEnum } from 'src/models/AuthorizationEnum'
import { UserRoleEnum } from 'src/models/UserRoleEnum';

const prisma = new PrismaClient()

async function main() {
  await prisma.group.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "default" },
  });
  await prisma.channel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "default",
      Groups: {
        connect: { id: 1 }
      }
    },
  });
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      telegramId: Number(process.env.ROOT_TELEGRAM_ID) || 1234567,
      name: 'admin',
      password: await hash("1234567"),
      authorizationStatus: AuthorizationEnum.accepted,
      role: UserRoleEnum.admin,
      groups: {
        connect: { id: 1 }
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })