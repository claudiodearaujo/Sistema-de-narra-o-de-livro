const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyBook() {
    console.log('📚 Verificando livros no banco de dados...\n');

    try {
        const books = await prisma.book.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`✅ Total de livros: ${books.length}\n`);

        if (books.length > 0) {
            console.log('📖 Livros cadastrados:');
            console.log('='.repeat(70));

            books.forEach((book, index) => {
                console.log(`\n${index + 1}. ${book.title}`);
                console.log(`   Autor: ${book.author}`);
                console.log(`   Descrição: ${book.description || 'N/A'}`);
                console.log(`   ID: ${book.id}`);
                console.log(`   Criado em: ${book.createdAt.toLocaleString('pt-BR')}`);
            });

            console.log('\n' + '='.repeat(70));
        } else {
            console.log('⚠️  Nenhum livro encontrado no banco de dados.');
        }

    } catch (error) {
        console.error('❌ Erro ao buscar livros:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyBook();
