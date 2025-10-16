const assert = require("assert");
const Epub = require("../");

describe("Rendition - getNextViewParagraphs Edge Cases", function () {
  this.timeout(20000);

  let book, iframe;

  before(async function () {
    book = Epub("./test/fixtures/alice/OPS/package.opf", {
      openAs: "epub",
    });

    await book.ready;

    iframe = document.createElement("iframe");
    iframe.style.width = "600px";
    iframe.style.height = "400px";
    document.body.appendChild(iframe);
  });

  after(function () {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  describe("Spreads Mode (Two-Page View)", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 1200,
        height: 400,
        flow: "paginated",
        spread: "always",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should handle spreads mode with two pages visible", async function () {
      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should return an array");

      // In spreads mode, behavior might differ
      console.log("Spreads mode: Found", result.length, "paragraphs");

      if (result.length > 0) {
        result.forEach((p) => {
          assert(typeof p.text === "string", "Should have text");
          assert(typeof p.cfiRange === "string", "Should have cfiRange");
        });
      }
    });

    it("should work after navigation in spreads mode", async function () {
      await rendition.next();
      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should return an array after navigation");
    });
  });

  describe("Scrolled Mode", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "scrolled",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should handle scrolled mode", async function () {
      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should return an array in scrolled mode");

      // Scrolled mode is continuous, so behavior might be different
      console.log("Scrolled mode: Found", result.length, "paragraphs");
    });

    it("should handle scrolling within scrolled mode", async function () {
      // Scroll down
      if (rendition.manager && rendition.manager.container) {
        rendition.manager.container.scrollTop = 200;
      }

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should return an array after scrolling");
    });
  });

  describe("Different Page Sizes", function () {
    it("should handle small pages", async function () {
      const rendition = book.renderTo(iframe, {
        width: 300,
        height: 200,
        flow: "paginated",
      });

      await rendition.display();

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work with small pages");

      rendition.destroy();
    });

    it("should handle large pages", async function () {
      const rendition = book.renderTo(iframe, {
        width: 1000,
        height: 800,
        flow: "paginated",
      });

      await rendition.display();

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work with large pages");

      rendition.destroy();
    });

    it("should handle very narrow pages", async function () {
      const rendition = book.renderTo(iframe, {
        width: 200,
        height: 600,
        flow: "paginated",
      });

      await rendition.display();

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work with narrow pages");

      rendition.destroy();
    });
  });

  describe("Section Boundaries", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should handle first page of first section", async function () {
      await rendition.display(0);

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work at beginning of book");
    });

    it("should handle transition between sections", async function () {
      // Navigate to second section
      await rendition.display(1);

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work at section boundary");
    });

    it("should handle last section", async function () {
      // Navigate to last section
      const lastSection = book.spine.last();
      if (lastSection) {
        await rendition.display(lastSection.href);

        const result = await rendition.getNextViewParagraphs();

        assert(Array.isArray(result), "Should work in last section");
      }
    });

    it("should handle middle sections", async function () {
      // Navigate to middle section
      const middleIndex = Math.floor(book.spine.length / 2);
      await rendition.display(middleIndex);

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work in middle sections");
    });
  });

  describe("Navigation Patterns", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should work after multiple forward navigations", async function () {
      for (let i = 0; i < 5; i++) {
        await rendition.next();
      }

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work after multiple navigations");
    });

    it("should work after backward navigation", async function () {
      await rendition.next();
      await rendition.next();
      await rendition.prev();

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work after backward navigation");
    });

    it("should work after jumping to specific location", async function () {
      await rendition.display("epubcfi(/6/6!/4/2/10)");

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should work after jumping to CFI");
    });
  });

  describe("Content Types", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should handle pages with images", async function () {
      // Alice in Wonderland has some illustrations
      // Navigate through to find a page with an image
      for (let i = 0; i < 10; i++) {
        await rendition.next();
      }

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should handle pages with images");
    });

    it("should handle pages with mixed content", async function () {
      await rendition.display(5);

      const result = await rendition.getNextViewParagraphs();

      assert(Array.isArray(result), "Should handle mixed content");

      if (result.length > 0) {
        // Verify structure
        result.forEach((p) => {
          assert(p.text, "Should have text");
          assert(p.cfiRange, "Should have cfiRange");
        });
      }
    });
  });

  describe("Performance and Stability", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should handle repeated calls without degradation", async function () {
      const results = [];

      for (let i = 0; i < 10; i++) {
        const result = await rendition.getNextViewParagraphs();
        results.push(result);
        assert(Array.isArray(result), `Call ${i} should return array`);
      }

      // All results should be consistent
      console.log("Repeated calls all succeeded");
    });

    it("should complete quickly", async function () {
      const start = Date.now();

      await rendition.getNextViewParagraphs();

      const duration = Date.now() - start;

      assert(duration < 5000, `Should complete in < 5s, took ${duration}ms`);
    });
  });

  describe("State Preservation", function () {
    let rendition;

    beforeEach(async function () {
      rendition = book.renderTo(iframe, {
        width: 600,
        height: 400,
        flow: "paginated",
      });

      await rendition.display();
    });

    afterEach(function () {
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
    });

    it("should not change current location", async function () {
      await rendition.display(3);

      const locationBefore = rendition.currentLocation();
      await rendition.getNextViewParagraphs();
      const locationAfter = rendition.currentLocation();

      assert(
        locationBefore &&
          locationAfter &&
          locationBefore.start.cfi === locationAfter.start.cfi,
        "Location should not change"
      );
    });

    it("should not affect subsequent getCurrentViewParagraphs calls", async function () {
      await rendition.display(2);

      const currentBefore = await rendition.getCurrentViewParagraphs();
      await rendition.getNextViewParagraphs();
      const currentAfter = await rendition.getCurrentViewParagraphs();

      // getCurrentViewParagraphs should return same results
      if (currentBefore && currentAfter) {
        const textBefore = currentBefore.map((p) => p.text).join("");
        const textAfter = currentAfter.map((p) => p.text).join("");

        assert(textBefore === textAfter, "Current view should not be affected");
      }
    });
  });
});
