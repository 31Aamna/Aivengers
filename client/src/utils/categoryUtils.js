import { categoryConfig } from '../mockData.js'

export function categoryLabel(categoryKey) {
  return categoryConfig[categoryKey]?.label || categoryKey
}

export function categoryAccent(categoryKey) {
  return categoryConfig[categoryKey]?.color || 'amber'
}
