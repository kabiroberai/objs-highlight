/*
Language: ObjectiveScript
Author: Kabir Oberai <me@kabiroberai.com>
Category: scripting
*/

// based on javascript.js

// NOTE: When building from Xcode, must run clean first
function(hljs) {
  var IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
  var OBJS_TYPE_KEYWORDS = 'void unsigned id long int char short float BOOL double Class SEL struct'
  var KEYWORDS = {
    keyword:
      'in of if for while finally var new function do return void else break catch ' +
      'instanceof with throw case default try this switch continue typeof delete ' +
      'let yield const export super debugger as async await static ' +
      // ECMAScript 6 modules import
      'import from as ' +
      // ObjectiveScript
      OBJS_TYPE_KEYWORDS + ' self @class @end @struct @function @sizeof @encode @cast %hook %end %orig',
    literal:
      'true false null undefined NaN Infinity',
    built_in:
      'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' +
      'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' +
      'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' +
      'TypeError URIError Number Math Date String RegExp Array Float32Array ' +
      'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' +
      'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' +
      'module Symbol Set Map WeakSet WeakMap Proxy Reflect Promise ' +
      // ObjectiveScript
      'defineBlock Pointer loadFunc box unbox hookClass defineClass'
  };

  var EXPRESSIONS;
  var NUMBER = {
    className: 'number',
    variants: [
      { begin: '\\b(0[bB][01]+)' },
      { begin: '\\b(0[oO][0-7]+)' },
      { begin: hljs.C_NUMBER_RE }
    ],
    relevance: 0
  };
  var SUBST = {
    className: 'subst',
    begin: '\\$\\{', end: '\\}',
    keywords: KEYWORDS,
    contains: []  // defined later
  };
  var TEMPLATE_STRING = {
    className: 'string',
    begin: '`', end: '`',
    contains: [
      hljs.BACKSLASH_ESCAPE,
      SUBST
    ]
  };
  SUBST.contains = [
    hljs.APOS_STRING_MODE,
    hljs.QUOTE_STRING_MODE,
    TEMPLATE_STRING,
    NUMBER,
    hljs.REGEXP_MODE
  ]
  var PARAMS_CONTAINS = SUBST.contains.concat([
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.C_LINE_COMMENT_MODE
  ]);

  var OBJC_CLASS_MODE = {
    // taken from objectivec.js
    className: 'built_in',
    begin: '\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+',
  };

  // include % and @ to support objs keywords
  var OBJS_LEXEMES = '[a-zA-Z@%]\\w*';

  return {
    aliases: ['objs'],
    keywords: KEYWORDS,
    lexemes: OBJS_LEXEMES,
    contains: [
      {
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      },
      {
        className: 'meta',
        begin: /^#!/, end: /$/
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      TEMPLATE_STRING,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBER,
      OBJC_CLASS_MODE,
      { // object attr container
        begin: /[{,]\s*/, relevance: 0,
        contains: [
          {
            begin: IDENT_RE + '\\s*:', returnBegin: true,
            relevance: 0,
            contains: [{className: 'attr', begin: IDENT_RE, relevance: 0}]
          }
        ]
      },
      {
        // OBJS hook
        // this has to be before the "value" container mode so that %hook takes precedence over the % operator
        className: 'class',
        keywords: KEYWORDS,
        lexemes: OBJS_LEXEMES,
        begin: '%hook', end: '\\{?$', excludeEnd: true,
        contains: [
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        keywords: KEYWORDS,
        lexemes: OBJS_LEXEMES,
        begin: '%end|%orig', end: '$'
      },
      { // "value" container
        begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
        keywords: 'return throw case',
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          hljs.REGEXP_MODE,
          {
            className: 'function',
            begin: '(\\(.*?\\)|' + IDENT_RE + ')\\s*=>', returnBegin: true,
            end: '\\s*=>',
            contains: [
              {
                className: 'params',
                variants: [
                  {
                    begin: IDENT_RE
                  },
                  {
                    begin: /\(\s*\)/,
                  },
                  {
                    begin: /\(/, end: /\)/,
                    excludeBegin: true, excludeEnd: true,
                    keywords: KEYWORDS,
                    contains: PARAMS_CONTAINS
                  }
                ]
              }
            ]
          },
        ],
        relevance: 0
      },
      {
        className: 'function',
        beginKeywords: 'function', end: /\{/, excludeEnd: true,
        contains: [
          hljs.inherit(hljs.TITLE_MODE, {begin: IDENT_RE}),
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            contains: PARAMS_CONTAINS
          }
        ],
        illegal: /\[|%/
      },
      {
        begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      },
      hljs.METHOD_GUARD,
      { // ES6 class
        className: 'class',
        beginKeywords: 'class', end: /[{;=]/, excludeEnd: true,
        illegal: /[:"\[\]]/,
        contains: [
          {beginKeywords: 'extends'},
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        beginKeywords: 'constructor', end: /\{/, excludeEnd: true
      },
      {
      	// OBJS class
      	className: 'class',
      	keywords: KEYWORDS,
      	lexemes: OBJS_LEXEMES,
        begin: '@class', end: /\{?$/, excludeEnd: true,
      	contains: [
      		hljs.UNDERSCORE_TITLE_MODE
      	]
      },
      {
        // OBJS method
      	className: 'function',
      	begin: /^\s*[-+]\s*\(.*?\)/,
      	end: /\{|$/, excludeEnd: true,
      	keywords: OBJS_TYPE_KEYWORDS
      },
      {
        className: 'function',
        lexemes: OBJS_LEXEMES,
        keywords: '@function ' + OBJS_TYPE_KEYWORDS,
        begin: '@function', end: /\)\;?$/,
        contains: [
          {
            // from cpp.js
            begin: hljs.IDENT_RE + '\\s*\\(', returnBegin: true,
            contains: [hljs.UNDERSCORE_TITLE_MODE],
          },
          OBJC_CLASS_MODE,
          NUMBER
        ]
      },
      {
        lexemes: OBJS_LEXEMES,
        keywords: '@extern ' + OBJS_TYPE_KEYWORDS,
        begin: '@extern', end: /\;?$/,
        contains: [
          OBJC_CLASS_MODE,
          {
            begin: hljs.IDENT_RE + '\\s*\\;?$', returnBegin: true,
            contains: [hljs.UNDERSCORE_TITLE_MODE],
          },
          NUMBER
        ]
      },
      {
        lexemes: OBJS_LEXEMES,
        keywords: '@struct ' + OBJS_TYPE_KEYWORDS,
        begin: '@struct', end: /{/,
        contains: [hljs.UNDERSCORE_TITLE_MODE]
      },
      {
        // taken from objectivec.js
        className: 'built_in',
        begin: '\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+',
      }
    ],
    illegal: /#(?!!)/
  };
}
