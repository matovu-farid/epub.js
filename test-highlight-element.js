/**
 * Test script for the new highlightElement functionality
 * This demonstrates how to use the highlightElement method to highlight
 * an entire element based on a single CFI
 */

// Example usage of the new highlightElement method
async function testHighlightElement(rendition) {
  try {
    console.log("Testing highlightElement method...");

    // Get current location to find a CFI
    const location = rendition.currentLocation();
    if (!location) {
      throw new Error("No current location available");
    }

    console.log(`Current location CFI: ${location.start.cfi}`);

    // Test highlighting the element at the current location
    await rendition.highlightElement(
      location.start.cfi,
      {
        test: true,
        timestamp: new Date().toISOString(),
        source: "highlightElement-test",
      },
      (e) => {
        console.log("Highlight clicked!", e);
      },
      "epubjs-hl-element-test",
      {
        fill: "rgba(0, 255, 0, 0.3)",
        "fill-opacity": "0.3",
        "mix-blend-mode": "multiply",
      }
    );

    console.log("Element highlighted successfully!");
    return true;
  } catch (err) {
    console.error(`Error highlighting element: ${err.message}`);
    return false;
  }
}

// Example of highlighting multiple elements
async function highlightMultipleElements(rendition, cfiList) {
  const results = [];

  for (const cfi of cfiList) {
    try {
      await rendition.highlightElement(cfi, {
        elementId: cfi,
        timestamp: new Date().toISOString(),
      });
      results.push({ cfi, success: true });
      console.log(`Successfully highlighted element: ${cfi}`);
    } catch (err) {
      results.push({ cfi, success: false, error: err.message });
      console.error(`Failed to highlight element ${cfi}: ${err.message}`);
    }
  }

  return results;
}

// Example of highlighting with custom styles
async function highlightWithCustomStyles(rendition, cfi) {
  const customStyles = {
    fill: "rgba(255, 165, 0, 0.4)", // Orange highlight
    stroke: "rgba(255, 165, 0, 0.8)",
    "stroke-width": "2px",
    "mix-blend-mode": "multiply",
  };

  await rendition.highlightElement(
    cfi,
    {
      type: "custom-highlight",
      color: "orange",
    },
    (e) => {
      console.log("Custom highlight clicked!", e.target);
    },
    "epubjs-custom-hl",
    customStyles
  );
}

// Export functions for use in other test files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testHighlightElement,
    highlightMultipleElements,
    highlightWithCustomStyles,
  };
}
