import 'dotenv/config';
import { PrismaClient, UserRole, AuthProvider, AchievementCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Create a PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Achievement definitions
const achievements = [
  // SOCIAL achievements
  {
    key: 'first_post',
    category: AchievementCategory.SOCIAL,
    name: 'Primeira Voz',
    description: 'Publique seu primeiro post',
    icon: '📢',
    livraReward: 10,
    requirement: { type: 'posts_count', target: 1 }
  },
  {
    key: '10_posts',
    category: AchievementCategory.SOCIAL,
    name: 'Comunicador',
    description: 'Publique 10 posts',
    icon: '💬',
    livraReward: 15,
    requirement: { type: 'posts_count', target: 10 }
  },
  {
    key: '50_posts',
    category: AchievementCategory.SOCIAL,
    name: 'Voz Ativa',
    description: 'Publique 50 posts',
    icon: '📣',
    livraReward: 30,
    requirement: { type: 'posts_count', target: 50 }
  },
  {
    key: 'first_follower',
    category: AchievementCategory.SOCIAL,
    name: 'Primeiro Fã',
    description: 'Ganhe seu primeiro seguidor',
    icon: '⭐',
    livraReward: 5,
    requirement: { type: 'followers_count', target: 1 }
  },
  {
    key: '10_followers',
    category: AchievementCategory.SOCIAL,
    name: 'Começando a Fazer Barulho',
    description: 'Alcance 10 seguidores',
    icon: '🌟',
    livraReward: 10,
    requirement: { type: 'followers_count', target: 10 }
  },
  {
    key: '100_followers',
    category: AchievementCategory.SOCIAL,
    name: 'Influente',
    description: 'Alcance 100 seguidores',
    icon: '👑',
    livraReward: 50,
    requirement: { type: 'followers_count', target: 100 }
  },
  {
    key: 'first_dm',
    category: AchievementCategory.SOCIAL,
    name: 'Conversa Iniciada',
    description: 'Envie sua primeira mensagem direta',
    icon: '💌',
    livraReward: 5,
    requirement: { type: 'messages_sent', target: 1 }
  },

  // WRITING achievements
  {
    key: 'first_book',
    category: AchievementCategory.WRITING,
    name: 'Primeiro Livro',
    description: 'Crie seu primeiro livro',
    icon: '📖',
    livraReward: 10,
    requirement: { type: 'books_count', target: 1 }
  },
  {
    key: '5_books',
    category: AchievementCategory.WRITING,
    name: 'Biblioteca Pessoal',
    description: 'Tenha 5 livros criados',
    icon: '📚',
    livraReward: 25,
    requirement: { type: 'books_count', target: 5 }
  },
  {
    key: '10_chapters',
    category: AchievementCategory.WRITING,
    name: 'Escritor Dedicado',
    description: 'Escreva 10 capítulos',
    icon: '✍️',
    livraReward: 20,
    requirement: { type: 'chapters_count', target: 10 }
  },
  {
    key: '50_chapters',
    category: AchievementCategory.WRITING,
    name: 'Autor Prolífico',
    description: 'Escreva 50 capítulos',
    icon: '🖋️',
    livraReward: 50,
    requirement: { type: 'chapters_count', target: 50 }
  },

  // READING achievements
  {
    key: 'first_campaign',
    category: AchievementCategory.READING,
    name: 'Leitor Voraz',
    description: 'Complete sua primeira campanha de leitura',
    icon: '🎯',
    livraReward: 50,
    requirement: { type: 'campaigns_completed', target: 1 }
  },
  {
    key: '5_campaigns',
    category: AchievementCategory.READING,
    name: 'Maratonista Literário',
    description: 'Complete 5 campanhas de leitura',
    icon: '🏃',
    livraReward: 100,
    requirement: { type: 'campaigns_completed', target: 5 }
  },

  // MILESTONE achievements
  {
    key: 'join_group',
    category: AchievementCategory.MILESTONE,
    name: 'Socializando',
    description: 'Entre em um grupo literário',
    icon: '👥',
    livraReward: 5,
    requirement: { type: 'groups_joined', target: 1 }
  },
  {
    key: '5_groups',
    category: AchievementCategory.MILESTONE,
    name: 'Networker',
    description: 'Participe de 5 grupos literários',
    icon: '🌐',
    livraReward: 15,
    requirement: { type: 'groups_joined', target: 5 }
  },
  {
    key: '10_likes_received',
    category: AchievementCategory.MILESTONE,
    name: 'Apreciado',
    description: 'Receba 10 curtidas em seus posts',
    icon: '❤️',
    livraReward: 10,
    requirement: { type: 'likes_received', target: 10 }
  },
  {
    key: '100_likes_received',
    category: AchievementCategory.MILESTONE,
    name: 'Popular',
    description: 'Receba 100 curtidas em seus posts',
    icon: '💕',
    livraReward: 30,
    requirement: { type: 'likes_received', target: 100 }
  },
  {
    key: '10_comments_received',
    category: AchievementCategory.MILESTONE,
    name: 'Conversador',
    description: 'Receba 10 comentários em seus posts',
    icon: '💭',
    livraReward: 10,
    requirement: { type: 'comments_received', target: 10 }
  },
  {
    key: 'following_10',
    category: AchievementCategory.MILESTONE,
    name: 'Explorador',
    description: 'Siga 10 pessoas',
    icon: '🔍',
    livraReward: 5,
    requirement: { type: 'following_count', target: 10 }
  },

  // SPECIAL achievements
  {
    key: 'early_adopter',
    category: AchievementCategory.SPECIAL,
    name: 'Pioneiro',
    description: 'Seja um dos primeiros 1000 usuários do LIVRIA',
    icon: '🚀',
    livraReward: 100,
    requirement: null,
    isHidden: true
  },
  {
    key: 'verified_account',
    category: AchievementCategory.SPECIAL,
    name: 'Conta Verificada',
    description: 'Verifique seu email',
    icon: '✅',
    livraReward: 5,
    requirement: null
  },
  {
    key: 'premium_member',
    category: AchievementCategory.SPECIAL,
    name: 'Membro Premium',
    description: 'Assine o plano Premium',
    icon: '💎',
    livraReward: 25,
    requirement: null
  },
  {
    key: 'pro_member',
    category: AchievementCategory.SPECIAL,
    name: 'Membro Pro',
    description: 'Assine o plano Pro',
    icon: '👑',
    livraReward: 50,
    requirement: null
  },
  {
    key: 'first_audio',
    category: AchievementCategory.WRITING,
    name: 'Narrador',
    description: 'Gere seu primeiro áudio de narração',
    icon: '🎙️',
    livraReward: 15,
    requirement: null
  },
  {
    key: 'story_creator',
    category: AchievementCategory.SOCIAL,
    name: 'Contador de Histórias',
    description: 'Crie seu primeiro story',
    icon: '📸',
    livraReward: 5,
    requirement: null
  },
  {
    key: '500_followers',
    category: AchievementCategory.SOCIAL,
    name: 'Estrela',
    description: 'Alcance 500 seguidores',
    icon: '⭐',
    livraReward: 100,
    requirement: { type: 'followers_count', target: 500 }
  },
  {
    key: '1000_followers',
    category: AchievementCategory.SOCIAL,
    name: 'Celebridade Literária',
    description: 'Alcance 1000 seguidores',
    icon: '🌟',
    livraReward: 200,
    requirement: { type: 'followers_count', target: 1000 }
  }
];

async function seedAchievements() {
  console.log('🏆 Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {
        category: achievement.category,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        livraReward: achievement.livraReward,
        requirement: achievement.requirement
      },
      create: achievement
    });
  }

  console.log(`✅ Seeded ${achievements.length} achievements`);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Seed achievements first
  await seedAchievements();

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

  // Create test user (USER role)
  const userPassword = await bcrypt.hash('User@2024!', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'usuario@livria.com.br' },
    update: {},
    create: {
      email: 'usuario@livria.com.br',
      password: userPassword,
      name: 'João Leitor',
      username: 'joaoleitor',
      role: UserRole.USER,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      bio: 'Usuário padrão para testes - Amante de livros e leitura'
    }
  });
  console.log('✅ Created test user (USER):', testUser.email);

  // Create test writer (WRITER role)
  const writerPassword = await bcrypt.hash('Writer@2024!', 12);
  const testWriter = await prisma.user.upsert({
    where: { email: 'escritor@livria.com.br' },
    update: {},
    create: {
      email: 'escritor@livria.com.br',
      password: writerPassword,
      name: 'Maria Escritora',
      username: 'mariaescritora',
      role: UserRole.WRITER,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      bio: 'Escritora para testes - Autora de contos e romances'
    }
  });
  console.log('✅ Created test writer (WRITER):', testWriter.email);

  // Create test pro user (PRO role)
  const proPassword = await bcrypt.hash('Pro@2024!', 12);
  const testPro = await prisma.user.upsert({
    where: { email: 'pro@livria.com.br' },
    update: {},
    create: {
      email: 'pro@livria.com.br',
      password: proPassword,
      name: 'Carlos Profissional',
      username: 'carlospro',
      role: UserRole.PRO,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      bio: 'Usuário PRO para testes - Acesso completo às funcionalidades'
    }
  });
  console.log('✅ Created test pro user (PRO):', testPro.email);

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
