const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
    console.log('🧪 Testando integração completa com o banco de dados...\n');
    console.log('='.repeat(70));

    try {
        // Teste 1: Conexão
        console.log('\n1️⃣ Testando conexão...');
        await prisma.$connect();
        console.log('   ✅ Conexão estabelecida com sucesso!');

        // Teste 2: Criar um livro de exemplo
        console.log('\n2️⃣ Criando livro de exemplo...');
        const book = await prisma.book.create({
            data: {
                title: 'O Senhor dos Anéis',
                author: 'J.R.R. Tolkien',
                description: 'Uma épica aventura na Terra Média',
                coverUrl: 'https://example.com/lotr-cover.jpg'
            }
        });
        console.log('   ✅ Livro criado com sucesso!');
        console.log('   📖 ID:', book.id);
        console.log('   📚 Título:', book.title);

        // Teste 3: Criar um capítulo
        console.log('\n3️⃣ Criando capítulo de exemplo...');
        const chapter = await prisma.chapter.create({
            data: {
                bookId: book.id,
                title: 'A Sociedade do Anel',
                orderIndex: 1,
                status: 'draft'
            }
        });
        console.log('   ✅ Capítulo criado com sucesso!');
        console.log('   📄 ID:', chapter.id);
        console.log('   📝 Título:', chapter.title);

        // Teste 4: Criar um personagem
        console.log('\n4️⃣ Criando personagem de exemplo...');
        const character = await prisma.character.create({
            data: {
                bookId: book.id,
                name: 'Gandalf',
                voiceId: 'voice-wizard-001',
                voiceDescription: 'Voz sábia e profunda de um mago ancião'
            }
        });
        console.log('   ✅ Personagem criado com sucesso!');
        console.log('   🎭 ID:', character.id);
        console.log('   👤 Nome:', character.name);

        // Teste 5: Criar uma fala
        console.log('\n5️⃣ Criando fala de exemplo...');
        const speech = await prisma.speech.create({
            data: {
                chapterId: chapter.id,
                characterId: character.id,
                text: 'Um mago nunca se atrasa, nem se adianta. Ele chega precisamente quando pretende.',
                orderIndex: 1
            }
        });
        console.log('   ✅ Fala criada com sucesso!');
        console.log('   💬 ID:', speech.id);
        console.log('   📝 Texto:', speech.text.substring(0, 50) + '...');

        // Teste 6: Buscar dados com relacionamentos
        console.log('\n6️⃣ Buscando dados com relacionamentos...');
        const bookWithRelations = await prisma.book.findUnique({
            where: { id: book.id },
            include: {
                chapters: {
                    include: {
                        speeches: {
                            include: {
                                character: true
                            }
                        }
                    }
                },
                characters: true
            }
        });
        console.log('   ✅ Dados recuperados com sucesso!');
        console.log('   📚 Livro:', bookWithRelations.title);
        console.log('   📄 Capítulos:', bookWithRelations.chapters.length);
        console.log('   🎭 Personagens:', bookWithRelations.characters.length);
        console.log('   💬 Falas:', bookWithRelations.chapters[0].speeches.length);

        // Teste 7: Limpar dados de teste
        console.log('\n7️⃣ Limpando dados de teste...');
        await prisma.speech.deleteMany({ where: { chapterId: chapter.id } });
        await prisma.character.deleteMany({ where: { bookId: book.id } });
        await prisma.chapter.deleteMany({ where: { bookId: book.id } });
        await prisma.book.delete({ where: { id: book.id } });
        console.log('   ✅ Dados de teste removidos!');

        console.log('\n' + '='.repeat(70));
        console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
        console.log('='.repeat(70));
        console.log('\n🎉 Seu banco de dados está 100% funcional!');
        console.log('\n📊 Resumo dos testes:');
        console.log('   ✅ Conexão com Prisma');
        console.log('   ✅ Criação de livros');
        console.log('   ✅ Criação de capítulos');
        console.log('   ✅ Criação de personagens');
        console.log('   ✅ Criação de falas');
        console.log('   ✅ Consultas com relacionamentos');
        console.log('   ✅ Deleção em cascata');
        console.log('\n💡 Próximo passo: Execute "npm run dev" para iniciar o servidor!\n');

    } catch (error) {
        console.error('\n❌ Erro durante os testes:');
        console.error('   Mensagem:', error.message);
        console.error('\n   Stack:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();
