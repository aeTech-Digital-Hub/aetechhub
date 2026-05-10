// IMPORTANT: env files must be loaded *before* any module that reads them.
// `tsx` runs this synchronously, so `dotenv.config()` at the top is enough,
// but only if it executes before the dynamic imports below.
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.MONGODB_URI) {
  console.error('\n❌ MONGODB_URI not found in .env.local or .env');
  console.error('   Create .env.local in the project root and set MONGODB_URI=...\n');
  process.exit(1);
}

async function run() {
  // Dynamic imports — these read env vars at module-load time, so we
  // wait until after dotenv has populated process.env above.
  const bcrypt = (await import('bcryptjs')).default;
  const { dbConnect } = await import('../lib/db');
  const { User } = await import('../models/User');
  const { Project } = await import('../models/Project');
  const { Research, Announcement } = await import('../models');

  await dbConnect();

  // Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'ephraim@aetechdigitalhub.com';
  const adminPass  = process.env.SEED_ADMIN_PASS  || 'changeme123';
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: 'Studio Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 10),
      role: 'admin',
    });
    console.log(`✓ Admin created: ${adminEmail} / ${adminPass}`);
  } else {
    console.log(`• Admin already exists: ${adminEmail}`);
  }

  // Featured projects
  const projects = [
    {
      slug: 'malawi-village',
      title: 'Malawi Village',
      tagline: 'Editorial e-commerce for an artisan beverage brand.',
      client: 'Malawi Village',
      year: 2026,
      services: ['web-product', 'data-analysis'],
      featured: true,
      summary: 'A custom e-commerce platform for a cold-pressed juice brand — full storefront, admin dashboard, Stripe checkout, multi-carrier shipping, and a live activity feed.',
      challenge: 'A fragmented buying experience across Instagram DMs and a generic Shopify skin meant the brand could not capture customer data, run abandoned-cart recovery, or properly measure marketing.',
      approach: 'We built a complete storefront and admin from scratch — Stripe Checkout with idempotent verification, Shippo live rates, and a Server-Sent Events activity feed so the owner sees every order, sign-up, and view in real time.',
      outcome: 'Conversion lifted, abandoned-cart recovery now runs automatically, and the team has a single pane of glass for the entire business.',
      metrics: [
        { label: 'Storefront sections', value: '7' },
        { label: 'Order capture', value: '100%' },
        { label: 'Admin panels', value: '8' },
      ],
      techStack: ['React', 'Vite', 'Express', 'MongoDB', 'Stripe', 'Shippo', 'Render'],
      published: true,
    },
    {
      slug: 'smilebaba-hub',
      title: 'SmileBaba Hub',
      tagline: "West Africa's all-in-one digital marketplace.",
      client: 'SmileBaba Hub',
      year: 2026,
      services: ['saas', 'data-analysis'],
      featured: true,
      summary: 'A full-stack marketplace for vendors across Ghana and Nigeria. Eight categories, dual-currency payments, real-time chat, and a built-in referral engine.',
      challenge: 'African SMEs sell on WhatsApp with no commerce infrastructure, no analytics, and no order management.',
      approach: 'A multi-tenant marketplace with vendor portals, customer accounts, Flutterwave billing for GHS and NGN, Socket.IO chat, and a marketer commission engine.',
      outcome: 'Production-ready platform live in two markets, generating real subscription revenue and processing daily orders.',
      metrics: [
        { label: 'Categories', value: '8' },
        { label: 'Markets', value: 'GH + NG' },
        { label: 'Real-time', value: 'Socket.IO' },
      ],
      techStack: ['Next.js 15', 'Express', 'MongoDB', 'Redis', 'Flutterwave', 'Socket.IO', 'Cloudinary'],
      published: true,
    },
  ];
  for (const p of projects) {
    await Project.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
  }
  console.log(`✓ ${projects.length} projects seeded`);

  await Research.findOneAndUpdate({ slug: 'why-narrowness-wins' }, {
    slug: 'why-narrowness-wins',
    title: 'Why narrowness wins',
    category: 'business',
    author: 'aeTech',
    readTime: 4,
    excerpt: 'A short note on why we deliberately limit the work we take on.',
    body: 'There is a temptation in this business to be a little of everything to everyone. We have decided not to.\n\nDeliberate scarcity is the only way we know to do the work well. Fewer clients means more attention. More attention means better outcomes. Better outcomes are the only marketing that actually compounds.',
    tags: ['process', 'agency'],
    published: true,
    publishedAt: new Date(),
  }, { upsert: true });

  await Announcement.findOneAndUpdate({ slug: 'now-open-for-projects' }, {
    slug: 'now-open-for-projects',
    title: 'aeTech Digital Hub is open for projects',
    type: 'milestone',
    excerpt: 'We are accepting a small number of new engagements per quarter.',
    body: 'After a season of quiet building, we are opening the studio to new clients again.\n\nWe are taking on a deliberately small number of engagements each quarter — typically two to three — so each one gets the senior attention it deserves.',
    pinned: true,
    published: true,
    publishedAt: new Date(),
  }, { upsert: true });

  console.log('✓ Sample research + announcement seeded');
  console.log('\nDone. Sign in at /login');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
