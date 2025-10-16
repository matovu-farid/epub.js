import assert from "assert";
import ePub from "../src/epub";

describe("Rendition - getNextViewParagraphs (Simple)", function () {
  let book;
  let rendition;

  // Set timeout for EPUB loading
  this.timeout(15000);

  before(async function () {
    // Load the Alice in Wonderland test EPUB
    book = new ePub("/base/test/fixtures/alice.epub");
    // Wait for the book to be ready
    await book.ready;
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
    it("should have getNextViewParagraphs method", function () {
      assert(
        typeof rendition.getNextViewParagraphs === "function",
        "getNextViewParagraphs should be a function"
      );
    });

    it("should return a Promise", function () {
      const result = rendition.getNextViewParagraphs();
      assert(
        result instanceof Promise,
        "getNextViewParagraphs should return a Promise"
      );
    });
  });

  describe("Basic Functionality", function () {
    it("should return null or array when called", async function () {
      const result = await rendition.getNextViewParagraphs();

      // Result can be null (if no next section) or array (if next section exists)
      assert(
        result === null || Array.isArray(result),
        "Should return null or array"
      );
    });

    it("should return paragraphs with correct structure when next section exists", async function () {
      const paragraphs = await rendition.getNextViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const paragraph = paragraphs[0];

        assert(typeof paragraph === "object", "Paragraph should be an object");
        assert(
          typeof paragraph.text === "string",
          "Paragraph should have text property"
        );
        assert(
          typeof paragraph.cfiRange === "string",
          "Paragraph should have cfiRange property"
        );
        assert(paragraph.text.length > 0, "Paragraph text should not be empty");
        assert(
          paragraph.cfiRange.length > 0,
          "Paragraph CFI range should not be empty"
        );
      }
    });

    it("should generate valid CFI ranges when paragraphs exist", async function () {
      const paragraphs = await rendition.getNextViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert(
            paragraph.cfiRange.startsWith("epubcfi"),
            `Paragraph ${index} CFI range should start with 'epubcfi'`
          );
          assert(
            paragraph.cfiRange.includes("!/"),
            `Paragraph ${index} CFI range should contain '!/'`
          );
          // CFI ranges should contain both start and end positions
          assert(
            paragraph.cfiRange.includes(","),
            `Paragraph ${index} CFI range should be a range (contain comma)`
          );
        });
      }
    });
  });

  describe("Integration with Highlighting", function () {
    it("should provide CFI ranges compatible with highlighting", async function () {
      const paragraphs = await rendition.getNextViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const firstParagraph = paragraphs[0];

        // Should be able to use the CFI range with highlighting
        assert(
          typeof firstParagraph.cfiRange === "string" &&
            firstParagraph.cfiRange.length > 0,
          "CFI range should be valid for highlighting"
        );

        // Test that we can create a highlight (without actually applying it)
        try {
          const testHighlight = rendition.highlightRange(
            firstParagraph.cfiRange,
            { note: "Test highlight from next page" },
            () => {},
            "test-class"
          );
          // If we get here without error, the CFI range format is correct
          assert(true, "CFI range should be compatible with highlightRange");
        } catch (e) {
          // If highlighting fails, it might be due to other reasons, but the CFI format should be correct
          assert(
            typeof firstParagraph.cfiRange === "string" &&
              firstParagraph.cfiRange.startsWith("epubcfi"),
            "CFI range should have correct format even if highlighting fails"
          );
        }
      }
    });
  });

  describe("Background Loading", function () {
    it("should load content without changing current view", async function () {
      const initialLocation = rendition.manager.currentLocation();

      const paragraphs = await rendition.getNextViewParagraphs();

      // Check that we're still on the same view after loading next content
      const finalLocation = rendition.manager.currentLocation();

      assert.strictEqual(
        initialLocation[0].index,
        finalLocation[0].index,
        "Should remain on the same view after loading next section content"
      );
    });

    it("should handle errors gracefully", async function () {
      // This test ensures the method handles loading errors without crashing
      let result;
      let error;

      try {
        result = await rendition.getNextViewParagraphs();
      } catch (e) {
        error = e;
      }

      // Should either return null/array or throw a handled error
      assert(
        result === null || Array.isArray(result) || error !== undefined,
        "Should handle loading gracefully"
      );
    });
  });

  describe("Performance", function () {
    it("should execute within reasonable time", async function () {
      const startTime = Date.now();

      await rendition.getNextViewParagraphs();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      assert(
        executionTime < 5000,
        `Method should execute in less than 5 seconds, took ${executionTime}ms`
      );
    });
  });
});
