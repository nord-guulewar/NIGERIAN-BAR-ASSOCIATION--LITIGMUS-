const fs = require('fs');
const path = require('path');

// Read the broken admin.js file
const brokenPath = path.join(__dirname, 'routes', 'admin.js.broken');
const outputPath = path.join(__dirname, 'routes', 'admin.js');

let content = fs.readFileSync(brokenPath, 'utf8');

// Pattern 1: Remove middleware declarations from inside res.status().json({ calls
// These patterns were incorrectly inserted into JSON response objects
const badPatterns = [
  /res\.status\(200\)\.json\(\{\s*protect,\s*authorize\(['"]admin['"]\),\s*validateParams\([^)]*\),\s*userRateLimit\([^)]*\),?\s*/g,
  /res\.status\(200\)\.json\(\{\s*protect,\s*authorize\(['"]admin['"]\),\s*validateParams\([^)]*\),\s*/g,
  /res\.status\(200\)\.json\(\{\s*protect,\s*userRateLimit\([^)]*\),\s*validateRequestBody\([^}]+\}\),?\s*/g,
  /res\.status\(200\)\.json\(\{\s*protect,\s*authorize\(['"]admin['"]\),\s*userRateLimit\([^)]*\),\s*validateRequestBody\([^}]+\}\),?\s*/g,
  /res\.status\(200\)\.json\(\{\s*protect,?\s*/g,
];

// Pattern 2: Remove middleware declarations from within catch blocks
const catchBadPatterns = [
  /catch\s*\(error\)\s*\{\s*res\.status\(500\)\.json\(\{\s*success:\s*false,\s*protect,\s*[^}]+\}\s*\}\)/g,
  /\}\s*catch\s*\(error\)\s*\{\s*protect,\s*authorize\([^}]+\}\s*\}\)/g,
];

// Fix: Replace with clean res.status().json({
badPatterns.forEach(pattern => {
  content = content.replace(pattern, 'res.status(200).json({\n    ');
});

catchBadPatterns.forEach(pattern => {
  content = content.replace(pattern, 'catch (error) {\n    res.status(500).json({ success: false, message: error.message });\n  }');
});

// Pattern 3: Remove isolated middleware declarations between routes
content = content.replace(/\n\s+protect,\s*\n\s+authorize\(['"]admin['"]\),\s*\n\s+validateParams\([^)]*\),?\s*\n\s+userRateLimit\([^)]*\),?\s*\n\s+validateRequestBody\([^}]+\}\),?\s*\n\s*\n/g, '\n\n');
content = content.replace(/\n\s+protect,\s*\n\s+authorize\(['"]admin['"]\),\s*\n\s+validateParams\([^)]*\),?\s*\n\s*\n/g, '\n\n');
content = content.replace(/\n\s+protect,\s*\n\s+userRateLimit\([^)]*\),?\s*\n\s+validateRequestBody\([^}]+\}\),?\s*\n\s*\n/g, '\n\n');

// Write the fixed content
fs.writeFileSync(outputPath, content, 'utf8');

console.log('✓ Fixed admin.js - removed corrupted middleware declarations');
console.log(`  Input: ${brokenPath}`);
console.log(`  Output: ${outputPath}`);
console.log('\nPlease test the server now with: npm run dev');
