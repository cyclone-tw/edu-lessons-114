#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, 'lessons');
const CATALOG_FILE = path.join(__dirname, 'catalog.json');

// Read existing catalog
let existingCatalog = {
  title: '114 學年度課文總覽',
  repo: { owner: '', name: 'edu-lessons-114' },
  categories: []
};

if (fs.existsSync(CATALOG_FILE)) {
  try {
    existingCatalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
    console.log('已讀取現有 catalog.json');
  } catch (e) {
    console.warn('catalog.json 解析失敗，使用預設值');
  }
}

// Build lookup maps from existing catalog
const existingCatMap = {};
existingCatalog.categories.forEach(cat => {
  existingCatMap[cat.folder] = cat;
});

// Scan lessons directory
const categories = [];
let catOrder = 1;

if (fs.existsSync(LESSONS_DIR)) {
  const catDirs = fs.readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'));

  for (const catDir of catDirs) {
    const existingCat = existingCatMap[catDir.name];

    // Build group lookup for this category
    const existingGroupMap = {};
    if (existingCat) {
      existingCat.groups.forEach(g => {
        existingGroupMap[g.folder] = g;
      });
    }

    const groups = [];
    let groupOrder = 1;

    const groupDirs = fs.readdirSync(path.join(LESSONS_DIR, catDir.name), { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'));

    for (const groupDir of groupDirs) {
      const existingGroup = existingGroupMap[groupDir.name];

      // Scan HTML files
      const files = fs.readdirSync(path.join(LESSONS_DIR, catDir.name, groupDir.name))
        .filter(f => f.endsWith('.html') && !f.startsWith('.'))
        .sort();

      const groupObj = {
        folder: groupDir.name,
        displayName: existingGroup ? existingGroup.displayName : groupDir.name,
        order: existingGroup ? existingGroup.order : groupOrder++,
        files
      };
      // Preserve links and description from existing catalog
      if (existingGroup && existingGroup.links && existingGroup.links.length > 0) {
        groupObj.links = existingGroup.links;
      }
      if (existingGroup && existingGroup.description) {
        groupObj.description = existingGroup.description;
      }
      groups.push(groupObj);
    }

    // Sort groups by order
    groups.sort((a, b) => a.order - b.order);
    // Normalize order values
    groups.forEach((g, i) => g.order = i + 1);

    categories.push({
      folder: catDir.name,
      displayName: existingCat ? existingCat.displayName : catDir.name,
      order: existingCat ? existingCat.order : catOrder++,
      groups
    });
  }
}

// Sort categories by order
categories.sort((a, b) => a.order - b.order);
categories.forEach((c, i) => c.order = i + 1);

// Build output
const catalog = {
  title: existingCatalog.title,
  repo: existingCatalog.repo,
  categories
};

// Write catalog.json
fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

// Summary
console.log(`\n✅ catalog.json 已更新`);
console.log(`   科目數：${categories.length}`);
categories.forEach(c => {
  const totalFiles = c.groups.reduce((sum, g) => sum + g.files.length, 0);
  const totalLinks = c.groups.reduce((sum, g) => sum + (g.links ? g.links.length : 0), 0);
  const linkInfo = totalLinks > 0 ? `，${totalLinks} 個連結` : '';
  console.log(`   - ${c.displayName}：${c.groups.length} 個組別，${totalFiles} 個檔案${linkInfo}`);
});
