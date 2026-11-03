/**
 * 可预期的用户错误：路由层把它翻成 `{ok:false, code, error}`，
 * 不打印堆栈，也不把内部异常当成 200。
 *
 * @module @uponnoise/dsh-code-review/lib/errors
 */
export class CodeReviewError extends Error {
  /**
   * @param {string} code 稳定的机器可读错误码。
   * @param {string} message 给用户看的中文说明。
   * @param {number} [status] 建议的 HTTP 状态码。
   */
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'CodeReviewError';
    this.code = code;
    this.status = status;
  }
}
