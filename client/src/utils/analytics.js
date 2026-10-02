export function track(event, properties = {}) {
    try {
      const safeProperties = Object.fromEntries(Object.entries(properties).filter(([key]) => !/password|token|key|content|description|body/i.test(key)))
      window.dispatchEvent(new CustomEvent('techtonix:analytics', { detail: { event, ...safeProperties } }))
    } catch {
      // Analytics is intentionally best-effort and never blocks the product.
    }
  }
  