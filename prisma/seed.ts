import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seed() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Wipe existing records to allow clean refreshes
  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deviceCommand.deleteMany();
  await prisma.checkInRequest.deleteMany();
  await prisma.emergencySOS.deleteMany();
  await prisma.screenSpy.deleteMany();
  await prisma.socialMessage.deleteMany();
  await prisma.screenTimeLimit.deleteMany();
  await prisma.websiteFilter.deleteMany();
  await prisma.appBlock.deleteMany();
  await prisma.appUsage.deleteMany();
  await prisma.geofence.deleteMany();
  await prisma.location.deleteMany();
  await prisma.device.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  // 2. Create family
  const family = await prisma.family.create({
    data: {
      name: "Safety Family Group",
    },
  });

  // 3. Create parent user
  const passwordHash = await bcrypt.hash("password123", 10);
  const parent = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "parent@safety.com",
      passwordHash,
      role: "PARENT",
      familyId: family.id,
    },
  });
  console.log(`👤 Created Parent User: ${parent.email} (Password: password123)`);

  // 4. Create children
  const leo = await prisma.child.create({
    data: {
      name: "Leo Doe",
      familyId: family.id,
    },
  });

  const chloe = await prisma.child.create({
    data: {
      name: "Chloe Doe",
      familyId: family.id,
    },
  });
  console.log("👶 Created Children profiles: Leo and Chloe");

  // 5. Create child devices
  const leoDevice = await prisma.device.create({
    data: {
      childId: leo.id,
      deviceName: "Leo's Samsung Galaxy S22",
      osVersion: "Android 13 (API 33)",
      appVersion: "1.0.4",
      deviceToken: "leo_device_telemetry_secure_token_12345",
      batteryLevel: 78,
      isLocked: false,
      stealthMode: false,
      connectionState: "ONLINE",
      lastSeen: new Date(),
    },
  });

  const chloeDevice = await prisma.device.create({
    data: {
      childId: chloe.id,
      deviceName: "Chloe's iPhone 14 Pro",
      osVersion: "iOS 17.2",
      appVersion: "1.0.4",
      deviceToken: "chloe_device_telemetry_secure_token_67890",
      batteryLevel: 94,
      isLocked: false,
      stealthMode: true, // Concealed tracking enabled
      connectionState: "ONLINE",
      lastSeen: new Date(),
    },
  });
  console.log("📱 Created Child companion Devices");

  // 6. Seed locations trails (centered in Central Park, New York)
  console.log("📍 Seeding locations trail coordinates...");
  const baseLat = 40.785091;
  const baseLng = -73.968285;
  const hourMs = 60 * 60 * 1000;

  // 12 location logs for Leo walking through Central Park over the past 12 hours
  for (let i = 12; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * hourMs);
    const step = (12 - i) * 0.0015; // Simulated movement path
    await prisma.location.create({
      data: {
        childId: leo.id,
        deviceId: leoDevice.id,
        latitude: baseLat + step * Math.sin(step),
        longitude: baseLng + step * Math.cos(step),
        accuracy: 10 + Math.random() * 5,
        speed: 1.2 + Math.random() * 2,
        createdAt: timestamp,
      },
    });
  }

  // Seeding last coordinates for Chloe
  await prisma.location.create({
    data: {
      childId: chloe.id,
      deviceId: chloeDevice.id,
      latitude: baseLat - 0.015,
      longitude: baseLng + 0.012,
      accuracy: 8,
      speed: 0,
      createdAt: new Date(),
    },
  });

  // 7. Geofencing Zones
  const schoolFence = await prisma.geofence.create({
    data: {
      childId: leo.id,
      name: "Central Park School",
      latitude: baseLat + 0.005,
      longitude: baseLng + 0.005,
      radius: 200, // 200m
      type: "SAFE",
      isActive: true,
    },
  });

  const dangerZone = await prisma.geofence.create({
    data: {
      childId: leo.id,
      name: "Restricted Construction Area",
      latitude: baseLat + 0.02,
      longitude: baseLng + 0.02,
      radius: 150,
      type: "DANGER",
      isActive: true,
    },
  });
  console.log("🗺️ Seeded circular Geofences (School & Construction Site)");

  // 8. App Usages
  console.log("📊 Seeding app package usage records...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Leo app duration stats
  const appsLeo = [
    { name: "YouTube Kids", pkg: "com.google.android.apps.youtube.kids", min: 140 },
    { name: "Subway Surfers", pkg: "com.kiloo.subwaysurf", min: 85 },
    { name: "Roblox", pkg: "com.roblox.client", min: 45 },
    { name: "Duolingo", pkg: "com.duolingo", min: 20 },
  ];
  for (const app of appsLeo) {
    await prisma.appUsage.create({
      data: {
        childId: leo.id,
        deviceId: leoDevice.id,
        appName: app.name,
        packageName: app.pkg,
        durationMinutes: app.min,
        date: today,
        lastUsedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    });
  }

  // Chloe app duration stats
  const appsChloe = [
    { name: "TikTok", pkg: "com.zhiliaoapp.musically", min: 210 },
    { name: "Instagram", pkg: "com.instagram.android", min: 150 },
    { name: "WhatsApp", pkg: "com.whatsapp", min: 90 },
    { name: "Spotify", pkg: "com.spotify.music", min: 60 },
  ];
  for (const app of appsChloe) {
    await prisma.appUsage.create({
      data: {
        childId: chloe.id,
        deviceId: chloeDevice.id,
        appName: app.name,
        packageName: app.pkg,
        durationMinutes: app.min,
        date: today,
        lastUsedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });
  }

  // 9. App Blocks
  await prisma.appBlock.create({
    data: {
      childId: leo.id,
      appName: "Roblox",
      packageName: "com.roblox.client",
      isBlocked: true,
      dailyLimitMinutes: 30, // Blocked after 30 minutes
    },
  });

  // 10. Website Filters
  await prisma.websiteFilter.createMany({
    data: [
      { childId: leo.id, domain: "gambling-online.com", category: "Gambling", isBlocked: true },
      { childId: leo.id, domain: "violent-shooters.net", category: "Gaming / Violence", isBlocked: true },
      { childId: chloe.id, domain: "anonymous-chat.io", category: "Adult / Chat", isBlocked: true },
    ],
  });

  // 11. Screen Time Limits
  // Setup daily screen time calendar slots
  for (let i = 0; i <= 6; i++) {
    await prisma.screenTimeLimit.create({
      data: {
        childId: leo.id,
        dayOfWeek: i,
        dailyLimitMinutes: i === 0 || i === 6 ? 180 : 120, // 3h on weekends, 2h on weekdays
        startTime: "08:00",
        endTime: "21:00",
      },
    });

    await prisma.screenTimeLimit.create({
      data: {
        childId: chloe.id,
        dayOfWeek: i,
        dailyLimitMinutes: i === 0 || i === 6 ? 240 : 180, // 4h on weekends, 3h on weekdays
        startTime: "07:30",
        endTime: "22:00",
      },
    });
  }

  // 12. Audit Chat messages (Social Spy logs for Chloe)
  console.log("💬 Seeding audited messaging logs...");
  const msgTime = new Date();
  await prisma.socialMessage.createMany({
    data: [
      {
        childId: chloe.id,
        deviceId: chloeDevice.id,
        platform: "WHATSAPP",
        senderName: "Emily (Friend)",
        senderPhone: "+15550199",
        messageContent: "Hey! Are we still meeting up at the library after school?",
        messageTime: new Date(msgTime.getTime() - 25 * 60 * 1000),
      },
      {
        childId: chloe.id,
        deviceId: chloeDevice.id,
        platform: "WHATSAPP",
        senderName: "Chloe Doe",
        messageContent: "Yes! Just finishing my science homework, then I'll walk over.",
        messageTime: new Date(msgTime.getTime() - 23 * 60 * 1000),
      },
      {
        childId: chloe.id,
        deviceId: chloeDevice.id,
        platform: "TELEGRAM",
        senderName: "Stranger7",
        senderPhone: undefined,
        messageContent: "Hey there! Are you the one from the gaming discord server?",
        messageTime: new Date(msgTime.getTime() - 10 * 60 * 1000),
      },
      {
        childId: chloe.id,
        deviceId: chloeDevice.id,
        platform: "MESSENGER",
        senderName: "Aunt Sarah",
        senderPhone: undefined,
        messageContent: "Hi sweetie, don't forget to tell your dad that I'm coming over this Sunday!",
        messageTime: new Date(msgTime.getTime() - 5 * hourMs),
      },
    ],
  });

  // 13. Screen Spy Captures (Leo's device)
  await prisma.screenSpy.createMany({
    data: [
      {
        childId: leo.id,
        deviceId: leoDevice.id,
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80", // Simulated gaming screen
        capturedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        childId: leo.id,
        deviceId: leoDevice.id,
        imageUrl: "https://images.unsplash.com/photo-1608111283390-2e333b9b279c?auto=format&fit=crop&w=600&q=80", // Simulated browser screen
        capturedAt: new Date(Date.now() - 35 * 60 * 1000),
      },
    ],
  });

  // 14. Notifications & SOS
  await prisma.notification.createMany({
    data: [
      {
        userId: parent.id,
        type: "LOW_BATTERY",
        title: "🔋 Child Battery Warning",
        message: "Leo's device battery has dropped to 15%!",
        data: { childId: leo.id, batteryLevel: 15 },
        isRead: false,
      },
      {
        userId: parent.id,
        type: "DEVICE_OFFLINE",
        title: "🔌 Device Connection Warning",
        message: "Chloe's device connection has been lost (Offline).",
        data: { childId: chloe.id },
        isRead: true,
      },
    ],
  });

  // Active SOS Alarm simulation for Leo
  const activeSos = await prisma.emergencySOS.create({
    data: {
      childId: leo.id,
      latitude: baseLat + 0.008,
      longitude: baseLng - 0.005,
      status: "ACTIVE",
    },
  });

  await prisma.notification.create({
    data: {
      userId: parent.id,
      type: "SOS_TRIGGERED",
      title: "🚨 EMERGENCY SOS TRIGGERED",
      message: "Leo Doe has triggered an active panic SOS alarm!",
      data: { childId: leo.id, sosId: activeSos.id, latitude: activeSos.latitude, longitude: activeSos.longitude },
      isRead: false,
    },
  });

  console.log("✅ Seeding completed successfully!");
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error("💥 Error seeding database:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
