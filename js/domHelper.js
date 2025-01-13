export const domHelper = {
    findElementByText: ({ selector, textContent, docRoot = document }) => {
        // 查询所有符合选择器的元素
        const elements = docRoot.querySelectorAll(selector);
        // 查找第一个文本内容匹配的元素并返回，若没有找到则返回 null
        return (Array.from(elements).find((el) => el.textContent?.trim() === textContent) || null);
    },
};
