var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/splitting/dist/splitting.js
var require_splitting = __commonJS({
  "node_modules/splitting/dist/splitting.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.Splitting = factory();
    })(exports, (function() {
      "use strict";
      var root = document;
      var createText = root.createTextNode.bind(root);
      function setProperty(el, varName, value) {
        el.style.setProperty(varName, value);
      }
      function appendChild(el, child) {
        return el.appendChild(child);
      }
      function createElement(parent, key, text, whitespace) {
        var el = root.createElement("span");
        key && (el.className = key);
        if (text) {
          !whitespace && el.setAttribute("data-" + key, text);
          el.textContent = text;
        }
        return parent && appendChild(parent, el) || el;
      }
      function getData(el, key) {
        return el.getAttribute("data-" + key);
      }
      function $(e, parent) {
        return !e || e.length == 0 ? (
          // null or empty string returns empty array
          []
        ) : e.nodeName ? (
          // a single element is wrapped in an array
          [e]
        ) : (
          // selector and NodeList are converted to Element[]
          [].slice.call(e[0].nodeName ? e : (parent || root).querySelectorAll(e))
        );
      }
      function Array2D(len) {
        var a = [];
        for (; len--; ) {
          a[len] = [];
        }
        return a;
      }
      function each(items, consumer) {
        items && items.some(consumer);
      }
      function selectFrom(obj) {
        return function(key) {
          return obj[key];
        };
      }
      function index(element, key, items) {
        var prefix = "--" + key;
        var cssVar = prefix + "-index";
        each(items, function(items2, i) {
          if (Array.isArray(items2)) {
            each(items2, function(item) {
              setProperty(item, cssVar, i);
            });
          } else {
            setProperty(items2, cssVar, i);
          }
        });
        setProperty(element, prefix + "-total", items.length);
      }
      var plugins = {};
      function resolvePlugins(by, parent, deps) {
        var index2 = deps.indexOf(by);
        if (index2 == -1) {
          deps.unshift(by);
          var plugin = plugins[by];
          if (!plugin) {
            throw new Error("plugin not loaded: " + by);
          }
          each(plugin.depends, function(p) {
            resolvePlugins(p, by, deps);
          });
        } else {
          var indexOfParent = deps.indexOf(parent);
          deps.splice(index2, 1);
          deps.splice(indexOfParent, 0, by);
        }
        return deps;
      }
      function createPlugin(by, depends, key, split) {
        return {
          by,
          depends,
          key,
          split
        };
      }
      function resolve(by) {
        return resolvePlugins(by, 0, []).map(selectFrom(plugins));
      }
      function add(opts) {
        plugins[opts.by] = opts;
      }
      function splitText(el, key, splitOn, includePrevious, preserveWhitespace) {
        el.normalize();
        var elements = [];
        var F = document.createDocumentFragment();
        if (includePrevious) {
          elements.push(el.previousSibling);
        }
        var allElements = [];
        $(el.childNodes).some(function(next) {
          if (next.tagName && !next.hasChildNodes()) {
            allElements.push(next);
            return;
          }
          if (next.childNodes && next.childNodes.length) {
            allElements.push(next);
            elements.push.apply(elements, splitText(next, key, splitOn, includePrevious, preserveWhitespace));
            return;
          }
          var wholeText = next.wholeText || "";
          var contents = wholeText.trim();
          if (contents.length) {
            if (wholeText[0] === " ") {
              allElements.push(createText(" "));
            }
            var useSegmenter = splitOn === "" && typeof Intl.Segmenter === "function";
            each(useSegmenter ? Array.from(new Intl.Segmenter().segment(contents)).map(function(x) {
              return x.segment;
            }) : contents.split(splitOn), function(splitText2, i) {
              if (i && preserveWhitespace) {
                allElements.push(createElement(F, "whitespace", " ", preserveWhitespace));
              }
              var splitEl = createElement(F, key, splitText2);
              elements.push(splitEl);
              allElements.push(splitEl);
            });
            if (wholeText[wholeText.length - 1] === " ") {
              allElements.push(createText(" "));
            }
          }
        });
        each(allElements, function(el2) {
          appendChild(F, el2);
        });
        el.innerHTML = "";
        appendChild(el, F);
        return elements;
      }
      var _ = 0;
      function copy(dest, src) {
        for (var k in src) {
          dest[k] = src[k];
        }
        return dest;
      }
      var WORDS = "words";
      var wordPlugin = createPlugin(
        /* by= */
        WORDS,
        /* depends= */
        _,
        /* key= */
        "word",
        /* split= */
        function(el) {
          return splitText(el, "word", /\s+/, 0, 1);
        }
      );
      var CHARS = "chars";
      var charPlugin = createPlugin(
        /* by= */
        CHARS,
        /* depends= */
        [WORDS],
        /* key= */
        "char",
        /* split= */
        function(el, options, ctx) {
          var results = [];
          each(ctx[WORDS], function(word, i) {
            results.push.apply(results, splitText(word, "char", "", options.whitespace && i));
          });
          return results;
        }
      );
      function Splitting(opts) {
        opts = opts || {};
        var key = opts.key;
        return $(opts.target || "[data-splitting]").map(function(el) {
          var ctx = el["\u{1F34C}"];
          if (!opts.force && ctx) {
            return ctx;
          }
          ctx = el["\u{1F34C}"] = { el };
          var by = opts.by || getData(el, "splitting");
          if (!by || by == "true") {
            by = CHARS;
          }
          var items = resolve(by);
          var opts2 = copy({}, opts);
          each(items, function(plugin) {
            if (plugin.split) {
              var pluginBy = plugin.by;
              var key2 = (key ? "-" + key : "") + plugin.key;
              var results = plugin.split(el, opts2, ctx);
              key2 && index(el, key2, results);
              ctx[pluginBy] = results;
              el.classList.add(pluginBy);
            }
          });
          el.classList.add("splitting");
          return ctx;
        });
      }
      function html(opts) {
        opts = opts || {};
        var parent = opts.target = createElement();
        parent.innerHTML = opts.content;
        Splitting(opts);
        return parent.outerHTML;
      }
      Splitting.html = html;
      Splitting.add = add;
      function detectGrid(el, options, side) {
        var items = $(options.matching || el.children, el);
        var c = {};
        each(items, function(w) {
          var val = Math.round(w[side]);
          (c[val] || (c[val] = [])).push(w);
        });
        return Object.keys(c).map(Number).sort(byNumber).map(selectFrom(c));
      }
      function byNumber(a, b) {
        return a - b;
      }
      var linePlugin = createPlugin(
        /* by= */
        "lines",
        /* depends= */
        [WORDS],
        /* key= */
        "line",
        /* split= */
        function(el, options, ctx) {
          return detectGrid(el, { matching: ctx[WORDS] }, "offsetTop");
        }
      );
      var itemPlugin = createPlugin(
        /* by= */
        "items",
        /* depends= */
        _,
        /* key= */
        "item",
        /* split= */
        function(el, options) {
          return $(options.matching || el.children, el);
        }
      );
      var rowPlugin = createPlugin(
        /* by= */
        "rows",
        /* depends= */
        _,
        /* key= */
        "row",
        /* split= */
        function(el, options) {
          return detectGrid(el, options, "offsetTop");
        }
      );
      var columnPlugin = createPlugin(
        /* by= */
        "cols",
        /* depends= */
        _,
        /* key= */
        "col",
        /* split= */
        function(el, options) {
          return detectGrid(el, options, "offsetLeft");
        }
      );
      var gridPlugin = createPlugin(
        /* by= */
        "grid",
        /* depends= */
        ["rows", "cols"]
      );
      var LAYOUT = "layout";
      var layoutPlugin = createPlugin(
        /* by= */
        LAYOUT,
        /* depends= */
        _,
        /* key= */
        _,
        /* split= */
        function(el, opts) {
          var rows = opts.rows = +(opts.rows || getData(el, "rows") || 1);
          var columns = opts.columns = +(opts.columns || getData(el, "columns") || 1);
          opts.image = opts.image || getData(el, "image") || el.currentSrc || el.src;
          if (opts.image) {
            var img = $("img", el)[0];
            opts.image = img && (img.currentSrc || img.src);
          }
          if (opts.image) {
            setProperty(el, "background-image", "url(" + opts.image + ")");
          }
          var totalCells = rows * columns;
          var elements = [];
          var container = createElement(_, "cell-grid");
          while (totalCells--) {
            var cell = createElement(container, "cell");
            createElement(cell, "cell-inner");
            elements.push(cell);
          }
          appendChild(el, container);
          return elements;
        }
      );
      var cellRowPlugin = createPlugin(
        /* by= */
        "cellRows",
        /* depends= */
        [LAYOUT],
        /* key= */
        "row",
        /* split= */
        function(el, opts, ctx) {
          var rowCount = opts.rows;
          var result = Array2D(rowCount);
          each(ctx[LAYOUT], function(cell, i, src) {
            result[Math.floor(i / (src.length / rowCount))].push(cell);
          });
          return result;
        }
      );
      var cellColumnPlugin = createPlugin(
        /* by= */
        "cellColumns",
        /* depends= */
        [LAYOUT],
        /* key= */
        "col",
        /* split= */
        function(el, opts, ctx) {
          var columnCount = opts.columns;
          var result = Array2D(columnCount);
          each(ctx[LAYOUT], function(cell, i) {
            result[i % columnCount].push(cell);
          });
          return result;
        }
      );
      var cellPlugin = createPlugin(
        /* by= */
        "cells",
        /* depends= */
        ["cellRows", "cellColumns"],
        /* key= */
        "cell",
        /* split= */
        function(el, opt, ctx) {
          return ctx[LAYOUT];
        }
      );
      add(wordPlugin);
      add(charPlugin);
      add(linePlugin);
      add(itemPlugin);
      add(rowPlugin);
      add(columnPlugin);
      add(gridPlugin);
      add(layoutPlugin);
      add(cellRowPlugin);
      add(cellColumnPlugin);
      add(cellPlugin);
      return Splitting;
    }));
  }
});

// entry-splitting.mjs
var import_splitting = __toESM(require_splitting(), 1);
var export_default = import_splitting.default;
export {
  export_default as default
};
