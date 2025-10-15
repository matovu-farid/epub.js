# Getting Current View Text

This document explains how to use the `getCurrentViewText()` method to retrieve the text content of the currently viewed **page** in epub.js.

## Overview

The `getCurrentViewText()` method provides a convenient way to access the text content of the **page** currently being displayed to the user (not the entire chapter/section). This is useful for features like:

- Text-to-speech functionality
- Search within current section
- Content analysis
- Reading progress tracking
- Copy/paste operations

## Method Signature

```javascript
rendition.getCurrentViewText();
```

**Returns:** `{ text: string, startCfi: string, endCfi: string } | null`

- Returns an object containing the text content and CFI boundaries if a view is currently displayed:
  - `text`: The text content of the currently visible page
  - `startCfi`: The starting CFI (Canonical Fragment Identifier) of the visible range
  - `endCfi`: The ending CFI of the visible range
- Returns `null` if no view is visible or if the manager is not initialized

## How It Works

Internally, the method:

1. Gets the current location from the manager using `manager.currentLocation()`
2. Extracts the visible page mapping which contains CFI (Canonical Fragment Identifier) range
3. Converts the start and end CFIs to DOM ranges
4. Creates a combined range spanning the visible content
5. Extracts text from that range using `range.toString()`

This ensures you get **only the text visible on the current page**, not the entire chapter.

## Usage Examples

### Basic Usage

```javascript
var book = ePub("/path/to/book.epub");
var rendition = book.renderTo("viewer", {
  width: "100%",
  height: "600px",
});

rendition.display().then(function () {
  // Get the text of the currently displayed section
  var result = rendition.getCurrentViewText();

  if (result) {
    console.log("Current text:", result.text);
    console.log("Start CFI:", result.startCfi);
    console.log("End CFI:", result.endCfi);
  } else {
    console.log("No text available");
  }
});
```

### Text-to-Speech Example

```javascript
function speakCurrentSection() {
  var result = rendition.getCurrentViewText();

  if (result && window.speechSynthesis) {
    var utterance = new SpeechSynthesisUtterance(result.text);
    window.speechSynthesis.speak(utterance);
  }
}

// Attach to a button
document
  .getElementById("speak-btn")
  .addEventListener("click", speakCurrentSection);
```

### Search in Current Section

```javascript
function searchInCurrentSection(query) {
  var result = rendition.getCurrentViewText();

  if (result) {
    var lowerText = result.text.toLowerCase();
    var lowerQuery = query.toLowerCase();
    var index = lowerText.indexOf(lowerQuery);

    if (index !== -1) {
      console.log("Found at position:", index);
      return true;
    }
  }

  return false;
}
```

### Word Count in Current View

```javascript
function getCurrentWordCount() {
  var result = rendition.getCurrentViewText();

  if (result) {
    var words = result.text.trim().split(/\s+/);
    return words.length;
  }

  return 0;
}

// Update word count on page change
rendition.on("rendered", function () {
  var count = getCurrentWordCount();
  document.getElementById("word-count").textContent = count + " words";
});
```

### Copy Current Section to Clipboard

```javascript
function copyCurrentSectionToClipboard() {
  var result = rendition.getCurrentViewText();

  if (result && navigator.clipboard) {
    navigator.clipboard
      .writeText(result.text)
      .then(function () {
        alert("Text copied to clipboard!");
      })
      .catch(function (err) {
        console.error("Failed to copy:", err);
      });
  }
}
```

### Highlight Keywords in Current View

```javascript
function highlightKeywords(keywords) {
  var result = rendition.getCurrentViewText();

  if (result) {
    keywords.forEach(function (keyword) {
      var regex = new RegExp(keyword, "gi");
      var matches = result.text.match(regex);

      if (matches) {
        console.log("Found '" + keyword + "' " + matches.length + " times");
        // You can then use the annotation system to highlight
      }
    });
  }
}
```

## Important Notes

1. **Timing**: Make sure to call this method after the rendition has displayed content. Use the `displayed` or `rendered` events to ensure content is ready.

2. **Null Check**: Always check if the returned value is `null` before using it, as it will be `null` if:

   - No section is currently displayed
   - The manager hasn't been initialized
   - The view or contents are not available

3. **Plain Text Only**: This method returns plain text content only. HTML markup, formatting, and structure are stripped out.

4. **Current Page Only**: The method returns text from the **currently visible page**, not the entire chapter/section. It uses the visible offset range to determine exactly what content is shown on screen.

5. **Performance**: The method efficiently extracts only the visible text using CFI ranges, so it's performant even with large chapters.

## Event Integration

You can combine this method with epub.js events for automatic updates:

```javascript
// Update text display when section changes
rendition.on("rendered", function (section, view) {
  var result = rendition.getCurrentViewText();
  if (result) {
    updateTextDisplay(result.text);
  }
});

// Track reading progress
rendition.on("relocated", function (location) {
  var result = rendition.getCurrentViewText();
  var wordCount = result ? result.text.split(/\s+/).length : 0;

  console.log("Current section has " + wordCount + " words");
});
```

## Related Methods

### getCurrentViewParagraphs()

For more granular access to content, you can use `getCurrentViewParagraphs()` to get individual paragraphs:

```javascript
const paragraphs = rendition.getCurrentViewParagraphs();

if (paragraphs) {
  paragraphs.forEach((paragraph, index) => {
    console.log(`Paragraph ${index + 1}:`, paragraph.text);
    console.log(`CFI:`, paragraph.cfi);
  });
}
```

This method returns an array of objects with `{text, cfi}` structure, allowing you to:

- Access each paragraph individually
- Get precise CFI locations for each paragraph
- Build paragraph-by-paragraph interfaces
- Create annotations for specific paragraphs

## See Also

- [Live Example](examples/current-text.html) - Interactive demonstration
- [Rendition API](documentation/md/API.md#rendition) - Full Rendition API documentation
- [Contents Class](documentation/md/API.md#contents) - Understanding Contents object
- [View Managers](src/managers/) - How view management works

## Browser Compatibility

This method works in all browsers that support epub.js. The text extraction uses standard DOM APIs (`textContent`) which have universal browser support.
