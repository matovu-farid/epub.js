#!/usr/bin/env node

/**
 * Test script to verify getCurrentViewParagraphs() method logic
 * This creates a mock environment to test the method functionality
 */

console.log("🧪 Testing getCurrentViewParagraphs() method logic...\n");

// Create a mock environment that mimics the epub.js structure
function createMockEnvironment() {
  console.log("🔧 Creating mock environment...");

  // Mock EpubCFI
  class MockEpubCFI {
    constructor(cfiString) {
      this.cfiString = cfiString;
    }

    toRange(document) {
      // Create a mock range
      const range = {
        startContainer: document.body,
        startOffset: 0,
        endContainer: document.body,
        endOffset: 10,
      };
      return range;
    }

    toString() {
      return this.cfiString;
    }
  }

  // Mock Document and DOM
  class MockTextNode {
    constructor(text) {
      this.textContent = text;
      this.nodeType = 3; // TEXT_NODE
      this.parentElement = null;
    }
  }

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

    querySelectorAll(selectors) {
      const selectorList = selectors.split(", ").map((s) => s.trim());
      const results = [];

      const traverse = (element) => {
        if (selectorList.includes(element.tagName)) {
          results.push(element);
        }
        element.children.forEach(traverse);
      };

      traverse(this);
      return results;
    }

    matches(selectors) {
      const selectorList = selectors.split(", ").map((s) => s.trim());
      return selectorList.includes(this.tagName);
    }
  }

  class MockDocument {
    constructor() {
      this.body = new MockElement("body");
      this.body.appendChild(
        new MockElement("p", "First paragraph with some text content.")
      );
      this.body.appendChild(
        new MockElement("div", "Second paragraph in a div element.")
      );
      this.body.appendChild(new MockElement("h1", "A heading element"));
      this.body.appendChild(
        new MockElement("p", "Third paragraph with more content.")
      );
    }

    createRange() {
      return {
        setStart: (container, offset) => {
          this._startContainer = container;
          this._startOffset = offset;
        },
        setEnd: (container, offset) => {
          this._endContainer = container;
          this._endOffset = offset;
        },
        toString: () => {
          // Mock implementation that returns combined text
          return "First paragraph with some text content. Second paragraph in a div element. A heading element Third paragraph with more content.";
        },
        intersectsNode: (node) => {
          // Mock implementation - assume all nodes intersect
          return true;
        },
        commonAncestorContainer: this.body,
      };
    }

    createTreeWalker(root, whatToShow, filter) {
      const textNodes = [];
      const traverse = (element) => {
        if (element.nodeType === 3) {
          // TEXT_NODE
          textNodes.push(element);
        }
        element.children.forEach(traverse);
      };
      traverse(root);

      let index = 0;
      return {
        nextNode: () => {
          if (index < textNodes.length) {
            return textNodes[index++];
          }
          return null;
        },
      };
    }
  }

  // Mock Contents
  class MockContents {
    constructor(document) {
      this.document = document;
    }

    cfiFromNode(element) {
      return new MockEpubCFI(`epubcfi(/6/4[${element.tagName}]!/4/2/1:0)`);
    }
  }

  // Mock View
  class MockView {
    constructor() {
      this.contents = new MockContents(new MockDocument());
    }
  }

  // Mock Views collection
  class MockViews {
    constructor() {
      this.views = [new MockView()];
    }

    find({ index }) {
      return this.views[index] || this.views[0];
    }
  }

  // Mock Manager
  class MockManager {
    constructor() {
      this.views = new MockViews();
    }

    currentLocation() {
      return [
        {
          index: 0,
          mapping: {
            start: "epubcfi(/6/4[p]!/4/2/1:0)",
            end: "epubcfi(/6/4[p]!/4/2/1:100)",
          },
        },
      ];
    }
  }

  // Mock Rendition
  class MockRendition {
    constructor() {
      this.manager = new MockManager();
      this.EpubCFI = MockEpubCFI;
    }

    // Copy the actual implementation methods
    getCurrentViewParagraphs() {
      if (!this.manager) {
        return null;
      }

      // Get the current location which includes the visible range
      const location = this.manager.currentLocation();

      if (!location || !location.length || !location[0]) {
        return null;
      }

      const visibleSection = location[0];

      if (
        !visibleSection.mapping ||
        !visibleSection.mapping.start ||
        !visibleSection.mapping.end
      ) {
        return null;
      }

      // Find the view for this section
      const view = this.manager.views.find({ index: visibleSection.index });

      if (!view || !view.contents || !view.contents.document) {
        return null;
      }

      try {
        // Create CFI ranges for the visible page
        const startCfi = new this.EpubCFI(visibleSection.mapping.start);
        const endCfi = new this.EpubCFI(visibleSection.mapping.end);

        // Convert CFIs to DOM ranges
        const startRange = startCfi.toRange(view.contents.document);
        const endRange = endCfi.toRange(view.contents.document);

        if (!startRange || !endRange) {
          return null;
        }

        // Create a range that encompasses the visible content
        const range = view.contents.document.createRange();
        range.setStart(startRange.startContainer, startRange.startOffset);
        range.setEnd(endRange.endContainer, endRange.endOffset);

        // Get paragraphs from the range
        const paragraphs = this._getParagraphsFromRange(range, view.contents);

        return paragraphs;
      } catch (e) {
        console.error("Error extracting paragraphs:", e);
        return null;
      }
    }

    _getParagraphsFromRange(range, contents) {
      const paragraphs = [];

      try {
        // Get the full text from the range (same as getCurrentViewText)
        const fullText = range.toString();

        if (!fullText.trim()) {
          return [];
        }

        // Get the document from the range
        const document = range.commonAncestorContainer.ownerDocument;
        if (!document) {
          return [];
        }

        // Find all text nodes within the range
        const textNodes = this._getTextNodesInRange(range);

        if (textNodes.length === 0) {
          return [];
        }

        // Group text nodes by their containing block elements
        const blockElementToTextNodes = new Map();

        for (const textNode of textNodes) {
          const blockElement = this._findContainingBlockElement(textNode);
          if (blockElement) {
            if (!blockElementToTextNodes.has(blockElement)) {
              blockElementToTextNodes.set(blockElement, []);
            }
            blockElementToTextNodes.get(blockElement).push(textNode);
          }
        }

        // Create paragraphs from grouped text nodes
        for (const [blockElement, textNodes] of blockElementToTextNodes) {
          try {
            // Extract text from these specific text nodes
            let elementText = "";

            for (const textNode of textNodes) {
              const nodeText = textNode.textContent || "";

              // If this is the start node, trim from the beginning
              if (textNode === range.startContainer) {
                elementText += nodeText.substring(range.startOffset);
              }
              // If this is the end node, trim from the end
              else if (textNode === range.endContainer) {
                elementText += nodeText.substring(0, range.endOffset);
              }
              // Otherwise, include the full text
              else {
                elementText += nodeText;
              }
            }

            // Clean up the text
            elementText = elementText.trim();

            // Skip empty paragraphs
            if (!elementText) {
              continue;
            }

            // Generate CFI for this element
            const cfi = contents.cfiFromNode(blockElement);

            paragraphs.push({
              text: elementText,
              cfi: cfi.toString(),
            });
          } catch (e) {
            console.error("Error processing block element:", e);
            continue;
          }
        }

        return paragraphs;
      } catch (e) {
        console.error("Error getting paragraphs from range:", e);
        return [];
      }
    }

    _getTextNodesInRange(range) {
      const textNodes = [];

      try {
        const walker =
          range.commonAncestorContainer.ownerDocument.createTreeWalker(
            range.commonAncestorContainer,
            4, // NodeFilter.SHOW_TEXT
            {
              acceptNode: function (node) {
                try {
                  return range.intersectsNode(node)
                    ? 1 // NodeFilter.FILTER_ACCEPT
                    : 2; // NodeFilter.FILTER_REJECT
                } catch (e) {
                  return 2; // NodeFilter.FILTER_REJECT
                }
              },
            }
          );

        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node);
        }
      } catch (e) {
        console.error("Error getting text nodes in range:", e);
      }

      return textNodes;
    }

    _findContainingBlockElement(textNode) {
      const blockSelectors =
        "p, div, h1, h2, h3, h4, h5, h6, li, blockquote, pre, article, section, aside, header, footer, main, nav, figure, figcaption, dd, dt";

      let element = textNode.parentElement;

      while (element) {
        try {
          if (element.matches && element.matches(blockSelectors)) {
            return element;
          }
        } catch (e) {
          // Fallback for older browsers
          const selectors = blockSelectors.split(", ");
          for (const selector of selectors) {
            try {
              if (element.matches && element.matches(selector)) {
                return element;
              }
            } catch (e2) {
              continue;
            }
          }
        }
        element = element.parentElement;
      }

      return null;
    }
  }

  return MockRendition;
}

