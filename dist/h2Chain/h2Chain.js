import { util } from "../util/util";
const h2 = {
    observeDOMChanges: (() => {
        const observersMap = new WeakMap(); // WeakMap用于存储每个文档的 Observer 实例及其队列
        return (callback, 
        // 如果没有传入观察的文档，则使用 document.body 或 document.documentElement
        observedDoc = document.body || document.documentElement, { timeout = 600000, throttleInterval = 500 } = {}) => {
            // 检查是否已经存在 Observer 实例
            if (!observersMap.has(observedDoc)) {
                const callbackQueue = []; // 回调队列
                const observer = new MutationObserver((mutations, observer) => {
                    // 执行队列中的回调
                    const executeCallbacks = () => {
                        if (callbackQueue.length > 0) {
                            for (const { cb, removeCb } of callbackQueue) {
                                cb({
                                    mutations,
                                    observer,
                                    disconnect: () => removeCb(observer),
                                });
                            }
                        }
                    };
                    executeCallbacks();
                });
                // 初始化观察器
                const initializeObserver = () => {
                    observer.observe(observedDoc, {
                        attributes: true,
                        childList: true,
                        subtree: true,
                    });
                };
                observersMap.set(observedDoc, { observer, callbackQueue });
                initializeObserver();
            }
            // 获取现有的 Observer 实例和队列
            const { observer, callbackQueue } = observersMap.get(observedDoc);
            const callbackObj = {
                cb: h2.throttleWithTail(callback, throttleInterval),
                callbackHash: util.hashCode(callback.toString()),
                removeCb: (observer) => {
                    // 移除当前回调
                    const index = callbackQueue.indexOf(callbackObj);
                    if (index !== -1) {
                        const funcInfo = callback.toString().slice(0, 100);
                        callbackQueue.splice(index, 1); // 移除指定回调
                        console.log(`[DOM观察器] 回调移除成功: 函数片段=${funcInfo}，剩余回调数量=${callbackQueue.length}`);
                    }
                    if (callbackQueue.length === 0) {
                        // 使用 WeakMap.delete
                        observersMap.delete(observedDoc);
                        observer.disconnect();
                        console.log(`[DOM观察器] 所有回调移除，观察器已断开。`);
                    }
                },
            };
            if (!callbackQueue.some((obj) => obj.callbackHash === callbackObj.callbackHash)) {
                callbackQueue.push(callbackObj);
                setTimeout(() => callbackObj.removeCb(observer), timeout);
                console.log(`[DOM观察器] 添加回调，队列长度: ${callbackQueue.length}`);
            }
            else {
                console.log("[DOM观察器] 已存在相同哈希值回调，未重复添加。");
            }
        };
    })(),
    // 观察DOM变化函数
    throttleWithTail: (delegateFunc, limit) => {
        let lastCall = 0; // 上次调用的时间戳
        let timeout = null; // 定时器 ID
        let pending = false; // 是否有等待执行的尾调用
        return (params) => {
            const now = Date.now();
            if (now - lastCall >= limit) {
                // 如果超过限流时间，立即执行函数
                lastCall = now;
                delegateFunc(params);
                if (timeout) {
                    clearTimeout(timeout);
                }
                pending = false;
            }
            else if (!pending) {
                // 如果尚未计划尾调用，则设置一个定时器
                pending = true;
                timeout = setTimeout(() => {
                    lastCall = Date.now();
                    delegateFunc(params);
                    pending = false; // 尾调用完成后重置标志位
                }, limit - (now - lastCall));
            }
        };
    }, observeTarget: (observedDoc, locateTargetFunc, timeout) => {
        return new Promise((resolve, reject) => {
            const { target } = locateTargetFunc();
            if (target) {
                try {
                    resolve({ target });
                }
                catch (err) {
                    console.error("[DOM观察器] onFound回调出错:", err);
                    reject(err);
                }
            }
            else {
                h2.observeDOMChanges(({ disconnect }) => {
                    const { target } = locateTargetFunc();
                    if (target) {
                        try {
                            resolve({ target });
                        }
                        catch (err) {
                            console.error("[DOM观察器] onFound回调出错:", err);
                            reject(err);
                        }
                        finally {
                            disconnect();
                        }
                    }
                }, observedDoc, { timeout });
            }
        });
    }
};
export const h2c = {
    // 找到目标
    findOne(options) {
        const { selector, textContent, queriedDoc = document, observedDoc, timeout } = options;
        const selectLocator = () => {
            if (!textContent) {
                return { target: queriedDoc.querySelector(selector) };
            }
            else {
                const target = Array.from(queriedDoc.querySelectorAll(selector)).find((el) => el.textContent?.trim() === textContent);
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
                elements = elements.filter(el => el.textContent?.trim() === textContent);
            }
            const target = elements?.length > 0 ? elements : null;
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
    },
};
