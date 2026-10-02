import { Check } from 'lucide-react'
import { categoryConfig } from '../mockData.js'
export default function CategoryFilter({ value, onChange }) { return <div className="category-filters" aria-label="Filter by category">{Object.entries(categoryConfig).map(([key, config]) => <button key={key} className={`filter-pill ${value === key ? 'is-selected' : ''} filter-pill--${config.color}`} type="button" onClick={() => onChange(key)}>{config.short}{value === key && <Check size={14} />}</button>)}</div> }
