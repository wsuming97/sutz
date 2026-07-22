/**
 * 兼容 HTTP 和 HTTPS 环境的通用剪贴板复制工具
 * 优先使用现代 navigator.clipboard.writeText API，受阻时自动降级使用 document.execCommand
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 优先尝试现代 Clipboard API (需 HTTPS / localhost)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn("navigator.clipboard.writeText 失败，尝试 fallback: ", e);
    }
  }

  // Fallback 方案：使用隐藏的 textarea + execCommand("copy") (支持 HTTP)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("execCommand 复制失败: ", err);
    return false;
  }
}
