export type FindElementByTextParams = {
    selector: string;
    textContent: string;
    docRoot?: Document;
};
export declare const domHelper: {
    findElementByText: ({ selector, textContent, docRoot }: FindElementByTextParams) => HTMLElement | null;
};
