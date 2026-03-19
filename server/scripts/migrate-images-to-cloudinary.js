#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { v2: cloudinary } = require("cloudinary");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DATABASE_URL = (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || "").trim();
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();
const CLOUDINARY_FOLDER = (process.env.CLOUDINARY_FOLDER || "thriftapp").trim();

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or SUPABASE_DATABASE_URL is required");
  process.exit(1);
}

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("❌ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are required");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const isCloudinaryUrl = (url) =>
  typeof url === "string" && url.includes("res.cloudinary.com");

const resolveLocalPath = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return null;
  if (path.isAbsolute(rawPath)) return rawPath;
  return path.resolve(__dirname, "..", rawPath);
};

const migrate = async () => {
  console.log("🚀 Starting image migration to Cloudinary...");

  const productsResult = await pool.query(
    "SELECT id, imageurl, imagepath FROM products ORDER BY listedat ASC"
  );

  const products = productsResult.rows || [];
  if (!products.length) {
    console.log("ℹ️ No products found");
    return;
  }

  let migrated = 0;
  let skippedCloud = 0;
  let skippedMissing = 0;
  let failed = 0;

  for (const product of products) {
    const id = product.id;
    const imageUrl = product.imageurl || "";
    const imagePath = product.imagepath || "";

    if (isCloudinaryUrl(imageUrl)) {
      skippedCloud += 1;
      continue;
    }

    const localPath = resolveLocalPath(imagePath);
    if (!localPath || !fs.existsSync(localPath)) {
      skippedMissing += 1;
      console.warn(`⚠️ Skipping ${id}: local image not found (${imagePath || "empty"})`);
      continue;
    }

    try {
      const uploaded = await cloudinary.uploader.upload(localPath, {
        resource_type: "image",
        folder: CLOUDINARY_FOLDER,
        unique_filename: true,
      });

      const nextUrl = uploaded.secure_url || uploaded.url;
      const nextPath = uploaded.public_id || "";

      if (!nextUrl || !nextPath) {
        throw new Error("Cloudinary upload did not return expected fields");
      }

      await pool.query(
        "UPDATE products SET imageurl = $1, imagepath = $2 WHERE id = $3",
        [nextUrl, nextPath, id]
      );

      migrated += 1;
      console.log(`✅ Migrated ${id}`);
    } catch (error) {
      failed += 1;
      console.error(`❌ Failed ${id}:`, error.message);
    }
  }

  console.log("\n📊 Migration summary");
  console.log(`- Migrated: ${migrated}`);
  console.log(`- Already cloud: ${skippedCloud}`);
  console.log(`- Missing local file: ${skippedMissing}`);
  console.log(`- Failed: ${failed}`);
};

migrate()
  .catch((error) => {
    console.error("❌ Migration error:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
