# Highlight Element CFI

This document describes the new `highlightElement()` method added to the Rendition class, which allows highlighting entire elements based on a single CFI (Canonical Fragment Identifier).

## Overview

The `highlightElement()` method converts a single CFI to a CFI range that covers the entire element, then applies highlighting using the existing annotation system. This is useful when you want to highlight an entire paragraph, heading, or other block element rather than just a text selection.

## Method Signature

```javascript
highlightElement(
  cfi,
  (data = {}),
  cb,
  (className = "epubjs-hl"),
  (styles = {})
);
```

### Parameters

- **`cfi`** (string): EpubCFI string pointing to an element
- **`data`** (object, optional): Data to assign to the highlight annotation
- **`cb`** (function, optional): Callback function called when the highlight is clicked
- **`className`** (string, optional): CSS class to assign to the highlight (default: "epubjs-hl")
- **`styles`** (object, optional): CSS styles to apply to the highlight

### Returns

- **Promise**: Resolves when the highlight is successfully applied, rejects with an error if highlighting fails

## Usage Examples

### Basic Usage

```javascript
// Highlight an element at the current location
const location = rendition.currentLocation();
await rendition.highlightElement(location.start.cfi);
```

### With Custom Data and Click Handler

```javascript
await rendition.highlightElement(
  "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05])",
  {
    note: "This is an important paragraph",
    timestamp: new Date().toISOString(),
  },
  (e) => {
    console.log("Highlight clicked!", e.target);
    // Handle click event
  }
);
```

### With Custom Styling

```javascript
await rendition.highlightElement(
  cfiString,
  {},
  null,
  "custom-highlight-class",
  {
    fill: "rgba(255, 165, 0, 0.4)", // Orange highlight
    stroke: "rgba(255, 165, 0, 0.8)",
    "stroke-width": "2px",
    "mix-blend-mode": "multiply",
  }
);
```

### Highlighting Multiple Elements

```javascript
const cfiList = [
  "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05])",
  "epubcfi(/6/4[chap01ref]!/4[body01]/10[para06])",
  "epubcfi(/6/4[chap01ref]!/4[body01]/10[para07])",
];

for (const cfi of cfiList) {
  await rendition.highlightElement(cfi, {
    elementId: cfi,
    timestamp: new Date().toISOString(),
  });
}
```

## How It Works

1. **CFI Parsing**: The method parses the provided CFI string using the EpubCFI class
2. **View Resolution**: Finds the appropriate view that contains the CFI
3. **DOM Conversion**: Converts the CFI to a DOM range to locate the target element
4. **Element Detection**: Determines the containing element (handles both element and text node CFIs)
5. **Range Creation**: Creates a new DOM range that covers the entire element
6. **CFI Range Generation**: Converts the element range back to a CFI range
7. **Highlight Application**: Uses the existing `annotations.highlight()` method to apply the highlight

## Error Handling

The method handles various error conditions:

- **Manager not available**: Returns a rejected promise if the rendition manager is not initialized
- **View not found**: Returns an error if no view contains the specified CFI
- **DOM conversion failure**: Returns an error if the CFI cannot be converted to a DOM range
- **Element not found**: Returns an error if the target element cannot be located

## CSS Styling

You can customize the appearance of element highlights using CSS:

```css
.epubjs-hl {
  fill: yellow;
  fill-opacity: 0.3;
  mix-blend-mode: multiply;
}

.custom-highlight-class {
  fill: rgba(255, 165, 0, 0.4);
  stroke: rgba(255, 165, 0, 0.8);
  stroke-width: 2px;
}
```

## Integration with Existing Features

The `highlightElement()` method integrates seamlessly with existing epub.js features:

- **Annotations System**: Uses the same annotation storage and management system
- **Event Handling**: Supports click events and other annotation interactions
- **Theme System**: Highlights respect theme settings and can be styled accordingly
- **View Management**: Works with all view managers (default, continuous, etc.)

## TypeScript Support

Type definitions are included for TypeScript projects:

```typescript
highlightElement(
    cfi: string,
    data?: object,
    cb?: Function,
    className?: string,
    styles?: object
): Promise<void>;
```

## Testing

Test files are provided to verify the functionality:

- `test-highlight-element.html`: Interactive browser test
- `test-highlight-element.js`: JavaScript test examples
- `HIGHLIGHT_ELEMENT_CFI.md`: This documentation

## Browser Compatibility

The method works in all modern browsers that support:

- DOM Range API
- Promise API
- ES6 features (const, let, arrow functions)

## Performance Considerations

- The method performs DOM operations, so it should be used judiciously
- For highlighting many elements, consider batching operations
- The CFI-to-DOM conversion is relatively fast but can be optimized for large documents

## Future Enhancements

Potential improvements for future versions:

- Batch highlighting for multiple elements
- Animation support for highlight appearance/disappearance
- Integration with selection-based highlighting
- Support for nested element highlighting
