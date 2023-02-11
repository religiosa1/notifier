import { PrismaClient } from '@prisma/client'
import { hash } from 'src/Authorization/hash';
import { AuthorizationEnum } from 'src/models/AuthorizationEnum'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      telegramId: process.env.ROOT_TELEGRAM_ID || "1234567",
      name: 'admin',
      // only admin users can have password, so if the password exists it's an admin
      password: await hash("1234567"),
      authorizationStatus: AuthorizationEnum.accepted
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