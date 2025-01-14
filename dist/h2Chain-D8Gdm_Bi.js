import { util } from "./util.js";
import throttle from "https://cdn.jsdelivr.net/npm/lodash-es/throttle.min.js";
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
  h2c as h
};
