export type FindElementByTextParams = {
    selector: string;       // CSS选择器字符串
    textContent: string;    // 需要匹配的文本内容
    docRoot?: Document;     // 可选的文档根节点，默认为 `document`
};

export const domHelper = {
    findElementByText: ({ selector, textContent, docRoot = document }: FindElementByTextParams): HTMLElement | null => {
        // 查询所有符合选择器的元素
        const elements = docRoot.querySelectorAll(selector);

        // 查找第一个文本内容匹配的元素并返回，若没有找到则返回 null
        return (
            Array.from(elements).find(
                (el) => el.textContent?.trim() === textContent
            ) as HTMLElement || null
        );
    },
};