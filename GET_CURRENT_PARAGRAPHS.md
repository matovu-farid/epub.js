# Getting Current View Paragraphs

This document explains how to use the `getCurrentViewParagraphs()` method to retrieve individual paragraphs from the currently viewed **page** in epub.js.

## Overview

The `getCurrentViewParagraphs()` method provides granular access to the paragraph-level content of the **page** currently being displayed to the user (not the entire chapter/section). Each paragraph is returned with both its text content and CFI (Canonical Fragment Identifier), enabling precise location tracking and individual paragraph manipulation.

This is useful for features like:

- Paragraph-by-paragraph text-to-speech
- Individual paragraph annotations
- Paragraph-level analysis or translation
- Progressive reading interfaces
- Paragraph-specific highlighting

## Method Signature

```javascript
rendition.getCurrentViewParagraphs();
```

**Returns:** `Array<{text: string, cfi: string}> | null`

- Returns an array of paragraph objects if a view is currently displayed
- Each paragraph object contains:
  - `text`: The text content of the paragraph
  - `cfi`: The CFI (Canonical Fragment Identifier) for the paragraph
- Returns `null` if no view is visible or if the manager is not initialized

## How It Works

Internally, the method:

1. Gets the current location from the manager using `manager.currentLocation()`
2. Extracts the visible page mapping which contains CFI range
3. Converts the start and end CFIs to DOM ranges
4. Creates a combined range spanning the visible content
5. Finds all block-level elements (p, div, h1-h6, li, blockquote, etc.) within the visible range
6. Filters out empty paragraphs
7. Generates CFI for each paragraph using `view.contents.cfiFromNode()`
8. Returns an array of paragraph objects with text and CFI

This ensures you get **only the paragraphs visible on the current page**, with precise CFI locations for each.

## Usage Examples

### Basic Usage

```javascript
var book = ePub("/path/to/book.epub");
var rendition = book.renderTo("viewer", {
  width: "100%",
  height: "600px",
});

rendition.display().then(function () {
  // Get the paragraphs of the currently displayed page
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs) {
    console.log("Found", paragraphs.length, "paragraphs");
    paragraphs.forEach(function (paragraph, index) {
      console.log("Paragraph", index + 1, ":", paragraph.text);
      console.log("CFI:", paragraph.cfi);
    });
  } else {
    console.log("No paragraphs available");
  }
});
```

### Paragraph-by-Paragraph Text-to-Speech

```javascript
function speakParagraphs() {
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs && window.speechSynthesis) {
    var currentIndex = 0;

    function speakNext() {
      if (currentIndex < paragraphs.length) {
        var utterance = new SpeechSynthesisUtterance(
          paragraphs[currentIndex].text
        );
        utterance.onend = function () {
          currentIndex++;
          setTimeout(speakNext, 500); // Pause between paragraphs
        };
        window.speechSynthesis.speak(utterance);
      }
    }

    speakNext();
  }
}

// Attach to a button
document
  .getElementById("speak-paragraphs-btn")
  .addEventListener("click", speakParagraphs);
```

### Create Annotations for Each Paragraph

```javascript
function highlightAllParagraphs() {
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs) {
    paragraphs.forEach(function (paragraph, index) {
      // Create a range from the paragraph's CFI
      var range = rendition.getRange(paragraph.cfi);

      if (range) {
        rendition.annotations.add(
          "highlight",
          paragraph.cfi,
          null,
          {},
          "paragraph-highlight-" + index
        );
      }
    });
  }
}
```

### Progressive Reading Interface

```javascript
var currentParagraphIndex = 0;

function showCurrentParagraph() {
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs && currentParagraphIndex < paragraphs.length) {
    var paragraph = paragraphs[currentParagraphIndex];

    // Highlight current paragraph
    rendition.annotations.remove("current-paragraph");
    rendition.annotations.add(
      "highlight",
      paragraph.cfi,
      null,
      {},
      "current-paragraph"
    );

    // Display paragraph info
    document.getElementById("paragraph-info").innerHTML =
      "Paragraph " + (currentParagraphIndex + 1) + " of " + paragraphs.length;
    document.getElementById("paragraph-text").textContent = paragraph.text;
  }
}

function nextParagraph() {
  var paragraphs = rendition.getCurrentViewParagraphs();
  if (paragraphs && currentParagraphIndex < paragraphs.length - 1) {
    currentParagraphIndex++;
    showCurrentParagraph();
  }
}

function previousParagraph() {
  if (currentParagraphIndex > 0) {
    currentParagraphIndex--;
    showCurrentParagraph();
  }
}

// Navigation controls
document
  .getElementById("next-paragraph")
  .addEventListener("click", nextParagraph);
document
  .getElementById("prev-paragraph")
  .addEventListener("click", previousParagraph);

// Update on page change
rendition.on("rendered", function () {
  currentParagraphIndex = 0;
  showCurrentParagraph();
});
```

