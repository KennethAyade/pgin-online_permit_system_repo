/**
 * Polyfills for MSW (Mock Service Worker) in Jest environment
 * This file loads before other setup files to ensure fetch globals are available
 */

// Install whatwg-fetch polyfill for MSW
import 'whatwg-fetch'

// Ensure TextEncoder/TextDecoder are available
if (typeof global.TextEncoder === 'undefined') {
  const util = require('util')
  global.TextEncoder = util.TextEncoder
  global.TextDecoder = util.TextDecoder
}

// Polyfill web streams for MSW
if (typeof global.TransformStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill')
  global.ReadableStream = ReadableStream
  global.WritableStream = WritableStream
  global.TransformStream = TransformStream
}
