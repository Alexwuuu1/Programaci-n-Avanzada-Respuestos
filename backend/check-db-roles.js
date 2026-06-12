import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.usuario.findMany({
      include: { rol: true }
    });
    console.log("Users and roles in DB:");
    users.forEach(u => {
      console.log(`- Username: ${u.usuario} | Role Name: ${u.rol.nombre} | Estado: ${u.estado}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