### Search Within Paragraphs

```javascript
function searchInParagraphs(query) {
  var paragraphs = rendition.getCurrentViewParagraphs();
  var results = [];

  if (paragraphs) {
    paragraphs.forEach(function (paragraph, index) {
      var lowerText = paragraph.text.toLowerCase();
      var lowerQuery = query.toLowerCase();

      if (lowerText.includes(lowerQuery)) {
        results.push({
          paragraphIndex: index,
          paragraph: paragraph,
          matchCount: (paragraph.text.match(new RegExp(query, "gi")) || [])
            .length,
        });
      }
    });
  }

  return results;
}

// Usage
var searchResults = searchInParagraphs("example");
console.log("Found", searchResults.length, "paragraphs containing 'example'");
```

### Word Count Per Paragraph

```javascript
function getParagraphWordCounts() {
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs) {
    return paragraphs.map(function (paragraph) {
      var words = paragraph.text.trim().split(/\s+/);
      return {
        text: paragraph.text,
        cfi: paragraph.cfi,
        wordCount: words.length,
      };
    });
  }

  return [];
}

// Usage
var wordCounts = getParagraphWordCounts();
var totalWords = wordCounts.reduce(function (sum, p) {
  return sum + p.wordCount;
}, 0);

console.log("Total words on current page:", totalWords);
```

### Copy Specific Paragraphs

```javascript
function copyParagraphToClipboard(paragraphIndex) {
  var paragraphs = rendition.getCurrentViewParagraphs();

  if (paragraphs && paragraphIndex < paragraphs.length) {
    var paragraph = paragraphs[paragraphIndex];

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(paragraph.text)
        .then(function () {
          alert("Paragraph copied to clipboard!");
        })
        .catch(function (err) {
          console.error("Failed to copy:", err);
        });
    }
  }
}

// Copy first paragraph
document
  .getElementById("copy-first-paragraph")
  .addEventListener("click", function () {
    copyParagraphToClipboard(0);
  });
```

## Block-Level Elements Detected

The method identifies the following block-level elements as "paragraphs":

- `<p>` - Standard paragraphs
- `<div>` - Generic block containers
- `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>` - Headings
- `<li>` - List items
- `<blockquote>` - Quoted content
- `<pre>` - Preformatted text
- `<article>`, `<section>`, `<aside>` - Semantic blocks
- `<header>`, `<footer>`, `<main>`, `<nav>` - Layout blocks
- `<figure>`, `<figcaption>` - Media blocks
- `<dd>`, `<dt>` - Definition list items

## Important Notes

1. **Timing**: Make sure to call this method after the rendition has displayed content. Use the `displayed` or `rendered` events to ensure content is ready.

2. **Null Check**: Always check if the returned value is `null` before using it, as it will be `null` if:

   - No section is currently displayed
   - The manager hasn't been initialized
   - The view or contents are not available

3. **Empty Paragraphs**: Empty or whitespace-only paragraphs are automatically excluded from the results.

4. **Current Page Only**: The method returns paragraphs from the **currently visible page**, not the entire chapter/section. It uses the visible offset range to determine exactly what content is shown on screen.

5. **Performance**: The method efficiently extracts only visible paragraphs using CFI ranges, so it's performant even with large chapters.

6. **CFI Generation**: Each paragraph's CFI is generated using `view.contents.cfiFromNode()`, ensuring compatibility with epub.js annotation and navigation systems.

## Event Integration

You can combine this method with epub.js events for automatic updates:

```javascript
// Update paragraph display when section changes
rendition.on("rendered", function (section, view) {
  var paragraphs = rendition.getCurrentViewParagraphs();
  if (paragraphs) {
    updateParagraphDisplay(paragraphs);
  }
});

// Track reading progress by paragraph
rendition.on("relocated", function (location) {
  var paragraphs = rendition.getCurrentViewParagraphs();
  var totalWords = paragraphs
    ? paragraphs.reduce(function (sum, p) {
        return sum + p.text.split(/\s+/).length;
      }, 0)
    : 0;

  console.log(
    "Current page has " +
      totalWords +
      " words across " +
      (paragraphs ? paragraphs.length : 0) +
      " paragraphs"
  );
});
```

## Browser Compatibility

This method works in all browsers that support epub.js. The paragraph detection uses standard DOM APIs (`querySelectorAll`, `textContent`, `intersectsNode`) which have universal browser support.

## Related Methods

- `getCurrentViewText()` - Get all visible text as a single string with CFI boundaries
- `annotations.add()` - Create annotations using paragraph CFIs
- `display(cfi)` - Navigate to specific CFI locations
- `getRange(cfi)` - Get DOM range from CFI
