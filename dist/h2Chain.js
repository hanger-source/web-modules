import { util } from "./util.js";
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
var Symbol$1 = root.Symbol;
var objectProto$1 = Object.prototype;
var hasOwnProperty = objectProto$1.hasOwnProperty;
var nativeObjectToString$1 = objectProto$1.toString;
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag$1), tag = value[symToStringTag$1];
  try {
    value[symToStringTag$1] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}
var objectProto = Object.prototype;
var nativeObjectToString = objectProto.toString;
function objectToString(value) {
  return nativeObjectToString.call(value);
}
var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
}
var reWhitespace = /\s/;
function trimmedEndIndex(string) {
  var index = string.length;
  while (index-- && reWhitespace.test(string.charAt(index))) {
  }
  return index;
}
var reTrimStart = /^\s+/;
function baseTrim(string) {
  return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
}
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var NAN = 0 / 0;
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
var reIsBinary = /^0b[01]+$/i;
var reIsOctal = /^0o[0-7]+$/i;
var freeParseInt = parseInt;
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var now = function() {
  return root.Date.now();
};
var FUNC_ERROR_TEXT$1 = "Expected a function";
var nativeMax = Math.max, nativeMin = Math.min;
function debounce(func, wait, options) {
  var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT$1);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = "maxWait" in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  function invokeFunc(time) {
    var args = lastArgs, thisArg = lastThis;
    lastArgs = lastThis = void 0;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }
  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
    return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }
  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }
  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }
  function trailingEdge(time) {
    timerId = void 0;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = void 0;
    return result;
  }
  function cancel() {
    if (timerId !== void 0) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = void 0;
  }
  function flush() {
    return timerId === void 0 ? result : trailingEdge(now());
  }
  function debounced() {
    var time = now(), isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === void 0) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === void 0) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}
var FUNC_ERROR_TEXT = "Expected a function";
function throttle(func, wait, options) {
  var leading = true, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = "leading" in options ? !!options.leading : leading;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    "leading": leading,
    "maxWait": wait,
    "trailing": trailing
  });
}
const h2 = {
  observeDOMChanges: /* @__PURE__ */ (() => {
    const observersMap = /* @__PURE__ */ new WeakMap();
    return (callback, observedDoc = document.body || document.documentElement, { timeout = 6e5, throttleInterval = 500 } = {}) => {
      if (!observersMap.has(observedDoc)) {
        const callbackQueue2 = [];
        const observer2 = new MutationObserver((mutations, observer3) => {
          const executeCallbacks = () => {
            if (callbackQueue2.length > 0) {
              for (const { cb, removeCb } of callbackQueue2) {
                cb({
                  mutations,
                  observer: observer3,
                  disconnect: () => removeCb(observer3)
                });
              }
            }
          };
          executeCallbacks();
        });
        const initializeObserver = () => {
          observer2.observe(observedDoc, {
            attributes: true,
            childList: true,
            subtree: true
          });
        };
        observersMap.set(observedDoc, { observer: observer2, callbackQueue: callbackQueue2 });
        initializeObserver();
      }
      const { observer, callbackQueue } = observersMap.get(observedDoc);
      const callbackObj = {
        cb: h2.throttleWithTail(callback, throttleInterval),
        callbackHash: util.hashCode(callback.toString()),
        removeCb: (observer2) => {
          const index = callbackQueue.indexOf(callbackObj);
          if (index !== -1) {
            const funcInfo = callback.toString().slice(0, 100);
            callbackQueue.splice(index, 1);
            console.log(`[DOM观察器] 回调移除成功: 函数片段=${funcInfo}，剩余回调数量=${callbackQueue.length}`);
          }
          if (callbackQueue.length === 0) {
            observersMap.delete(observedDoc);
            observer2.disconnect();
            console.log(`[DOM观察器] 所有回调移除，观察器已断开。`);
          }
        }
      };
      if (!callbackQueue.some((obj) => obj.callbackHash === callbackObj.callbackHash)) {
        callbackQueue.push(callbackObj);
        setTimeout(() => callbackObj.removeCb(observer), timeout);
        console.log(`[DOM观察器] 添加回调，队列长度: ${callbackQueue.length}`);
      } else {
        console.log("[DOM观察器] 已存在相同哈希值回调，未重复添加。");
      }
    };
  })(),
  // 观察DOM变化函数
  throttleWithTail: (delegateFunc, limit) => {
    return throttle(delegateFunc, limit);
  },
  observeTarget: (observedDoc, locateTargetFunc, timeout) => {
    return new Promise((resolve, reject) => {
      const { target } = locateTargetFunc();
      if (target) {
        try {
          resolve({ target });
        } catch (err) {
          console.error("[DOM观察器] onFound回调出错:", err);
          reject(err);
        }
      } else {
        h2.observeDOMChanges(
          ({ disconnect }) => {
            const { target: target2 } = locateTargetFunc();
            if (target2) {
              try {
                resolve({ target: target2 });
              } catch (err) {
                console.error("[DOM观察器] onFound回调出错:", err);
                reject(err);
              } finally {
                disconnect();
              }
            }
          },
          observedDoc,
          { timeout }
        );
      }
    });
  }
};
const h2c = {
  // 找到目标
  findOne(options) {
    const { selector, textContent, queriedDoc = document, observedDoc, timeout } = options;
    const selectLocator = () => {
      if (!textContent) {
        return { target: queriedDoc.querySelector(selector) };
      } else {
        const target = Array.from(queriedDoc.querySelectorAll(selector)).find((el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) === textContent;
        });
        return { target };
      }
    };
    return h2.observeTarget(observedDoc, selectLocator, timeout);
  },
  findAll(options) {
    const { selector, observedDoc, textContent, queriedDoc = document, timeout } = options;
    const selectLocator = () => {
      let elements = Array.from(queriedDoc.querySelectorAll(selector));
      if (textContent) {
        elements = elements.filter((el) => {
          var _a;
          return ((_a = el.textContent) == null ? void 0 : _a.trim()) === textContent;
        });
      }
      const target = (elements == null ? void 0 : elements.length) > 0 ? elements : null;
      return { target };
    };
    return h2.observeTarget(observedDoc, selectLocator, timeout);
  },
  // 点击目标
  async clickOne(options) {
    const findOptions = options;
    let found = await this.findOne(findOptions);
    const { target } = found;
    target.click();
    return found;
  },
  async clickAll(options) {
    const findOptions = options;
    let found = await this.findAll(findOptions);
    const { target } = found;
    target.forEach((el) => {
      el.click();
    });
    return found;
  },
  // 输入内容到文本框
  async input(options) {
    const findOptions = options;
    let found = await this.findOne(findOptions);
    const { target } = found;
    if (target.value !== options.textInput) {
      target.focus();
      target.setRangeText(options.textInput);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return found;
  }
};
export {
  h2c
};
