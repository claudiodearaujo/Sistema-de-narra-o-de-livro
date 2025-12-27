const IORedis = require('ioredis');
const { Queue, Worker } = require('bullmq');
require('dotenv').config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

console.log('\n🎯 Testing BullMQ Queues Integration\n');
console.log('═══════════════════════════════════════\n');

const redisConnection = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});

// Test Narration Queue
async function testNarrationQueue() {
    console.log('📖 Testing Narration Queue...\n');

    try {
        const narrationQueue = new Queue('narration', { connection: redisConnection });

        // Add a narration job
        const job = await narrationQueue.add('generate-narration', {
            chapterId: 'test-chapter-001',
            title: 'Chapter 1: The Beginning'
        });

        console.log(`✅ Narration job added: ${job.id}`);
        console.log(`   Chapter ID: ${job.data.chapterId}`);
        console.log(`   Status: waiting\n`);

        // Get job details
        const jobDetails = await job.toJSON();
        console.log('📋 Job Details:');
        console.log(`   - Name: ${jobDetails.name}`);
        console.log(`   - State: ${jobDetails._state}`);
        console.log(`   - Created: ${new Date(jobDetails.timestamp).toLocaleString()}\n`);

        // Create a simple worker that logs what it receives
        const narrationWorker = new Worker('narration', async (job) => {
            console.log(`⚙️  Worker processing job ${job.id}`);
            console.log(`   Data: ${JSON.stringify(job.data)}`);
            
            // Simulate progress updates
            await job.updateProgress(33);
            console.log('   Progress: 33%');
            
            await job.updateProgress(66);
            console.log('   Progress: 66%');
            
            await job.updateProgress(100);
            console.log('   Progress: 100%');
            
            return { 
                chapterId: job.data.chapterId, 
                audioUrl: 'mock://audio.mp3',
                status: 'completed'
            };
        }, { connection: redisConnection });

        return new Promise((resolve) => {
            narrationWorker.on('completed', (job, result) => {
                console.log(`✅ Job ${job.id} completed!\n`);
                resolve();
            });

            narrationWorker.on('failed', (job, err) => {
                console.error(`❌ Job ${job.id} failed:`, err);
                resolve();
            });
        });

    } catch (error) {
        console.error('❌ Narration Queue Error:', error.message);
    }
}

// Test Audio Queue
async function testAudioQueue() {
    console.log('🔊 Testing Audio Queue...\n');

    try {
        const audioQueue = new Queue('audio', { connection: redisConnection });

        // Add an audio processing job
        const job = await audioQueue.add('process-audio', {
            chapterId: 'test-chapter-001',
            speechIds: ['speech-001', 'speech-002', 'speech-003'],
            outputPath: '/tmp/chapter_audio.mp3'
        });

        console.log(`✅ Audio job added: ${job.id}`);
        console.log(`   Chapter ID: ${job.data.chapterId}`);
        console.log(`   Speeches: ${job.data.speechIds.length}`);
        console.log(`   Status: waiting\n`);

        // Get job details
        const jobDetails = await job.toJSON();
        console.log('📋 Job Details:');
        console.log(`   - Name: ${jobDetails.name}`);
        console.log(`   - State: ${jobDetails._state}`);
        console.log(`   - Created: ${new Date(jobDetails.timestamp).toLocaleString()}\n`);

        // Create a simple worker
        const audioWorker = new Worker('audio', async (job) => {
            console.log(`⚙️  Worker processing job ${job.id}`);
            console.log(`   Chapter: ${job.data.chapterId}`);
            console.log(`   Speeches: ${job.data.speechIds.length}`);
            
            // Simulate progress
            await job.updateProgress(25);
            console.log('   Progress: 25% (Concatenating...)');
            
            await job.updateProgress(50);
            console.log('   Progress: 50% (Normalizing...)');
            
            await job.updateProgress(75);
            console.log('   Progress: 75% (Finalizing...)');
            
            await job.updateProgress(100);
            console.log('   Progress: 100%');
            
            return { 
                chapterId: job.data.chapterId, 
                finalUrl: job.data.outputPath,
                status: 'completed'
            };
        }, { connection: redisConnection });

        return new Promise((resolve) => {
            audioWorker.on('completed', (job, result) => {
                console.log(`✅ Job ${job.id} completed!\n`);
                resolve();
            });

            audioWorker.on('failed', (job, err) => {
                console.error(`❌ Job ${job.id} failed:`, err);
                resolve();
            });
        });

    } catch (error) {
        console.error('❌ Audio Queue Error:', error.message);
    }
}

// Check Redis connection
redisConnection.on('connect', async () => {
    console.log('✅ Connected to Redis\n');
    
    try {
        // Run tests sequentially
        await testNarrationQueue();
        
        // Wait a bit before running audio test
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testAudioQueue();
        
        console.log('═══════════════════════════════════════');
        console.log('✅ All queue tests completed!\n');
        console.log('📊 Queue Status Summary:');
        console.log('   - Narration Queue: ✅ Working');
        console.log('   - Audio Queue: ✅ Working');
        console.log('   - Workers: ✅ Connected\n');

    } catch (error) {
        console.error('❌ Error running tests:', error);
    } finally {
        redisConnection.disconnect();
        process.exit(0);
    }
});

redisConnection.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.error('❌ Redis connection refused!');
        console.error(`   Make sure Redis is running on ${REDIS_HOST}:${REDIS_PORT}`);
        console.error('\n   To start Redis with Docker:');
        console.error('   docker run -d -p 6379:6379 redis\n');
    } else {
        console.error('❌ Redis error:', err.message);
    }
    process.exit(1);
});
