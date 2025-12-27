const IORedis = require('ioredis');
require('dotenv').config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

console.log('🔍 Testing Redis Connection...\n');
console.log(`📍 Host: ${REDIS_HOST}`);
console.log(`📍 Port: ${REDIS_PORT}\n`);

const redis = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        if (times > 3) {
            console.error('❌ Max retries reached. Redis is not available.');
            return null;
        }
        return Math.min(times * 100, 3000);
    }
});

redis.on('connecting', () => {
    console.log('⏳ Connecting to Redis...');
});

redis.on('connect', async () => {
    console.log('✅ Connected to Redis!\n');

    try {
        // Test basic operations
        console.log('🧪 Running tests...\n');

        // SET test
        console.log('1️⃣  Testing SET operation...');
        await redis.set('test:key', 'test-value');
        console.log('   ✅ SET successful\n');

        // GET test
        console.log('2️⃣  Testing GET operation...');
        const value = await redis.get('test:key');
        console.log(`   ✅ GET successful: "${value}"\n`);

        // DEL test
        console.log('3️⃣  Testing DEL operation...');
        await redis.del('test:key');
        console.log('   ✅ DEL successful\n');

        // PING test
        console.log('4️⃣  Testing PING operation...');
        const pong = await redis.ping();
        console.log(`   ✅ PING successful: "${pong}"\n`);

        // DBSIZE test
        console.log('5️⃣  Testing DBSIZE operation...');
        const dbsize = await redis.dbsize();
        console.log(`   ✅ DBSIZE: ${dbsize} keys\n`);

        console.log('🎉 All Redis tests passed!\n');

        // Now test with BullMQ
        console.log('-------------------------------------------');
        console.log('🔍 Testing BullMQ Queue...\n');

        const { Queue, Worker, Job } = require('bullmq');

        const testQueue = new Queue('test-queue', { connection: redis });
        console.log('✅ Queue created\n');

        // Add a job
        console.log('📤 Adding test job...');
        const job = await testQueue.add('test-job', {
            testData: 'Hello Redis Queue'
        });
        console.log(`✅ Job added with ID: ${job.id}\n`);

        // Create a worker
        console.log('⚙️  Creating worker...');
        const testWorker = new Worker('test-queue', async (job) => {
            console.log(`   📦 Processing job ${job.id}:`, job.data);
            return { result: 'Job completed successfully' };
        }, { connection: redis });

        testWorker.on('completed', (job, result) => {
            console.log(`✅ Job completed:`, result);
            console.log('\n🎉 BullMQ test successful!\n');
            cleanup();
        });

        testWorker.on('failed', (job, err) => {
            console.error(`❌ Job failed:`, err);
            cleanup();
        });

    } catch (error) {
        console.error('❌ Error during tests:', error.message);
        cleanup();
    }
});

redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.error('❌ Redis connection refused');
        console.error('   Make sure Redis is running on ' + REDIS_HOST + ':' + REDIS_PORT);
        console.error('\n   To start Redis with Docker:');
        console.error('   docker run -d -p 6379:6379 redis\n');
    } else {
        console.error('❌ Redis error:', err.message);
    }
    process.exit(1);
});

function cleanup() {
    redis.disconnect();
    process.exit(0);
}
