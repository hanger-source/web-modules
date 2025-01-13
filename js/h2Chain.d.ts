export {};
type DomElement = HTMLElement | Document;
type QueryableElement = DomElement;
type ObservedElement = DomElement;
type ObservedOptions = {
    queriedDoc?: QueryableElement;
    observedDoc?: ObservedElement;
    timeout?: number;
};
type SelectorOptions = ({
    selector: string;
    textContent?: string;
} & ObservedOptions);
type FindOptions = SelectorOptions;
type ClickOptions = SelectorOptions;
type InputOptions = ({
    textInput: string;
} & SelectorOptions);
export type ObservedDomElementTarget = {
    target: DomElement;
};
export type ObservedDomElementsTarget = {
    target: DomElement[];
};
export type H2Chain = {
    findOne(options: FindOptions): Promise<ObservedDomElementTarget>;
    findAll(options: FindOptions): Promise<ObservedDomElementsTarget>;
    clickOne(options: ClickOptions): Promise<ObservedDomElementTarget>;
    clickAll(options: ClickOptions): Promise<ObservedDomElementsTarget>;
    input(options: InputOptions): Promise<ObservedDomElementTarget>;
};
export declare const h2c: H2Chain;
