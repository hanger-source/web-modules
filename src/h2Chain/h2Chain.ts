import {util} from "../util/index.js";
import throttle from "lodash-es/throttle";

export {};  // 保证这是一个模块
type DomElement = HTMLElement | Document;
type QueryableElement = DomElement;
type ObservedElement = DomElement

type ObservedOptions = {
    queriedDoc?: QueryableElement;
    observedDoc?: ObservedElement;
    timeout?: number;
}

type SelectorOptions = ({ selector: string, textContent?: string} & ObservedOptions)
type FindOptions = SelectorOptions;
type ClickOptions = SelectorOptions;
type InputOptions = ({ textInput: string, mode?:InputMode } & SelectorOptions);
type InputMode = 'overwrite' | 'append'

type TargetLocator = () => ObservedTarget;

type ObservedTarget = {
    target: ObservedDomElementTarget['target'] | ObservedDomElementsTarget["target"] | any;
}

export type ObservedDomElementTarget = {
    target: DomElement
}

export type ObservedDomElementsTarget = {
    target: DomElement[]
}

type Clicked = { target: HTMLElement | HTMLElement[] }
type Found = ObservedTarget
type Inputted = ({ target: (HTMLInputElement | HTMLTextAreaElement) })

type DOMChangeCallback = (params: {
    mutations: MutationRecord[]; // 观察到的 DOM 变更记录
    observer: MutationObserver; // 当前的 MutationObserver 实例
    disconnect: DisconnectCallback;     // 用于断开观察的函数
}) => void;

type DisconnectCallback = () => void;

interface CallbackQueueItem {
    cb: DOMChangeCallback;
    callbackHash: number;
    removeCb: (observer: MutationObserver) => void;
}

type ObserverCbQueue = {
    observer: MutationObserver;
    callbackQueue: CallbackQueueItem[];
};

type ObserverDom = Document | HTMLElement;

type NullableObserverDom = ObserverDom | undefined;

interface DOMObserverOptions {
    timeout?: number;
    throttleInterval?: number;
}

const h2 = {
    observeDOMChanges: (() => {
        const observersMap = new WeakMap <ObserverDom, ObserverCbQueue> (); // WeakMap用于存储每个文档的 Observer 实例及其队列
        return (
            callback: DOMChangeCallback,
            // 如果没有传入观察的文档，则使用 document.body 或 document.documentElement
            observedDoc: NullableObserverDom = document.body || document.documentElement,
            { timeout = 600000, throttleInterval = 500 }: DOMObserverOptions = {}) => {
            // 检查是否已经存在 Observer 实例
            if (!observersMap.has(observedDoc)) {
                const callbackQueue: CallbackQueueItem[] = []; // 回调队列
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
            const { observer, callbackQueue } = observersMap.get(observedDoc)!;
            const callbackObj: CallbackQueueItem = {
                cb: h2.throttleWithTail(callback, throttleInterval),
                callbackHash: util.hashCode(callback.toString()),
                removeCb: (observer: MutationObserver) => {
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
            } else {
                console.log("[DOM观察器] 已存在相同哈希值回调，未重复添加。");
            }
        };
    })(),

    // 观察DOM变化函数
    throttleWithTail: (delegateFunc: DOMChangeCallback, limit: number): DOMChangeCallback => {
        return throttle(delegateFunc, limit);
    }, observeTarget: (
        observedDoc: NullableObserverDom,
        locateTargetFunc: TargetLocator,
        timeout: number | undefined): Promise<ObservedTarget> => {
        return new Promise <ObservedTarget> ((resolve, reject) => {
            const {target}:ObservedTarget = locateTargetFunc();
            if (target) {
                try {
                    resolve({target});
                } catch (err) {
                    console.error("[DOM观察器] onFound回调出错:", err);
                    reject(err);
                }
            } else {
                h2.observeDOMChanges(
                    ({ disconnect }) => {
                        const { target }:ObservedTarget = locateTargetFunc();
                        if (target) {
                            try {
                                resolve({target});
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

export type H2Chain = {
    findOne(options: FindOptions): Promise<ObservedDomElementTarget>;
    findAll(options: FindOptions): Promise<ObservedDomElementsTarget>;
    clickOne(options: ClickOptions): Promise<ObservedDomElementTarget>;
    clickAll(options: ClickOptions): Promise<ObservedDomElementsTarget>;
    input(options: InputOptions): Promise<ObservedDomElementTarget>;
};

export const h2c:H2Chain = {

    // 找到目标
    findOne(options: FindOptions): Promise<ObservedDomElementTarget> {
        const { selector, textContent, queriedDoc = document, observedDoc, timeout } = options
        const selectLocator: TargetLocator = () => {
            if (!textContent) {
                return { target: queriedDoc.querySelector(selector!) };
            } else {
                const target = Array.from(queriedDoc.querySelectorAll(selector!)).find((el) => el.textContent?.trim() === textContent);
                return { target };
            }
        }
        return h2.observeTarget(observedDoc, selectLocator, timeout);
    },

    findAll(options: FindOptions): Promise<ObservedDomElementsTarget> {
        const { selector, observedDoc, textContent, queriedDoc = document, timeout} = options
        const selectLocator: TargetLocator = () => {
            let elements = Array.from(queriedDoc.querySelectorAll(selector));
            if (textContent) {
                elements = elements.filter(el => el.textContent?.trim() === textContent);
            }
            const target = elements?.length > 0 ? elements : null;
            return { target };
        }
        return h2.observeTarget(observedDoc, selectLocator, timeout);
    },

    // 点击目标
    async clickOne(options: ClickOptions): Promise<ObservedDomElementTarget> {
        const findOptions: FindOptions = options;
        let found = await this.findOne(findOptions);
        const {target} = found as { target: HTMLElement };
        target.click();
        return found;
    },

    async clickAll(options: ClickOptions): Promise<ObservedDomElementsTarget> {
        const findOptions: FindOptions = options;
        let found = await this.findAll(findOptions);
        const { target } = found as { target: HTMLElement [] };
        target.forEach((el) => {
            el.click()
        });
        return found;
    },

    // 输入内容到文本框
    async input(options: InputOptions): Promise<ObservedDomElementTarget> {
        const findOptions: FindOptions ={ mode: options.mode ?? 'overwrite', ...options };
        let found = await this.findOne(findOptions);
        const { target } = found as Inputted;
        if (options.mode === "append") {
            target.value += options.textInput;
        } else {
            target.value = options.textInput;
        }
        target.focus();
        // target.setRangeText(options.textInput);
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return found;
    },
};