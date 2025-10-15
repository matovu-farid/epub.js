#!/usr/bin/env node

/**
 * Test script to verify getCurrentViewParagraphs() method structure and basic functionality
 * This tests the method implementation without requiring a full EPUB environment
 */

console.log("🧪 Testing getCurrentViewParagraphs() method structure...\n");

// Read the rendition.js file to check if our method exists
const fs = require("fs");
const path = require("path");

const renditionPath = path.join(__dirname, "src/rendition.js");
const typesPath = path.join(__dirname, "types/rendition.d.ts");

console.log("📁 Checking source files...");

// Check if rendition.js exists
if (!fs.existsSync(renditionPath)) {
  console.error("❌ src/rendition.js not found");
  process.exit(1);
}

// Check if types file exists
if (!fs.existsSync(typesPath)) {
  console.error("❌ types/rendition.d.ts not found");
  process.exit(1);
}

console.log("✅ Source files found");

// Read the rendition.js file
const renditionContent = fs.readFileSync(renditionPath, "utf8");
const typesContent = fs.readFileSync(typesPath, "utf8");

console.log("📖 Analyzing rendition.js...");

// Check for getCurrentViewParagraphs method
const hasGetCurrentViewParagraphs = renditionContent.includes(
  "getCurrentViewParagraphs()"
);
const hasGetCurrentViewText = renditionContent.includes("getCurrentViewText()");

console.log("🔍 Method presence check:");
console.log(
  "  getCurrentViewText():",
  hasGetCurrentViewText ? "✅ Found" : "❌ Not found"
);
console.log(
  "  getCurrentViewParagraphs():",
  hasGetCurrentViewParagraphs ? "✅ Found" : "❌ Not found"
);

if (!hasGetCurrentViewParagraphs) {
  console.error(
    "❌ getCurrentViewParagraphs() method not found in rendition.js"
  );
  process.exit(1);
}

// Check for helper methods
const hasGetParagraphsFromRange = renditionContent.includes(
  "_getParagraphsFromRange("
);
const hasGetTextNodesInRange = renditionContent.includes(
  "_getTextNodesInRange("
);
const hasFindContainingBlockElement = renditionContent.includes(
  "_findContainingBlockElement("
);

console.log("\n🔧 Helper methods check:");
console.log(
  "  _getParagraphsFromRange():",
  hasGetParagraphsFromRange ? "✅ Found" : "❌ Not found"
);
console.log(
  "  _getTextNodesInRange():",
  hasGetTextNodesInRange ? "✅ Found" : "❌ Not found"
);
console.log(
  "  _findContainingBlockElement():",
  hasFindContainingBlockElement ? "✅ Found" : "❌ Not found"
);

// Check TypeScript definition
console.log("\n📝 TypeScript definition check:");
const hasTypescriptDefinition = typesContent.includes(
  "getCurrentViewParagraphs(): Array<{ text: string; cfi: string }> | null;"
);
console.log(
  "  TypeScript definition:",
  hasTypescriptDefinition ? "✅ Found" : "❌ Not found"
);

// Check method structure
console.log("\n🏗️  Method structure analysis:");

// Extract the method content
const methodMatch = renditionContent.match(
  /getCurrentViewParagraphs\(\)\s*\{[\s\S]*?\n\s*\}/
);
if (methodMatch) {
  const methodContent = methodMatch[0];

  // Check for key components
  const checks = [
    { name: "Manager check", pattern: /if \(!this\.manager\)/, found: false },
    {
      name: "Location retrieval",
      pattern: /manager\.currentLocation\(\)/,
      found: false,
    },
    { name: "CFI range creation", pattern: /new EpubCFI\(/, found: false },
    { name: "Range creation", pattern: /createRange\(\)/, found: false },
    {
      name: "Helper method call",
      pattern: /_getParagraphsFromRange\(/,
      found: false,
    },
    { name: "Error handling", pattern: /catch \(e\)/, found: false },
    { name: "Return paragraphs", pattern: /return paragraphs/, found: false },
  ];

  checks.forEach((check) => {
    check.found = check.pattern.test(methodContent);
    console.log(`  ${check.name}:`, check.found ? "✅ Found" : "❌ Not found");
  });

  // Count lines in method
  const lines = methodContent.split("\n").length;
  console.log(`  Method length: ${lines} lines`);
} else {
  console.log("❌ Could not extract method content");
}

// Check for documentation files
console.log("\n📚 Documentation check:");

const docFiles = [
  "GET_CURRENT_PARAGRAPHS.md",
  "PARAGRAPHS_IMPLEMENTATION_SUMMARY.md",
  "test-paragraphs.html",
  "test-paragraphs-simple.html",
];

docFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}:`, exists ? "✅ Found" : "❌ Not found");
});

// Check for potential issues
console.log("\n🔍 Potential issues check:");

const issues = [];

// Check for common problems
if (
  renditionContent.includes("element.textContent.trim()") &&
  !renditionContent.includes("element.textContent ? element.textContent.trim()")
) {
  issues.push("Potential null reference: element.textContent might be null");
}

if (
  renditionContent.includes("range.commonAncestorContainer.ownerDocument") &&
  !renditionContent.includes("if (!document)")
) {
  issues.push("Potential null reference: ownerDocument might be null");
}

if (
  renditionContent.includes("cfi.toString()") &&
  renditionContent.includes("const cfi = contents.cfiFromNode(element)")
) {
  // This is actually good - we're converting CFI to string
} else if (
  renditionContent.includes("contents.cfiFromNode(element)") &&
  !renditionContent.includes(".toString()")
) {
  issues.push("CFI not converted to string - should call .toString()");
}

if (issues.length === 0) {
  console.log("✅ No obvious issues found");
} else {
  issues.forEach((issue) => {
    console.log(`⚠️  ${issue}`);
  });
}

// Summary
console.log("\n📊 Summary:");

const allChecks = [
  hasGetCurrentViewParagraphs,
  hasGetParagraphsFromRange,
  hasGetTextNodesInRange,
  hasFindContainingBlockElement,
  hasTypescriptDefinition,
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log(
    "🎉 All checks passed! The getCurrentViewParagraphs() method appears to be properly implemented."
  );
  console.log("\n💡 Next steps:");
  console.log("  1. Test in browser environment with actual EPUB");
  console.log("  2. Verify paragraph text matches getCurrentViewText() output");
  console.log("  3. Test with different EPUB layouts and content types");
} else {
  console.log("⚠️  Some checks failed. Please review the implementation.");
}

console.log("\n🏁 Structure test completed");