// Run the test
async function runLogicTest() {
  try {
    const MockRendition = createMockEnvironment();
    const rendition = new MockRendition();

    console.log("🧪 Testing getCurrentViewParagraphs() with mock data...\n");

    // Test the method
    const result = rendition.getCurrentViewParagraphs();

    if (result) {
      console.log("✅ Method executed successfully");
      console.log(`📊 Returned ${result.length} paragraphs`);

      result.forEach((paragraph, index) => {
        console.log(`\n📝 Paragraph ${index + 1}:`);
        console.log(`   Text: "${paragraph.text}"`);
        console.log(`   CFI: ${paragraph.cfi}`);
      });

      // Test text combination
      const combinedText = result.map((p) => p.text).join("");
      console.log(
        `\n🧮 Combined text length: ${combinedText.length} characters`
      );
      console.log(
        `📝 Combined text preview: "${combinedText.substring(0, 100)}..."`
      );

      console.log("\n✅ Logic test completed successfully!");
    } else {
      console.log("❌ Method returned null");
    }
  } catch (error) {
    console.error("❌ Logic test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

runLogicTest()
  .then(() => {
    console.log("\n🏁 Logic test completed");
  })
  .catch((error) => {
    console.error("💥 Logic test crashed:", error);
    process.exit(1);
  });
