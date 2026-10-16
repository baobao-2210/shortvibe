import { PrismaClient, VideoVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Sample public video assets for development & testing only
// NOTE: Replace these with your own cloud storage URLs (e.g. AWS S3, Cloudflare R2) in production.
const SAMPLE_VIDEOS = [
  {
    title: 'Morning Coffee Routine',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    duration: 15,
  },
  {
    title: 'Sunset over the Ocean',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    duration: 20,
  },
  {
    title: 'Coding NestJS & PostgreSQL Backend',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
    duration: 35,
  },
  {
    title: 'Street Food in Da Nang',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    duration: 28,
  },
  {
    title: 'Quick Workout 10 Minutes',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
    duration: 18,
  },
  {
    title: 'Cute Golden Retriever Puppy',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600',
    duration: 52,
  },
  {
    title: 'Late Night Lo-Fi Beats',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    duration: 30,
  },
  {
    title: 'Mountain Hiking in Sa Pa',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
    duration: 45,
  },
  {
    title: 'Top 5 VSCode Extensions 2026',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
    duration: 22,
  },
  {
    title: 'Private Draft - Vlog Preview',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600',
    duration: 14,
  },
];

async function main() {
  console.log('🌱 Starting ShortVibe database seeding...');

  // Hash passwords securely with bcrypt (123456 for all test users)
  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('123456', saltRounds);

  // 1. Seed 5 Users (idempotent upsert)
  const userData = [
    {
      id: '11111111-1111-4111-a111-111111111111',
      username: 'alice_walker',
      email: 'alice@shortvibe.app',
      displayName: 'Alice Walker',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      bio: 'Travel enthusiast & lifestyle creator ✨ Living life one reel at a time',
    },
    {
      id: '22222222-2222-4222-a222-222222222222',
      username: 'bob_creator',
      email: 'bob@shortvibe.app',
      displayName: 'Bob The Creator',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      bio: 'Filmmaker and tech reviewer. Bringing visual stories to life.',
    },
    {
      id: '33333333-3333-4333-a333-333333333333',
      username: 'charlie_vlog',
      email: 'charlie@shortvibe.app',
      displayName: 'Charlie Vlogs',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
      bio: 'Daily vlogger | Coffee addict | Street explorer ☕🍜',
    },
    {
      id: '44444444-4444-4444-a444-444444444444',
      username: 'diana_dev',
      email: 'diana@shortvibe.app',
      displayName: 'Diana Dev',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: 'Fullstack Engineer | TypeScript, NestJS & React 💻',
    },
    {
      id: '55555555-5555-4555-a555-555555555555',
      username: 'ethan_fitness',
      email: 'ethan@shortvibe.app',
      displayName: 'Ethan Fitness',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: 'Daily workout tips & healthy nutrition routines 💪',
    },
  ];

  const createdUsers = [];
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      },
      create: {
        id: u.id,
        username: u.username,
        email: u.email,
        passwordHash: defaultPasswordHash,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ User upserted: @${user.username} (${user.id})`);
  }

  // 2. Seed 10 Videos
  const videoData = [
    {
      id: 'aaaaaaa1-1111-4aaa-aaaa-111111111111',
      userId: createdUsers[0].id,
      caption: 'Morning vibes with freshly brewed pour-over coffee ☕ #morning #coffee #relax',
      videoUrl: SAMPLE_VIDEOS[0].url,
      thumbnailUrl: SAMPLE_VIDEOS[0].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[0].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 1420,
    },
    {
      id: 'aaaaaaa2-2222-4aaa-aaaa-222222222222',
      userId: createdUsers[0].id,
      caption: 'Incredible sunset at Danang My Khe Beach 🌅 #sunset #vietnam #travel',
      videoUrl: SAMPLE_VIDEOS[1].url,
      thumbnailUrl: SAMPLE_VIDEOS[1].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[1].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 3890,
    },
    {
      id: 'aaaaaaa3-3333-4aaa-aaaa-333333333333',
      userId: createdUsers[3].id, // Diana Dev
      caption: 'Building production-grade NestJS + Prisma database schema 🚀 #coding #developer #nestjs',
      videoUrl: SAMPLE_VIDEOS[2].url,
      thumbnailUrl: SAMPLE_VIDEOS[2].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[2].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 5610,
    },
    {
      id: 'aaaaaaa4-4444-4aaa-aaaa-444444444444',
      userId: createdUsers[2].id, // Charlie
      caption: 'Best street food stall in Da Nang market! You must try this Banh Mi 🥖 #food #danang',
      videoUrl: SAMPLE_VIDEOS[3].url,
      thumbnailUrl: SAMPLE_VIDEOS[3].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[3].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 2750,
    },
    {
      id: 'aaaaaaa5-5555-4aaa-aaaa-555555555555',
      userId: createdUsers[4].id, // Ethan
      caption: 'Core workout in 10 minutes - no gym equipment required! 💪 #workout #fitness',
      videoUrl: SAMPLE_VIDEOS[4].url,
      thumbnailUrl: SAMPLE_VIDEOS[4].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[4].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 8900,
    },
    {
      id: 'aaaaaaa6-6666-4aaa-aaaa-666666666666',
      userId: createdUsers[1].id, // Bob
      caption: 'Meet Milo, the friendliest golden retriever puppy ever 🐶 #puppy #dogsoftiktok',
      videoUrl: SAMPLE_VIDEOS[5].url,
      thumbnailUrl: SAMPLE_VIDEOS[5].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[5].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 15400,
    },
    {
      id: 'aaaaaaa7-7777-4aaa-aaaa-777777777777',
      userId: createdUsers[1].id, // Bob
      caption: 'Chill lofi synth beats for late night coding sessions 🌙 #lofi #beats #chill',
      videoUrl: SAMPLE_VIDEOS[6].url,
      thumbnailUrl: SAMPLE_VIDEOS[6].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[6].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 4300,
    },
    {
      id: 'aaaaaaa8-8888-4aaa-aaaa-888888888888',
      userId: createdUsers[0].id, // Alice
      caption: 'Trekking through misty terraced rice fields in Sa Pa 🏔️ #hiking #sapa #nature',
      videoUrl: SAMPLE_VIDEOS[7].url,
      thumbnailUrl: SAMPLE_VIDEOS[7].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[7].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 6120,
    },
    {
      id: 'aaaaaaa9-9999-4aaa-aaaa-999999999999',
      userId: createdUsers[3].id, // Diana Dev
      caption: '5 essential VS Code extensions to double your productivity in 2026 🔥 #programming',
      videoUrl: SAMPLE_VIDEOS[8].url,
      thumbnailUrl: SAMPLE_VIDEOS[8].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[8].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 9230,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      userId: createdUsers[2].id, // Charlie
      caption: 'Upcoming travel draft video & cinematic sound vlog 🤫 #preview #cinematic',
      videoUrl: SAMPLE_VIDEOS[9].url,
      thumbnailUrl: SAMPLE_VIDEOS[9].thumbnail,
      durationSeconds: SAMPLE_VIDEOS[9].duration,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 1420,
    },
    {
      id: 'aaaaaaab-bbbb-4aaa-aaaa-bbbbbbbbbbbb',
      userId: createdUsers[1].id, // Bob
      caption: 'Vũ điệu đường phố sôi động tại phố đi bộ Nguyễn Huệ 💃🎶 #dance #saigon #music',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=600',
      durationSeconds: 40,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 12500,
    },
    {
      id: 'aaaaaaac-cccc-4aaa-aaaa-cccccccccccc',
      userId: createdUsers[3].id, // Diana Dev
      caption: 'Kỹ xảo không gian 3D cùng âm thanh cinematic cực ảo 🚀🎧 #vibe #cyberpunk #tech',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
      durationSeconds: 45,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 18900,
    },
    {
      id: 'aaaaaaad-dddd-4aaa-aaaa-dddddddddddd',
      userId: createdUsers[4].id, // Ethan
      caption: 'Top những pha xử lý bóng đá đường phố đỉnh chóp ⚽🔥 #streetfootball #skills #sports',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600',
      durationSeconds: 35,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 22400,
    },
    {
      id: 'aaaaaaae-eeee-4aaa-aaaa-eeeeeeeeeeee',
      userId: createdUsers[0].id, // Alice
      caption: 'Trải nghiệm du lịch vịnh Hạ Long trên du thuyền 5 sao ⛵🇻🇳 #travel #vietnam #halong',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
      durationSeconds: 20,
      visibility: VideoVisibility.PUBLIC,
      viewCount: 31200,
    },
  ];

  const createdVideos = [];
  for (const v of videoData) {
    const video = await prisma.video.upsert({
      where: { id: v.id },
      update: {
        caption: v.caption,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        visibility: v.visibility,
        viewCount: v.viewCount,
      },
      create: v,
    });
    createdVideos.push(video);
    console.log(`  ✓ Video upserted: "${v.caption.slice(0, 30)}..." (${video.id})`);
  }

  // 3. Seed Likes (idempotent upsert via composite primary key)
  const likesData = [
    { userId: createdUsers[0].id, videoId: createdVideos[2].id }, // Alice likes Diana's code video
    { userId: createdUsers[1].id, videoId: createdVideos[2].id }, // Bob likes Diana's code video
    { userId: createdUsers[2].id, videoId: createdVideos[2].id }, // Charlie likes Diana's code video
    { userId: createdUsers[4].id, videoId: createdVideos[2].id }, // Ethan likes Diana's code video
    { userId: createdUsers[3].id, videoId: createdVideos[0].id }, // Diana likes Alice's coffee video
    { userId: createdUsers[2].id, videoId: createdVideos[0].id }, // Charlie likes Alice's coffee video
    { userId: createdUsers[0].id, videoId: createdVideos[5].id }, // Alice likes Bob's puppy video
    { userId: createdUsers[3].id, videoId: createdVideos[5].id }, // Diana likes Bob's puppy video
    { userId: createdUsers[4].id, videoId: createdVideos[5].id }, // Ethan likes Bob's puppy video
    { userId: createdUsers[0].id, videoId: createdVideos[4].id }, // Alice likes Ethan's workout video
    { userId: createdUsers[1].id, videoId: createdVideos[4].id }, // Bob likes Ethan's workout video
  ];

  for (const l of likesData) {
    await prisma.like.upsert({
      where: {
        userId_videoId: {
          userId: l.userId,
          videoId: l.videoId,
        },
      },
      update: {},
      create: l,
    });
  }
  console.log(`  ✓ Seeded ${likesData.length} video likes`);

  // 4. Seed Comments & Comment Replies
  const topComments = [
    {
      id: 'c1111111-1111-4111-a111-111111111111',
      userId: createdUsers[0].id, // Alice
      videoId: createdVideos[2].id, // Diana's NestJS video
      content: 'This tutorial is super clean and easy to follow! Thanks for sharing 🙌',
    },
    {
      id: 'c2222222-2222-4222-a222-222222222222',
      userId: createdUsers[1].id, // Bob
      videoId: createdVideos[2].id, // Diana's NestJS video
      content: 'Great Prisma setup! Are you using Prisma Migrate in CI/CD pipeline as well?',
    },
    {
      id: 'c3333333-3333-4333-a333-333333333333',
      userId: createdUsers[3].id, // Diana
      videoId: createdVideos[0].id, // Alice's coffee video
      content: 'What roast of coffee beans are you using here? Looks delicious! ☕',
    },
    {
      id: 'c4444444-4444-4444-a444-444444444444',
      userId: createdUsers[4].id, // Ethan
      videoId: createdVideos[5].id, // Bob's puppy video
      content: 'Cutest dog ever! How old is he? 😍',
    },
  ];

  for (const c of topComments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: { content: c.content },
      create: c,
    });
  }
  console.log(`  ✓ Seeded ${topComments.length} root comments`);

  // Reply comments
  const replyComments = [
    {
      id: 'c5555555-5555-4555-a555-555555555555',
      userId: createdUsers[3].id, // Diana replies to Bob
      videoId: createdVideos[2].id,
      content: 'Yes! We run "prisma migrate deploy" in our automated GitHub Actions workflow 🚀',
      parentCommentId: topComments[1].id,
    },
    {
      id: 'c6666666-6666-4666-a666-666666666666',
      userId: createdUsers[0].id, // Alice replies to Diana
      videoId: createdVideos[0].id,
      content: 'It is a medium roast Arabica from Da Lat, Vietnam! Highly recommended 😊',
      parentCommentId: topComments[2].id,
    },
    {
      id: 'c7777777-7777-4777-a777-777777777777',
      userId: createdUsers[1].id, // Bob replies to Ethan
      videoId: createdVideos[5].id,
      content: 'He is 4 months old now! Full of energy 😄',
      parentCommentId: topComments[3].id,
    },
  ];

  for (const r of replyComments) {
    await prisma.comment.upsert({
      where: { id: r.id },
      update: { content: r.content },
      create: r,
    });
  }
  console.log(`  ✓ Seeded ${replyComments.length} comment replies`);

  // 5. Seed Follow relationships (Never self-follow)
  const followRelations = [
    { followerId: createdUsers[0].id, followingId: createdUsers[1].id }, // Alice follows Bob
    { followerId: createdUsers[0].id, followingId: createdUsers[3].id }, // Alice follows Diana
    { followerId: createdUsers[1].id, followingId: createdUsers[3].id }, // Bob follows Diana
    { followerId: createdUsers[2].id, followingId: createdUsers[0].id }, // Charlie follows Alice
    { followerId: createdUsers[2].id, followingId: createdUsers[3].id }, // Charlie follows Diana
    { followerId: createdUsers[3].id, followingId: createdUsers[0].id }, // Diana follows Alice
    { followerId: createdUsers[4].id, followingId: createdUsers[0].id }, // Ethan follows Alice
    { followerId: createdUsers[4].id, followingId: createdUsers[1].id }, // Ethan follows Bob
  ];

  for (const f of followRelations) {
    // Assert safety constraint: follower cannot follow self
    if (f.followerId === f.followingId) {
      throw new Error(`Self-follow attempted by user ${f.followerId}`);
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: f.followerId,
          followingId: f.followingId,
        },
      },
      update: {},
      create: f,
    });
  }
  console.log(`  ✓ Seeded ${followRelations.length} follow relationships`);

  console.log('✅ ShortVibe database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
