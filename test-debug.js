#!/usr/bin/env node

/**
 * Debug test to identify why getCurrentViewParagraphs() returns no paragraphs
 */

console.log("🔍 Debug test for getCurrentViewParagraphs()...\n");

// Create a simple mock to test the core logic
function createSimpleMock() {
  // Mock text node
  class MockTextNode {
    constructor(text) {
      this.textContent = text;
      this.nodeType = 3; // TEXT_NODE
      this.parentElement = null;
    }
  }

  // Mock element
  class MockElement {
    constructor(tagName, textContent = "") {
      this.tagName = tagName.toLowerCase();
      this.textContent = textContent;
      this.children = [];
      this.parentElement = null;
      this.nodeType = 1; // ELEMENT_NODE
    }

    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
    }

    matches(selectors) {
      const selectorList = selectors.split(", ").map((s) => s.trim());
      return selectorList.includes(this.tagName);
    }
  }

  // Mock document
  class MockDocument {
    constructor() {
      this.body = new MockElement("body");

      // Create some test content
      const p1 = new MockElement("p", "First paragraph text.");
      const p2 = new MockElement("div", "Second paragraph in div.");
      const p3 = new MockElement("h1", "Heading text.");

      this.body.appendChild(p1);
      this.body.appendChild(p2);
      this.body.appendChild(p3);

      console.log(
        "📝 Created mock document with elements:",
        this.body.children.map((c) => c.tagName)
      );
    }

    createRange() {
      const self = this;
      return {
        setStart: (container, offset) => {
          console.log("📍 Range setStart called");
        },
        setEnd: (container, offset) => {
          console.log("📍 Range setEnd called");
        },
        toString: () => {
          console.log("📍 Range toString called");
          return "First paragraph text. Second paragraph in div. Heading text.";
        },
        intersectsNode: (node) => {
          console.log(
            "📍 intersectsNode called for node:",
            node.tagName || "text"
          );
          return true; // Always intersect for testing
        },
        commonAncestorContainer: this.body,
        startContainer: this.body,
        startOffset: 0,
        endContainer: this.body,
        endOffset: 10,
      };
    }

    createTreeWalker(root, whatToShow, filter) {
      console.log("🌳 createTreeWalker called");
      console.log("   Root:", root.tagName || "unknown");
      console.log("   WhatToShow:", whatToShow);

      // Create mock text nodes
      const textNodes = [
        new MockTextNode("First paragraph text."),
        new MockTextNode("Second paragraph in div."),
        new MockTextNode("Heading text."),
      ];

      // Set parent elements for text nodes
      textNodes[0].parentElement = root.children[0]; // p element
      textNodes[1].parentElement = root.children[1]; // div element
      textNodes[2].parentElement = root.children[2]; // h1 element

      console.log("   Created", textNodes.length, "mock text nodes");

      let index = 0;
      return {
        nextNode: () => {
          if (index < textNodes.length) {
            const node = textNodes[index++];
            console.log("   NextNode:", node.textContent);
            return node;
          }
          console.log("   NextNode: null (end)");
          return null;
        },
      };
    }
  }

  return MockDocument;
}

// Test the core logic step by step
function testCoreLogic() {
  console.log("🧪 Testing core logic step by step...\n");

  const MockDocument = createSimpleMock();
  const document = new MockDocument();

  // Test 1: Range creation and toString
  console.log("🔍 Test 1: Range creation");
  const range = document.createRange();
  const fullText = range.toString();
  console.log("✅ Range toString result:", fullText);

  // Test 2: TreeWalker
  console.log("\n🔍 Test 2: TreeWalker");
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    4, // NodeFilter.SHOW_TEXT
    {
      acceptNode: function (node) {
        console.log("   AcceptNode called for:", node.textContent);
        return range.intersectsNode(node) ? 1 : 2; // FILTER_ACCEPT : FILTER_REJECT
      },
    }
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  console.log("✅ Collected text nodes:", textNodes.length);

  // Test 3: Block element finding
  console.log("\n🔍 Test 3: Block element finding");
  function findContainingBlockElement(textNode) {
    const blockSelectors =
      "p, div, h1, h2, h3, h4, h5, h6, li, blockquote, pre, article, section, aside, header, footer, main, nav, figure, figcaption, dd, dt";

    let element = textNode.parentElement;
    console.log("   Starting from parent:", element ? element.tagName : "null");

    while (element) {
      try {
        if (element.matches && element.matches(blockSelectors)) {
          console.log("   Found block element:", element.tagName);
          return element;
        }
      } catch (e) {
        console.log("   Matches error:", e.message);
      }
      element = element.parentElement;
      console.log("   Moving to parent:", element ? element.tagName : "null");
    }

    console.log("   No block element found");
    return null;
  }

  const blockElementMap = new Map();
  for (const textNode of textNodes) {
    const blockElement = findContainingBlockElement(textNode);
    if (blockElement) {
      if (!blockElementMap.has(blockElement)) {
        blockElementMap.set(blockElement, []);
      }
      blockElementMap.get(blockElement).push(textNode);
    }
  }

  console.log("✅ Block element map size:", blockElementMap.size);

  // Test 4: Paragraph creation
  console.log("\n🔍 Test 4: Paragraph creation");
  const paragraphs = [];
  for (const [blockElement, textNodes] of blockElementMap) {
    let elementText = "";

    for (const textNode of textNodes) {
      const nodeText = textNode.textContent || "";
      console.log("   Processing text node:", nodeText);

      if (textNode === range.startContainer) {
        elementText += nodeText.substring(range.startOffset);
      } else if (textNode === range.endContainer) {
        elementText += nodeText.substring(0, range.endOffset);
      } else {
        elementText += nodeText;
      }
    }

    elementText = elementText.trim();
    console.log("   Final element text:", elementText);

    if (elementText) {
      paragraphs.push({
        text: elementText,
        cfi: `mock-cfi-${blockElement.tagName}`,
      });
    }
  }

  console.log("✅ Final paragraphs:", paragraphs.length);
  paragraphs.forEach((p, i) => {
    console.log(`   Paragraph ${i + 1}: "${p.text}"`);
  });

  return paragraphs;
}

// Run the debug test
try {
  const paragraphs = testCoreLogic();

  console.log("\n📊 Debug Test Results:");
  console.log(`✅ Paragraphs found: ${paragraphs.length}`);

  if (paragraphs.length > 0) {
    console.log("🎉 SUCCESS: Core logic is working!");
    console.log(
      "💡 The issue might be in the integration with the actual epub.js environment."
    );
  } else {
    console.log("❌ ISSUE: No paragraphs found in core logic test.");
    console.log("💡 This indicates a problem with the basic algorithm.");
  }
} catch (error) {
  console.error("💥 Debug test failed:", error.message);
  console.error("Stack trace:", error.stack);
}

console.log("\n🏁 Debug test completed");
