/**
 * 资源路径处理工具
 */

const IMAGE_PREFIX = 'https://v6.gh-proxy.org/https://github.com/GutsGo/factopia/raw/main/public';

/**
 * 将相对路径或本地路径转换为生产环境下的 CDN/代理路径
 * @param path 路径
 * @returns 处理后的路径
 */
export function resolveImageUrl(path: any): string {
  if (typeof path !== 'string' || !path) return '';

  // 如果是完整的 http(s) 路径，直接返回
  if (path.startsWith('http')) return path;

  // 这里判断：只有如果是以 images/ 开头的路径才处理
  // 或者用户希望所有 public 路径都处理？
  // 根据要求：对于加载 images 下的图片，在生产环境下给图片加上前缀

  // 生产环境逻辑
  if (import.meta.env.PROD) {
    // 确保路径开头没有 /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // 如果是 images/ 开头的路径，加上前缀
    if (cleanPath.startsWith('images/')) {
      return `${IMAGE_PREFIX}/${cleanPath}`;
    }
  }

  // 开发环境或非 images 路径返回原路径（确保开头有 / 以便 Vite 正确处理 public 资源）
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 判断是否为 URL 路径
 */
export function isUrl(str: any): boolean {
  return typeof str === 'string' && (str.startsWith('http') || str.startsWith('/') || str.startsWith('images/'));
}
