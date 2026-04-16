#!/usr/bin/env node

const { readdirSync, writeFileSync } = require('fs');
const { join, extname } = require('path');

const texturesDir = join(__dirname, '../public/textures');

function getAllImages(dir, baseDir = '') {
  const images = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = join(baseDir, entry.name);

    if (entry.isDirectory()) {
      images.push(...getAllImages(fullPath, relativePath));
    } else if (extname(entry.name).toLowerCase() === '.png') {
      images.push(relativePath);
    }
  }

  return images;
}

function generateTextureListCode(images) {
  const imageList = images
    .map(img => `  \`\${publicUrl}/textures/${img.replace(/\\/g, '/')}\``)
    .join(',\n');

  return `// Auto-generated file. Do not edit manually. Run: npm run generate-textures
const publicUrl = process.env.PUBLIC_URL || '';
export const PRELOAD_IMAGES = [
${imageList}
];
`;
}

try {
  const images = getAllImages(texturesDir);
  const code = generateTextureListCode(images);
  const outputPath = join(__dirname, '../src/components/preloadTextures.js');

  writeFileSync(outputPath, code);
  console.log(`Generated ${images.length} texture paths in ${outputPath}`);
} catch (error) {
  console.error('Error generating texture list:', error);
  process.exit(1);
}
