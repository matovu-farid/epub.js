import assert from "assert";
import ePub from "../src/epub";

describe("Rendition - getCurrentViewParagraphs", function () {
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
    container.id = "test-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);

    // Create a fresh rendition for each test
    rendition = book.renderTo("test-container", {
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
    const container = document.getElementById("test-container");
    if (container) {
      document.body.removeChild(container);
    }
  });

  describe("Method Existence", function () {
    it("should have getCurrentViewParagraphs method", function () {
      assert(
        typeof rendition.getCurrentViewParagraphs === "function",
        "getCurrentViewParagraphs should be a function"
      );
    });

    it("should have getCurrentViewText method for comparison", function () {
      assert(
        typeof rendition.getCurrentViewText === "function",
        "getCurrentViewText should be a function"
      );
    });
  });

  describe("Method Behavior", function () {
    it("should return null when no manager is available", function () {
      // Create a DOM element for the second test
      const container2 = document.createElement("div");
      container2.id = "test-container-2";
      container2.style.width = "600px";
      container2.style.height = "400px";
      document.body.appendChild(container2);

      // Create a rendition without manager (don't call display)
      const renditionWithoutManager = book.renderTo("test-container-2", {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      const result = renditionWithoutManager.getCurrentViewParagraphs();
      assert.strictEqual(result, null, "Should return null when no manager");

      renditionWithoutManager.destroy();
      document.body.removeChild(container2);
    });

    it("should return array when manager is available", function () {
      const result = rendition.getCurrentViewParagraphs();

      assert(
        result !== null,
        "Should not return null when manager is available"
      );
      assert(Array.isArray(result), "Should return an array");
    });
  });

  describe("Paragraph Structure", function () {
    it("should return paragraphs with correct structure", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const paragraph = paragraphs[0];

        assert(typeof paragraph === "object", "Paragraph should be an object");
        assert(
          typeof paragraph.text === "string",
          "Paragraph should have text property"
        );
        assert(
          typeof paragraph.cfi === "string",
          "Paragraph should have cfi property"
        );
        assert(paragraph.text.length > 0, "Paragraph text should not be empty");
        assert(paragraph.cfi.length > 0, "Paragraph CFI should not be empty");
      }
    });

    it("should exclude empty paragraphs", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert(
            paragraph.text.trim().length > 0,
            `Paragraph ${index} should not be empty or whitespace-only`
          );
        });
      }
    });
  });

  describe("Text Consistency", function () {
    it("should return paragraphs that combine to match getCurrentViewText", function () {
      const textResult = rendition.getCurrentViewText();
      const paragraphsResult = rendition.getCurrentViewParagraphs();

      if (textResult && paragraphsResult && paragraphsResult.length > 0) {
        // Combine all paragraph text with single spaces between paragraphs
        // This simulates how the text would look when paragraphs are separated
        const combinedText = paragraphsResult.map((p) => p.text).join(" ");

        // Normalize whitespace for comparison - both should have the same content
        // but getCurrentViewText may have different spacing due to DOM structure
        const normalizedFullText = textResult.text.replace(/\s+/g, " ").trim();
        const normalizedCombinedText = combinedText.replace(/\s+/g, " ").trim();

        // The combined text should contain the same words/content as the full text
        // We'll compare by checking if the normalized versions match
        assert.strictEqual(
          normalizedFullText,
          normalizedCombinedText,
          "Combined paragraph text should match getCurrentViewText output"
        );
      }
    });

    it("should have reasonable paragraph count", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs) {
        assert(paragraphs.length > 0, "Should have at least one paragraph");
        assert(
          paragraphs.length < 100,
          "Should not have too many paragraphs (likely error)"
        );
      }
    });
  });

  describe("CFI Generation", function () {
    it("should generate valid CFI for each paragraph", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert(
            paragraph.cfi.startsWith("epubcfi"),
            `Paragraph ${index} CFI should start with 'epubcfi'`
          );
          assert(
            paragraph.cfi.includes("!/"),
            `Paragraph ${index} CFI should contain '!/'`
          );
        });
      }
    });

    it("should have unique CFIs for different paragraphs", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 1) {
        const cfis = paragraphs.map((p) => p.cfi);
        const uniqueCfis = [...new Set(cfis)];

        assert.strictEqual(
          cfis.length,
          uniqueCfis.length,
          "All paragraph CFIs should be unique"
        );
      }
    });
  });

  describe("Error Handling", function () {
    it("should handle errors gracefully", function () {
      // This test ensures the method doesn't throw unhandled exceptions
      let result;

      assert.doesNotThrow(() => {
        result = rendition.getCurrentViewParagraphs();
      }, "Method should not throw exceptions");

      // Result can be null or array, both are acceptable
      assert(
        result === null || Array.isArray(result),
        "Result should be null or array"
      );
    });
  });

  describe("Performance", function () {
    it("should execute within reasonable time", function () {
      const startTime = Date.now();

      rendition.getCurrentViewParagraphs();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      assert(
        executionTime < 1000,
        `Method should execute in less than 1 second, took ${executionTime}ms`
      );
    });
  });

  describe("Integration with Navigation", function () {
    it("should return different paragraphs when navigating to different sections", async function () {
      const initialParagraphs = rendition.getCurrentViewParagraphs();

      if (initialParagraphs && initialParagraphs.length > 0) {
        // Navigate to next section if available
        if (book.spine.length > 1) {
          await rendition.next();
          await new Promise((resolve) => setTimeout(resolve, 500));

          const nextParagraphs = rendition.getCurrentViewParagraphs();

          if (nextParagraphs && nextParagraphs.length > 0) {
            // Paragraphs should be different (different content)
            const initialText = initialParagraphs.map((p) => p.text).join("");
            const nextText = nextParagraphs.map((p) => p.text).join("");

            assert.notStrictEqual(
              initialText,
              nextText,
              "Paragraphs should be different when navigating to different sections"
            );
          }
        }
      }
    });
  });
});
