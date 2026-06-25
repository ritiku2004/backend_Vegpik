const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const bannersDir = path.resolve(__dirname, '../uploads/banners');

async function checkBanners() {
  try {
    const files = fs.readdirSync(bannersDir);
    console.log('Banner files:');
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp') || file.endsWith('.jpeg')) {
        const filePath = path.join(bannersDir, file);
        const metadata = await sharp(filePath).metadata();
        const aspectRatio = (metadata.width / metadata.height).toFixed(2);
        console.log(`- ${file}: ${metadata.width}x${metadata.height} (Aspect Ratio: ${aspectRatio})`);
      }
    }
  } catch (err) {
    console.error('Error reading banner dimensions:', err);
  }
}

checkBanners();
