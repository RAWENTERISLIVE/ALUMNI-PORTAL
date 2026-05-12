#!/usr/bin/env node
/**
 * Icon & Splash Generator for MPS Ajmer Connect PWA/Mobile App
 * 
 * Requirements:
 *   npm install --save-dev sharp
 * 
 * Usage:
 *   node scripts/generate-icons.mjs
 * 
 * Input:  public/logo.png  (must be at least 512x512)
 * Output: public/icons/    (all PWA icon sizes)
 *         public/splash/   (iOS splash screens)
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const sourceIcon = join(rootDir, 'public', 'logo.png');
const iconsDir = join(rootDir, 'public', 'icons');
const splashDir = join(rootDir, 'public', 'splash');

// Create output directories
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
if (!existsSync(splashDir)) mkdirSync(splashDir, { recursive: true });

const BRAND_COLOR = '#8B0000'; // MPS Maroon

// Icon sizes to generate
const iconSizes = [48, 72, 96, 128, 144, 152, 192, 256, 512];

// iOS Splash screen sizes [width, height]
const splashSizes = [
  [2048, 2732], // 12.9" iPad Pro
  [1668, 2388], // 11" iPad Pro
  [1170, 2532], // iPhone 12/13/14
  [1125, 2436], // iPhone X/XS/11 Pro
  [1242, 2688], // iPhone XS Max/11 Pro Max
  [828, 1792],  // iPhone XR/11
  [750, 1334],  // iPhone SE/8/7/6s
];

async function generateIcons() {
  console.log('🎨 Generating app icons...');
  
  for (const size of iconSizes) {
    // Standard icon
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // Maskable icon (icon with safe zone padding - 20% padding)
  const maskablePadding = Math.round(512 * 0.2);
  await sharp(sourceIcon)
    .resize(512 - maskablePadding * 2, 512 - maskablePadding * 2, { fit: 'contain', background: { r: 139, g: 0, b: 0, alpha: 1 } })
    .extend({
      top: maskablePadding,
      bottom: maskablePadding,
      left: maskablePadding,
      right: maskablePadding,
      background: { r: 139, g: 0, b: 0, alpha: 1 }, // Maroon background
    })
    .png()
    .toFile(join(iconsDir, 'icon-512-maskable.png'));
  console.log('  ✓ icon-512-maskable.png');
  
  console.log('\n📱 Generating iOS splash screens...');
  
  for (const [width, height] of splashSizes) {
    // Create a maroon splash with centered logo (25% of screen to avoid clipping)
    const logoSize = Math.round(Math.min(width, height) * 0.25);
    
    // First resize the logo
    const logoBuffer = await sharp(sourceIcon)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 139, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    
    // Create the splash background and composite the logo centered
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 139, g: 0, b: 0, alpha: 255 }, // Maroon
      }
    })
      .composite([{
        input: logoBuffer,
        gravity: 'center',
      }])
      .png()
      .toFile(join(splashDir, `splash-${width}x${height}.png`));
    
    console.log(`  ✓ splash-${width}x${height}.png`);
  }
  
  console.log('\n✅ All icons and splash screens generated successfully!');
  console.log(`   Icons: ${iconsDir}`);
  console.log(`   Splash: ${splashDir}`);
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
