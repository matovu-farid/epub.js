#!/usr/bin/env node

/**
 * Test script for getCurrentViewParagraphs() method
 * This script loads an EPUB and tests the paragraph extraction functionality
 */

const fs = require("fs");
const path = require("path");

// Mock browser environment for Node.js
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: "file://test" },
};

global.document = {
  createElement: () => ({
    style: {},
    appendChild: () => {},
    removeChild: () => {},
  }),
  createTextNode: () => ({ nodeValue: "" }),
  createRange: () => ({
    setStart: () => {},
    setEnd: () => {},
    toString: () => "",
    intersectsNode: () => false,
    cloneRange: () => ({
      setStart: () => {},
      setEnd: () => {},
      toString: () => "",
    }),
  }),
  createTreeWalker: () => ({
    nextNode: () => null,
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.navigator = {
  userAgent: "Node.js Test Environment",
};

// Load epub.js
try {
  // Try to load the built version first
  const epubPath = path.join(__dirname, "dist/epub.min.js");
  if (fs.existsSync(epubPath)) {
    console.log("Loading epub.js from dist/epub.min.js");
    require(epubPath);
  } else {
    // Fallback to src version
    console.log("Loading epub.js from src/epub.js");
    require("./src/epub.js");
  }
} catch (error) {
  console.error("Failed to load epub.js:", error.message);
  process.exit(1);
}

async function runTest() {
  console.log("🧪 Testing getCurrentViewParagraphs() method...\n");

  try {
    // Check if test file exists
    const testEpubPath = path.join(__dirname, "test/fixtures/alice.epub");
    if (!fs.existsSync(testEpubPath)) {
      console.error("❌ Test EPUB file not found at:", testEpubPath);
      console.log("Please ensure test/fixtures/alice.epub exists");
      return;
    }

    console.log("📚 Loading EPUB:", testEpubPath);

    // Create a mock book and rendition
    const book = new ePub(testEpubPath);

    // Wait for book to load
    await new Promise((resolve) => {
      book.ready.then(resolve);
    });

    console.log("✅ EPUB loaded successfully");

    // Create a mock rendition
    const rendition = book.renderTo("mock-container", {
      width: "600px",
      height: "400px",
      flow: "paginated",
    });

    // Mock the manager and views for testing
    if (!rendition.manager) {
      console.log(
        "⚠️  No manager available - this is expected in Node.js environment"
      );
      console.log("📝 Testing method signature and basic structure...");

      // Test that the method exists and has correct signature
      if (typeof rendition.getCurrentViewParagraphs === "function") {
        console.log("✅ getCurrentViewParagraphs() method exists");

        // Test that it returns null when no manager is available
        const result = rendition.getCurrentViewParagraphs();
        if (result === null) {
          console.log(
            "✅ Method correctly returns null when no manager is available"
          );
        } else {
          console.log(
            "❌ Method should return null when no manager is available, got:",
            typeof result
          );
        }
      } else {
        console.log("❌ getCurrentViewParagraphs() method does not exist");
      }

      // Test getCurrentViewText for comparison
      if (typeof rendition.getCurrentViewText === "function") {
        console.log("✅ getCurrentViewText() method exists");
        const textResult = rendition.getCurrentViewText();
        console.log(
          "📝 getCurrentViewText() returns:",
          typeof textResult,
          textResult === null ? "(null)" : ""
        );
      }

      console.log("\n🎯 Method implementation test completed");
      console.log(
        "💡 To test with actual EPUB content, run this in a browser environment"
      );
    } else {
      console.log("📖 Testing with actual EPUB content...");

      // Display the first section
      await rendition.display();

      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test getCurrentViewText
      console.log("\n🔍 Testing getCurrentViewText()...");
      const textResult = rendition.getCurrentViewText();

      if (textResult) {
        console.log("✅ getCurrentViewText() returned data");
        console.log("📊 Text length:", textResult.text.length, "characters");
        console.log("📊 Start CFI:", textResult.startCfi);
        console.log("📊 End CFI:", textResult.endCfi);
        console.log(
          "📝 Text preview:",
          textResult.text.substring(0, 100) + "..."
        );
      } else {
        console.log("❌ getCurrentViewText() returned null");
      }

      // Test getCurrentViewParagraphs
      console.log("\n🔍 Testing getCurrentViewParagraphs()...");
      const paragraphsResult = rendition.getCurrentViewParagraphs();

      if (paragraphsResult) {
        console.log("✅ getCurrentViewParagraphs() returned data");
        console.log("📊 Number of paragraphs:", paragraphsResult.length);

        // Show first few paragraphs
        paragraphsResult.slice(0, 3).forEach((paragraph, index) => {
          console.log(
            `📝 Paragraph ${index + 1}:`,
            paragraph.text.substring(0, 50) + "..."
          );
          console.log(`🔗 CFI:`, paragraph.cfi);
        });

        // Test if combined paragraphs match full text
        if (textResult && paragraphsResult.length > 0) {
          console.log("\n🧮 Testing text matching...");

          const combinedText = paragraphsResult.map((p) => p.text).join("");
          const normalizedFullText = textResult.text
            .replace(/\s+/g, " ")
            .trim();
          const normalizedCombinedText = combinedText
            .replace(/\s+/g, " ")
            .trim();

          if (normalizedFullText === normalizedCombinedText) {
            console.log(
              "✅ SUCCESS: Combined paragraphs match full text exactly!"
            );
            console.log("📊 Full text length:", normalizedFullText.length);
            console.log(
              "📊 Combined text length:",
              normalizedCombinedText.length
            );
          } else {
            console.log(
              "❌ MISMATCH: Combined paragraphs do not match full text"
            );
            console.log("📊 Full text length:", normalizedFullText.length);
            console.log(
              "📊 Combined text length:",
              normalizedCombinedText.length
            );
            console.log(
              "📊 Difference:",
              normalizedFullText.length - normalizedCombinedText.length,
              "characters"
            );

            // Show first difference
            const minLength = Math.min(
              normalizedFullText.length,
              normalizedCombinedText.length
            );
            for (let i = 0; i < minLength; i++) {
              if (normalizedFullText[i] !== normalizedCombinedText[i]) {
                console.log(`🔍 First difference at position ${i}:`);
                console.log(
                  `📝 Full: "${normalizedFullText.substring(
                    Math.max(0, i - 10),
                    i + 10
                  )}"`
                );
                console.log(
                  `📝 Combined: "${normalizedCombinedText.substring(
                    Math.max(0, i - 10),
                    i + 10
                  )}"`
                );
                break;
              }
            }
          }
        }
      } else {
        console.log("❌ getCurrentViewParagraphs() returned null");
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
runTest()
  .then(() => {
    console.log("\n🏁 Test completed");
  })
  .catch((error) => {
    console.error("💥 Test crashed:", error);
    process.exit(1);
  });
