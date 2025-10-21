// prisma.js
import { PrismaClient } from '@prisma/client';

let prisma;

// Чтобы избежать повторного создания клиента в режиме разработки (hot reload)
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

export default prisma;
