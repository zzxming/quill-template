/**
 * 生成随机id
 * @param {void}
 * @return {string} 返回一个随机id
 */
export const randomId = () => Math.random().toString(36).slice(2);
