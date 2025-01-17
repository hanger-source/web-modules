export type FindElementByTextParams = {
    selector: string;       // CSS选择器字符串
    textContent: string;    // 需要匹配的文本内容
    docRoot?: Document;     // 可选的文档根节点，默认为 `document`
};