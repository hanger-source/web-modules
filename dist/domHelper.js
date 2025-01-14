const domHelper = {
  findElementByText: ({ selector, textContent, docRoot = document }) => {
    const elements = docRoot.querySelectorAll(selector);
    return Array.from(elements).find(
      (el) => {
        var _a;
        return ((_a = el.textContent) == null ? void 0 : _a.trim()) === textContent;
      }
    ) || null;
  }
};
export {
  domHelper
};
