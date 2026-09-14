import { PrismaClient } from '@prisma/client';

// En développement, Next recharge les modules à chaque modification. Sans ce
// cache global, chaque rechargement ouvrirait une nouvelle connexion et la
// base finirait par refuser les suivantes.
const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  global_.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global_.prisma = prisma;
