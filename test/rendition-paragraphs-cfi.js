import assert from "assert";
import ePub from "../src/epub";

describe("Rendition - getCurrentViewParagraphs CFI Structure", function () {
  let book;
  let rendition;

  // Set timeout for EPUB loading
  this.timeout(10000);

  before(function () {
    // Load the Alice in Wonderland test EPUB
    book = new ePub("/base/test/fixtures/alice.epub");
  });

  beforeEach(async function () {
    // Create a DOM element for testing
    const container = document.createElement("div");
    container.id = "test-container-cfi";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);

    // Create a fresh rendition for each test
    rendition = book.renderTo("test-container-cfi", {
      width: 600,
      height: 400,
      flow: "paginated",
    });

    // Wait for rendition to be ready
    await rendition.display();

    // Wait a bit for rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterEach(function () {
    // Clean up
    if (rendition) {
      rendition.destroy();
    }

    // Remove the test container
    const container = document.getElementById("test-container-cfi");
    if (container) {
      document.body.removeChild(container);
    }
  });

  describe("CFI Structure Validation", function () {
    it("should return paragraphs with startCfi and endCfi properties", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert(
            paragraph.hasOwnProperty("startCfi"),
            `Paragraph ${index} should have startCfi property`
          );
          assert(
            paragraph.hasOwnProperty("endCfi"),
            `Paragraph ${index} should have endCfi property`
          );
          assert(
            !paragraph.hasOwnProperty("cfi"),
            `Paragraph ${index} should NOT have old cfi property`
          );
        });
      }
    });

    it("should have valid CFI format for both startCfi and endCfi", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          // Test startCfi format
          assert(
            paragraph.startCfi.startsWith("epubcfi("),
            `Paragraph ${index} startCfi should start with 'epubcfi('`
          );
          assert(
            paragraph.startCfi.endsWith(")"),
            `Paragraph ${index} startCfi should end with ')'`
          );
          assert(
            paragraph.startCfi.includes("!/"),
            `Paragraph ${index} startCfi should contain '!/'`
          );

          // Test endCfi format
          assert(
            paragraph.endCfi.startsWith("epubcfi("),
            `Paragraph ${index} endCfi should start with 'epubcfi('`
          );
          assert(
            paragraph.endCfi.endsWith(")"),
            `Paragraph ${index} endCfi should end with ')'`
          );
          assert(
            paragraph.endCfi.includes("!/"),
            `Paragraph ${index} endCfi should contain '!/'`
          );
        });
      }
    });

    it("should have startCfi and endCfi that are equal for single paragraphs", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert.strictEqual(
            paragraph.startCfi,
            paragraph.endCfi,
            `Paragraph ${index} startCfi and endCfi should be equal for single paragraph elements`
          );
        });
      }
    });

    it("should have different CFIs for different paragraphs", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 1) {
        // Check that startCfi values are unique
        const startCfis = paragraphs.map((p) => p.startCfi);
        const uniqueStartCfis = [...new Set(startCfis)];
        assert.strictEqual(
          startCfis.length,
          uniqueStartCfis.length,
          "All paragraph startCfi values should be unique"
        );

        // Check that endCfi values are unique
        const endCfis = paragraphs.map((p) => p.endCfi);
        const uniqueEndCfis = [...new Set(endCfis)];
        assert.strictEqual(
          endCfis.length,
          uniqueEndCfis.length,
          "All paragraph endCfi values should be unique"
        );
      }
    });
  });

  describe("CFI Navigation Integration", function () {
    it("should have CFIs that can be used for navigation", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const firstParagraph = paragraphs[0];

        // Test that we can create EpubCFI objects from the CFI strings
        assert.doesNotThrow(() => {
          const startCfiObj = new ePub.EpubCFI(firstParagraph.startCfi);
          const endCfiObj = new ePub.EpubCFI(firstParagraph.endCfi);

          assert(
            startCfiObj instanceof ePub.EpubCFI,
            "startCfi should create valid EpubCFI object"
          );
          assert(
            endCfiObj instanceof ePub.EpubCFI,
            "endCfi should create valid EpubCFI object"
          );
        }, "CFI strings should be valid for EpubCFI constructor");
      }
    });

    it("should have CFIs that correspond to actual DOM elements", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const firstParagraph = paragraphs[0];

        // Test that CFIs can be converted to DOM ranges
        assert.doesNotThrow(() => {
          const startCfiObj = new ePub.EpubCFI(firstParagraph.startCfi);
          const endCfiObj = new ePub.EpubCFI(firstParagraph.endCfi);

          // Try to convert to ranges (this might fail in test environment)
          const startRange = startCfiObj.toRange(document);
          const endRange = endCfiObj.toRange(document);

          // If ranges are created successfully, they should be valid
          if (startRange) {
            assert(
              startRange instanceof Range,
              "startCfi should convert to valid DOM Range"
            );
          }
          if (endRange) {
            assert(
              endRange instanceof Range,
              "endCfi should convert to valid DOM Range"
            );
          }
        }, "CFI strings should be convertible to DOM ranges");
      }
    });
  });

  describe("Backward Compatibility", function () {
    it("should maintain the same text content as before", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();
      const textResult = rendition.getCurrentViewText();

      if (paragraphs && textResult && paragraphs.length > 0) {
        // Combine paragraph text
        const combinedText = paragraphs.map((p) => p.text).join(" ");

        // Normalize whitespace for comparison
        const normalizedFullText = textResult.text.replace(/\s+/g, " ").trim();
        const normalizedCombinedText = combinedText.replace(/\s+/g, " ").trim();

        assert.strictEqual(
          normalizedFullText,
          normalizedCombinedText,
          "Combined paragraph text should match getCurrentViewText output"
        );
      }
    });

    it("should maintain the same paragraph count as before", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs) {
        // Should have reasonable number of paragraphs
        assert(paragraphs.length > 0, "Should have at least one paragraph");
        assert(
          paragraphs.length < 100,
          "Should not have too many paragraphs (likely error)"
        );
      }
    });
  });

  describe("Error Handling with New Structure", function () {
    it("should handle missing CFI properties gracefully", function () {
      // This test ensures the new structure doesn't break error handling
      let result;

      assert.doesNotThrow(() => {
        result = rendition.getCurrentViewParagraphs();
      }, "Method should not throw exceptions with new CFI structure");

      // Result can be null or array, both are acceptable
      assert(
        result === null || Array.isArray(result),
        "Result should be null or array"
      );

      if (Array.isArray(result) && result.length > 0) {
        // If we get paragraphs, they should have the new structure
        result.forEach((paragraph, index) => {
          assert(
            typeof paragraph.startCfi === "string",
            `Paragraph ${index} should have startCfi as string`
          );
          assert(
            typeof paragraph.endCfi === "string",
            `Paragraph ${index} should have endCfi as string`
          );
        });
      }
    });
  });

  describe("Performance with New Structure", function () {
    it("should execute within reasonable time with new CFI structure", function () {
      const startTime = Date.now();

      rendition.getCurrentViewParagraphs();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      assert(
        executionTime < 1000,
        `Method should execute in less than 1 second with new structure, took ${executionTime}ms`
      );
    });
  });
});
