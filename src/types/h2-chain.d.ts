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

export type H2Chain = {
    findOne(options: FindOptions): Promise<ObservedDomElementTarget>;
    findAll(options: FindOptions): Promise<ObservedDomElementsTarget>;
    clickOne(options: ClickOptions): Promise<ObservedDomElementTarget>;
    clickAll(options: ClickOptions): Promise<ObservedDomElementsTarget>;
    input(options: InputOptions): Promise<ObservedDomElementTarget>;
};