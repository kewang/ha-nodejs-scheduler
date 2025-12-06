const fs = require("fs");
const path = require("path");

const pkg = require("./package.json");
const configPath = path.join(__dirname, "config.yaml");

try {
  const config = fs.readFileSync(configPath, "utf8");
  const updatedConfig = config.replace(/^version:.*$/m, `version: "${pkg.version}"`);
  
  fs.writeFileSync(configPath, updatedConfig);
  
  console.log(`✓ Version synced: ${pkg.version}`);
  console.log(`  - package.json: ${pkg.version}`);
  console.log(`  - config.yaml: ${pkg.version}`);
} catch (error) {
  console.error("✗ Failed to sync version:", error.message);
  process.exit(1);
}
