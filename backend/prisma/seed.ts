import { PrismaClient, UserRole, AuthProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user: sophia@livria.com.br
  const sophiaPassword = await bcrypt.hash('Livria@2024!', 12);
  
  const sophia = await prisma.user.upsert({
    where: { email: 'sophia@livria.com.br' },
    update: {},
    create: {
      email: 'sophia@livria.com.br',
      password: sophiaPassword,
      name: 'Sophia Livria',
      username: 'sophia',
      role: UserRole.ADMIN,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      bio: 'Administradora do Sistema Livria de Narração de Livros'
    }
  });

  console.log('✅ Created admin user:', sophia.email);

  // Assign existing books to Sophia
  const existingBooks = await prisma.book.findMany({
    where: { userId: null }
  });

  if (existingBooks.length > 0) {
    await prisma.book.updateMany({
      where: { userId: null },
      data: { userId: sophia.id }
    });
    console.log(`✅ Assigned ${existingBooks.length} existing books to ${sophia.email}`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
