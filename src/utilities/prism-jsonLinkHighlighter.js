// This is a module that creates hyperlinks in a JSON highlighted document
// generated by prism. It is not directly a prism plugin but rather a function
// that works with the HTML string generated by the prism highlighter.

// The specific rules on how to highlight is in ./linkHighlighterRules.js

import each from 'lodash/each';
import has from 'lodash/has';
import linkHighlighterRules from './linkHighlighterRules';

// @param {string} code - Valid html generated by prism.js in JSON language mode
// @returns {string} code - Valid html string but with some spans converted to anchors
export default function jsonLinkHighlighter(code) {
  let parser = new DOMParser();
  let document = parser.parseFromString(code, 'text/html');
  let body = document.childNodes[0].childNodes[1];

  // Edit the token elements in place
  each(body.children, (token, index) => {
    if (token.className.indexOf('property') > 0) {
      annotatePropertyToken(token);
    }
  });
  return body.innerHTML;
}

// Takes in a property highlighted item. If functionality is defined for it's
// corresponding property (only string type supported) and the content is valid,
// then we will turn the value node into a link.
// @param {HTMLElement} propertyToken - The token element of property type (assigned by prism)
let highlightableTokenClasses = {
  'token string': true,
  'token boolean': true,
  'token number': true,
}
function annotatePropertyToken(propertyToken) {
  validatePropertyTokenSiblings(propertyToken);
  let valueToken = propertyToken.nextElementSibling.nextElementSibling;
  if (!has(highlightableTokenClasses, valueToken.className)) {
    return;
  }

  let urlGenerator = linkHighlighterRules[unQuote(propertyToken.innerHTML)];
  if (typeof urlGenerator === 'undefined') {
    return;
  }

  let safeUnescapedValueText = valueToken.innerHTML.replace(/\&amp;/g, '&');
  let href = urlGenerator(unQuote(safeUnescapedValueText));
  if (typeof href === 'undefined') {
    return;
  }
  nodeToAnchor(valueToken, href);
}

// Validate the siblings so that the highlighter will fail fast if some unexpected
// changes happen such as the prism output changing.
let validSecondSiblingClasses = {
  'token punctuation': true,
  'token string': true,
  'token boolean': true,
  'token number': true,
  'token null': true,
  'token property': true, // Prism.js incorrectly parses strings with escape sequences
}
function validatePropertyTokenSiblings(propertyToken) {
  let firstSibling = propertyToken.nextElementSibling;
  let secondSibling = firstSibling.nextElementSibling;

  if (firstSibling.className !== 'token operator') {
    throw new Error('Prism jsonLinkHighlighter: Unexpected first sibling to property token with class: ' + firstSibling.className);
  }

  if (!has(validSecondSiblingClasses, secondSibling.className)) {
    throw new Error('Prism jsonLinkHighlighter: Unexpected second sibling to property token with class: ' + secondSibling.className);
  }
}

// Converts a span into an anchor. Only preserves className
// @param {HTMLElement} node - Item to be converted to an anchor
// @param {string} href - Url to link to
function nodeToAnchor(node, href) {
  node.outerHTML = `<a href="${href}" class="${node.className}">${node.innerHTML}</a>`;
}

function unQuote(input) {
  return input.substring(1, input.length - 1);
}
