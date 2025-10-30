import "@testing-library/jest-dom";

// Polyfill for TextEncoder/TextDecoder
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for ReadableStream and other Web APIs
if (typeof global.ReadableStream === "undefined") {
  require("web-streams-polyfill");
}
