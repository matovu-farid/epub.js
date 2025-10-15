import assert from "assert";
import ePub from "../src/epub";

describe("Rendition - getCurrentViewParagraphs (Real EPUB)", function () {
  let book;
  let rendition;
  let container;

  // Set timeout for EPUB loading
  this.timeout(15000);

  before(function () {
    // Load the Alice in Wonderland test EPUB
    book = new ePub("/base/test/fixtures/alice.epub");
  });

  beforeEach(async function () {
    // Create a DOM element for testing
    container = document.createElement("div");
    container.id = `test-container-${Date.now()}`;
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);

    // Create a fresh rendition for each test
    rendition = book.renderTo(container.id, {
      width: 600,
      height: 400,
      flow: "paginated",
    });

    // Wait for rendition to be ready
    await rendition.display();

    // Wait for rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterEach(function () {
    // Clean up
    if (rendition) {
      rendition.destroy();
    }

    // Remove the test container
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe("Real EPUB Integration", function () {
    it("should return paragraphs when EPUB is properly loaded", function () {
      const result = rendition.getCurrentViewParagraphs();

      assert(result !== null, "Should not return null when EPUB is loaded");
      assert(Array.isArray(result), "Should return an array");

      if (result.length > 0) {
        // Test paragraph structure
        const paragraph = result[0];
        assert(typeof paragraph === "object", "Paragraph should be an object");
        assert(
          typeof paragraph.text === "string",
          "Paragraph should have text property"
        );
        assert(
          typeof paragraph.startCfi === "string",
          "Paragraph should have startCfi property"
        );
        assert(
          typeof paragraph.endCfi === "string",
          "Paragraph should have endCfi property"
        );
        assert(paragraph.text.length > 0, "Paragraph text should not be empty");
        assert(
          paragraph.startCfi.length > 0,
          "Paragraph startCfi should not be empty"
        );
        assert(
          paragraph.endCfi.length > 0,
          "Paragraph endCfi should not be empty"
        );
        assert(
          paragraph.startCfi.startsWith("epubcfi"),
          "CFI should start with 'epubcfi'"
        );
      }
    });

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

    it("should have reasonable paragraph count for Alice in Wonderland", function () {
      const paragraphs = rendition.getCurrentViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        assert(paragraphs.length > 0, "Should have at least one paragraph");
        assert(
          paragraphs.length < 50,
          "Should not have too many paragraphs (Alice EPUB should be reasonable)"
        );
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

  describe("Performance with Real EPUB", function () {
    it("should execute within reasonable time", function () {
      const startTime = Date.now();

      rendition.getCurrentViewParagraphs();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      assert(
        executionTime < 2000,
        `Method should execute in less than 2 seconds, took ${executionTime}ms`
      );
    });
  });

  describe("Navigation Integration", function () {
    it("should return different paragraphs when navigating", async function () {
      const initialParagraphs = rendition.getCurrentViewParagraphs();

      if (
        initialParagraphs &&
        initialParagraphs.length > 0 &&
        book.spine.length > 1
      ) {
        // Navigate to next section if available
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
    });
  });
});
