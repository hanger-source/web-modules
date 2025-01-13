export const util = {
    hashCode: (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i); // 获取字符的 Unicode 编码
            hash = (hash << 5) - hash + char; // 左移并加上当前字符的值
            hash |= 0; // 转为 32 位整数
        }
        return hash;
    },
};