import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function changeRole(email, newRole) {
    const user = await prisma.user.update({
        where: { email },
        data: { role: newRole }
    });
    console.log(`Role changed: ${user.name} -> ${user.role}`);
}

changeRole("sasha.akishev@gmail.com", "ADMIN");