import assert from "assert";
import ePub from "../src/epub";

describe("Rendition - getNextViewParagraphs (Comprehensive)", function () {
  let book;
  let rendition;

  // Set timeout for EPUB loading
  this.timeout(15000);

  // Helper functions
  async function waitForRender(ms = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function navigateToPage(rendition, pageNum) {
    const location = rendition.manager.currentLocation()[0];
    while (location.pages[0] < pageNum) {
      await rendition.next();
      await waitForRender(200);
    }
  }

  function compareParagraphs(para1, para2) {
    return para1.text.trim() === para2.text.trim();
  }

  function isLastPageOfBook(rendition) {
    const location = rendition.manager.currentLocation()[0];
    const currentSection = rendition.manager.views.find({
      index: location.index,
    });
    return (
      !currentSection.section.next() && location.pages[0] >= location.totalPages
    );
  }

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
    await waitForRender(500);
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

  describe("1. Setup and Teardown Tests", function () {
    it("should have test environment properly initialized", function () {
      assert(rendition !== null, "Rendition should be initialized");
      assert(rendition.manager !== null, "Manager should be initialized");
    });

    it("should have EPUB loaded and ready", function () {
      assert(book !== null, "Book should be loaded");
      const location = rendition.manager.currentLocation();
      assert(location !== null, "Location should be available");
      assert(location.length > 0, "Location should have sections");
    });

    it("should have rendition created with correct settings", function () {
      assert.strictEqual(
        rendition.settings.flow,
        "paginated",
        "Should be in paginated mode"
      );
      assert(rendition.manager.isPaginated, "Manager should be paginated");
    });
  });

  describe("2. Method Existence and Type Tests", function () {
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

    it("should be async/await compatible", async function () {
      let error = null;
      try {
        await rendition.getNextViewParagraphs();
      } catch (e) {
        error = e;
      }
      assert(
        error === null,
        "Should work with async/await without throwing errors"
      );
    });
  });

  describe("3. Basic Return Value Tests", function () {
    it("should return array or null (not undefined)", async function () {
      const result = await rendition.getNextViewParagraphs();
      assert(
        result === null || Array.isArray(result),
        "Should return null or array, never undefined"
      );
    });

    it("should return non-empty array when next page exists", async function () {
      const result = await rendition.getNextViewParagraphs();

      // At the beginning of the book, there should always be a next page
      assert(result !== null, "Should not return null at beginning of book");
      assert(Array.isArray(result), "Should return an array");
      assert(result.length > 0, "Array should not be empty");
    });

    it("should return objects with required properties", async function () {
      const result = await rendition.getNextViewParagraphs();

      if (result && result.length > 0) {
        const paragraph = result[0];
        assert(typeof paragraph === "object", "Paragraph should be an object");
        assert(typeof paragraph.text === "string", "Should have text property");
        assert(
          typeof paragraph.cfiRange === "string",
          "Should have cfiRange property"
        );
        assert(paragraph.text.length > 0, "Text should not be empty");
        assert(paragraph.cfiRange.length > 0, "CFI range should not be empty");
      }
    });
  });

  describe("4. Next Page Within Same Section Tests", function () {
    it("should return paragraphs from page 2 when on page 1 of multi-page section", async function () {
      // Start at the beginning
      await rendition.display();
      await waitForRender(500);

      const location = rendition.manager.currentLocation()[0];

      // Only run if we have multiple pages in current section
      if (location.totalPages > 1 && location.pages[0] < location.totalPages) {
        const currentParagraphs = rendition.getCurrentViewParagraphs();
        const nextParagraphs = await rendition.getNextViewParagraphs();

        assert(nextParagraphs !== null, "Should return paragraphs");
        assert(nextParagraphs.length > 0, "Should have paragraphs");

        // Verify they're different
        assert.notStrictEqual(
          currentParagraphs[0].text,
          nextParagraphs[0].text,
          "Next page should have different content"
        );
      } else {
        this.skip();
      }
    });

    it("should return different paragraphs than current page", async function () {
      const location = rendition.manager.currentLocation()[0];

      if (location.totalPages > 1 && location.pages[0] < location.totalPages) {
        const currentParagraphs = rendition.getCurrentViewParagraphs();
        const nextParagraphs = await rendition.getNextViewParagraphs();

        if (nextParagraphs && nextParagraphs.length > 0) {
          const currentTexts = currentParagraphs.map((p) => p.text);
          const nextTexts = nextParagraphs.map((p) => p.text);

          // At least the first paragraph should be different
          assert.notStrictEqual(
            currentTexts[0],
            nextTexts[0],
            "First paragraph should be different"
          );
        }
      } else {
        this.skip();
      }
    });
  });

  describe("5. Transition to Next Section Tests", function () {
    it("should return paragraphs when transitioning between sections", async function () {
      // Try to navigate to a section that has multiple pages
      let foundMultiPageSection = false;

      for (let i = 0; i < 5; i++) {
        await rendition.display(i);
        await waitForRender(500);

        const location = rendition.manager.currentLocation()[0];

        if (location.totalPages > 1) {
          foundMultiPageSection = true;

          // Navigate to last page of this section
          while (location.pages[0] < location.totalPages) {
            await rendition.next();
            await waitForRender(300);
          }

          // Now we're on last page, get next paragraphs
          const nextParagraphs = await rendition.getNextViewParagraphs();

          if (nextParagraphs !== null) {
            assert(
              nextParagraphs.length > 0,
              "Should have paragraphs from next section"
            );

            // Verify it's from the next section by navigating
            const oldLocation = rendition.manager.currentLocation()[0];
            await rendition.next();
            await waitForRender(500);
            const newLocation = rendition.manager.currentLocation()[0];

            assert(
              newLocation.index > oldLocation.index || newLocation.index === 0,
              "Should have moved to next section"
            );
          }
          break;
        }
      }

      if (!foundMultiPageSection) {
        this.skip();
      }
    });
  });

  describe("6. Verification Against Actual Navigation Tests", function () {
    this.timeout(10000); // Longer timeout for navigation tests

    it("should return paragraphs that match actual next page", async function () {
      // Get next page paragraphs without navigating
      const predictedNextParagraphs = await rendition.getNextViewParagraphs();

      if (predictedNextParagraphs === null) {
        this.skip(); // Skip if we're at the end
      }

      console.log(
        "Predicted next paragraphs:",
        predictedNextParagraphs.length,
        "paragraphs"
      );
      console.log(
        "First predicted paragraph:",
        predictedNextParagraphs[0].text.substring(0, 50) + "..."
      );

      // Navigate to next page
      await rendition.next();
      await waitForRender(800); // Wait longer for navigation

      // Get current page paragraphs (which should now be the "next" page)
      const actualNextParagraphs = rendition.getCurrentViewParagraphs();

      console.log(
        "Actual paragraphs after navigation:",
        actualNextParagraphs.length,
        "paragraphs"
      );
      console.log(
        "First actual paragraph:",
        actualNextParagraphs[0].text.substring(0, 50) + "..."
      );

      // Compare
      assert(
        actualNextParagraphs !== null,
        "Should have paragraphs after navigation"
      );
      assert(
        actualNextParagraphs.length > 0,
        "Should have at least one paragraph"
      );

      // Compare first paragraph text (trim whitespace for comparison)
      const predictedText = predictedNextParagraphs[0].text.trim();
      const actualText = actualNextParagraphs[0].text.trim();

      assert.strictEqual(
        predictedText,
        actualText,
        "First paragraph should match after navigation"
      );
    });

    it("should match actual next page for multiple consecutive pages", async function () {
      this.timeout(15000);

      let successCount = 0;
      const testPages = 3;

      for (let i = 0; i < testPages; i++) {
        const predictedNextParagraphs = await rendition.getNextViewParagraphs();

        if (predictedNextParagraphs === null) {
          break; // End of book reached
        }

        await rendition.next();
        await waitForRender(800);

        const actualNextParagraphs = rendition.getCurrentViewParagraphs();

        if (
          actualNextParagraphs &&
          actualNextParagraphs.length > 0 &&
          predictedNextParagraphs.length > 0
        ) {
          const predictedText = predictedNextParagraphs[0].text.trim();
          const actualText = actualNextParagraphs[0].text.trim();

          if (predictedText === actualText) {
            successCount++;
          } else {
            console.log("Mismatch at iteration", i);
            console.log("Predicted:", predictedText.substring(0, 100));
            console.log("Actual:", actualText.substring(0, 100));
          }
        }
      }

      assert(
        successCount >= 2,
        `Should match for at least 2 out of ${testPages} pages (matched ${successCount})`
      );
    });
  });

  describe("7. Edge Case Tests", function () {
    it("should handle first page of book", async function () {
      await rendition.display();
      await waitForRender(500);

      const nextParagraphs = await rendition.getNextViewParagraphs();

      assert(
        nextParagraphs !== null,
        "Should return paragraphs from first page"
      );
      assert(nextParagraphs.length > 0, "Should have paragraphs");
    });

    it("should handle errors gracefully without crashing", async function () {
      let error = null;

      try {
        await rendition.getNextViewParagraphs();
      } catch (e) {
        error = e;
      }

      assert(error === null, "Should not throw errors");
    });
  });

  describe("8. CFI Validation Tests", function () {
    it("should generate valid CFI ranges", async function () {
      const paragraphs = await rendition.getNextViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          assert(
            paragraph.cfiRange.startsWith("epubcfi"),
            `Paragraph ${index} CFI should start with 'epubcfi'`
          );
          assert(
            paragraph.cfiRange.includes("!/"),
            `Paragraph ${index} CFI should contain '!/'`
          );
          assert(
            paragraph.cfiRange.includes(","),
            `Paragraph ${index} CFI should be a range (contain comma)`
          );
        });
      }
    });

    it("should generate parseable CFI ranges", async function () {
      const paragraphs = await rendition.getNextViewParagraphs();

      if (paragraphs && paragraphs.length > 0) {
        const firstParagraph = paragraphs[0];

        // Try to parse the CFI
        try {
          const EpubCFI = require("../src/epubcfi").default;
          const cfi = new EpubCFI(firstParagraph.cfiRange);

          assert(cfi !== null, "CFI should be parseable");
          assert(cfi.base !== undefined, "CFI should have base");
        } catch (e) {
          assert.fail("CFI should be parseable: " + e.message);
        }
      }
    });
  });

  describe("9. Performance Tests", function () {
    it("should execute within reasonable time", async function () {
      const startTime = Date.now();

      await rendition.getNextViewParagraphs();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      assert(
        executionTime < 2000,
        `Method should execute in less than 2 seconds, took ${executionTime}ms`
      );
    });

    it("should handle multiple consecutive calls", async function () {
      this.timeout(10000);

      for (let i = 0; i < 3; i++) {
        const result = await rendition.getNextViewParagraphs();
        assert(
          result === null || Array.isArray(result),
          `Call ${i + 1} should return valid result`
        );
      }
    });
  });

  describe("10. State Preservation Tests", function () {
    it("should not change current location", async function () {
      const initialLocation = rendition.manager.currentLocation();
      const initialIndex = initialLocation[0].index;
      const initialPages = [...initialLocation[0].pages];

      await rendition.getNextViewParagraphs();

      const finalLocation = rendition.manager.currentLocation();
      const finalIndex = finalLocation[0].index;
      const finalPages = [...finalLocation[0].pages];

      assert.strictEqual(
        initialIndex,
        finalIndex,
        "Should remain on same section"
      );
      assert.deepStrictEqual(
        initialPages,
        finalPages,
        "Should remain on same page(s)"
      );
    });

    it("should not modify current view", async function () {
      const currentParagraphsBefore = rendition.getCurrentViewParagraphs();

      await rendition.getNextViewParagraphs();

      const currentParagraphsAfter = rendition.getCurrentViewParagraphs();

      assert.strictEqual(
        currentParagraphsBefore.length,
        currentParagraphsAfter.length,
        "Current view should not be modified"
      );

      assert.strictEqual(
        currentParagraphsBefore[0].text,
        currentParagraphsAfter[0].text,
        "Current paragraphs should not change"
      );
    });
  });

  describe("11. Debug Information", function () {
    it("should provide debug information about current state", async function () {
      const location = rendition.manager.currentLocation()[0];

      console.log("=== Debug Information ===");
      console.log("Current section index:", location.index);
      console.log("Current pages:", location.pages);
      console.log("Total pages in section:", location.totalPages);
      console.log("Has mapping:", !!location.mapping);

      if (location.mapping) {
        console.log("Mapping start:", location.mapping.start);
        console.log("Mapping end:", location.mapping.end);
      }

      const nextParagraphs = await rendition.getNextViewParagraphs();
      console.log(
        "Next paragraphs result:",
        nextParagraphs ? `${nextParagraphs.length} paragraphs` : "null"
      );

      if (nextParagraphs && nextParagraphs.length > 0) {
        console.log(
          "First next paragraph preview:",
          nextParagraphs[0].text.substring(0, 100) + "..."
        );
      }
    });
  });
});
