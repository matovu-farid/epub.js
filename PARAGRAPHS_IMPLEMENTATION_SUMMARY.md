# Implementation Summary: getCurrentViewParagraphs() Method

## Overview

Added a new public method `getCurrentViewParagraphs()` to the Rendition class that provides granular access to paragraph-level content from the currently viewed **page** (not the entire chapter/section). The method returns an array of paragraph objects, each containing the text content and CFI (Canonical Fragment Identifier) for precise location tracking.

## Changes Made

### 1. Core Implementation (src/rendition.js)

**Location:** Lines 1116-1223

Added two new methods:

#### `getCurrentViewParagraphs()`

- Gets the current location from the manager which includes visible page mapping
- Extracts the CFI range (start and end) for the visible content
- Converts CFIs to DOM ranges
- Creates a combined range spanning the visible area
- Finds all block-level elements within the visible range
- Filters out empty paragraphs
- Generates CFI for each paragraph using `view.contents.cfiFromNode()`
- Returns array of objects with `{text, cfi}` structure

#### `_getBlockElementsInRange(range, document)`

- Helper method to find block-level elements that intersect with a given range
- Uses comprehensive CSS selectors for block elements
- Filters elements using `range.intersectsNode()` to ensure only visible content

**Key Code:**

```javascript
getCurrentViewParagraphs() {
  // ... CFI range logic similar to getCurrentViewText() ...

  const blockElements = this._getBlockElementsInRange(range, view.contents.document);

  const paragraphs = [];
  for (const element of blockElements) {
    const text = element.textContent.trim();

    if (!text) continue; // Skip empty paragraphs

    const cfi = view.contents.cfiFromNode(element);

    paragraphs.push({
      text: text,
      cfi: cfi
    });
  }

  return paragraphs;
}
```

### 2. TypeScript Definition (types/rendition.d.ts)

**Location:** Line 100

Added type definition:

```typescript
getCurrentViewParagraphs(): Array<{ text: string; cfi: string }> | null;
```

### 3. Documentation Updates

#### GET_CURRENT_TEXT.md

- Added "Related Methods" section mentioning `getCurrentViewParagraphs()`
- Included basic usage example
- Explained the relationship between the two methods

#### GET_CURRENT_PARAGRAPHS.md (New File)

- Comprehensive documentation for the new method
- Detailed usage examples including:
  - Basic usage
  - Paragraph-by-paragraph text-to-speech
  - Creating annotations for each paragraph
  - Progressive reading interface
  - Search within paragraphs
  - Word count per paragraph
  - Copy specific paragraphs
- Documented all block-level elements detected
- Browser compatibility information
- Event integration examples

### 4. Example Implementation (examples/current-text.html)

Enhanced the existing example to include:

- New "Get Paragraphs" button
- Paragraphs output div
- JavaScript functionality to display paragraphs with CFI information
- Updated description to mention both methods

## Use Cases Enabled

The `getCurrentViewParagraphs()` method enables:

1. **Paragraph-by-Paragraph Text-to-Speech**: Read content progressively, one paragraph at a time
2. **Individual Paragraph Annotations**: Create highlights or notes for specific paragraphs
3. **Paragraph-Level Analysis**: Analyze reading patterns, word counts, or content structure
4. **Progressive Reading Interfaces**: Build step-by-step reading experiences
5. **Paragraph-Specific Highlighting**: Highlight search results or keywords within specific paragraphs
6. **Translation Services**: Send individual paragraphs to translation APIs
7. **Reading Progress Tracking**: Track progress at the paragraph level
8. **Copy Operations**: Copy specific paragraphs to clipboard

## API Usage

```javascript
// Basic usage
const paragraphs = rendition.getCurrentViewParagraphs();

if (paragraphs) {
  paragraphs.forEach((paragraph, index) => {
    console.log(`Paragraph ${index + 1}:`, paragraph.text);
    console.log(`CFI:`, paragraph.cfi);
  });
}
```

## Implementation Details

### Block-Level Elements Detected

The method identifies the following elements as "paragraphs":

- `<p>`, `<div>` - Standard block elements
- `<h1>` through `<h6>` - Headings
- `<li>` - List items
- `<blockquote>`, `<pre>` - Specialized blocks
- `<article>`, `<section>`, `<aside>` - Semantic blocks
- `<header>`, `<footer>`, `<main>`, `<nav>` - Layout blocks
- `<figure>`, `<figcaption>` - Media blocks
- `<dd>`, `<dt>` - Definition list items

### CFI Generation

- Each paragraph's CFI is generated using `view.contents.cfiFromNode(element)`
- CFIs are compatible with epub.js annotation and navigation systems
- Can be used with `rendition.display(cfi)` for precise navigation
- Enable creation of annotations spanning specific paragraph ranges

### Performance Considerations

- Uses efficient DOM queries with `querySelectorAll()`
- Filters elements using native `range.intersectsNode()` method
- Only processes visible content within the current page
- Excludes empty paragraphs to reduce noise
- No DOM manipulation, only read operations

## Error Handling

Returns `null` if:

- Manager is not initialized
- No view is currently displayed
- Section is not available
- View or contents objects are missing
- CFI conversion fails

## Testing

To test the implementation:

1. Open `examples/current-text.html` in a browser
2. Navigate through pages using Prev/Next buttons
3. Click "Get Paragraphs" to see paragraph-level content
4. Verify that each paragraph shows both text and CFI
5. Test that paragraph count and content update when navigating

## Files Modified

1. `/src/rendition.js` - Added getCurrentViewParagraphs() and \_getBlockElementsInRange() methods
2. `/types/rendition.d.ts` - Added TypeScript definition
3. `/GET_CURRENT_TEXT.md` - Added related methods section
4. `/examples/current-text.html` - Enhanced example with paragraphs functionality

## Files Created

1. `/GET_CURRENT_PARAGRAPHS.md` - Comprehensive documentation
2. `/PARAGRAPHS_IMPLEMENTATION_SUMMARY.md` - This summary

## Dependencies

No new dependencies added. The implementation uses existing epub.js infrastructure:

- Manager system (already present)
- Views system (already present)
- Contents class with `cfiFromNode()` method (already present)
- EpubCFI class (already present)

## Backward Compatibility

✅ Fully backward compatible

- No breaking changes to existing APIs
- New method is additive only
- Does not modify any existing behavior

## Future Enhancements

Potential improvements for future versions:

- Add parameter to filter by element type (e.g., only headings)
- Add option to include/exclude nested elements
- Add method to get paragraphs from entire section (not just visible page)
- Add paragraph metadata (element type, classes, etc.)
- Add method to get paragraphs with HTML content preservation
