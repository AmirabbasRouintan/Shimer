// scripts/fix-svg-fill.js
const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "assets", "icons");

fs.readdirSync(iconsDir).forEach((file) => {
  if (!file.endsWith(".svg")) return;
  const filePath = path.join(iconsDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Replace any fill="#..." or fill="name" with fill="currentColor"
  content = content.replace(/fill="[^"]*"/gi, 'fill="currentColor"');
  // Also handle inline styles like fill:#aabbcc
  content = content.replace(/fill:#[A-Fa-f0-9]{3,6}/gi, "fill:currentColor");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Fixed ${file}`);
});

console.log("Done. All SVGs now use currentColor.");
