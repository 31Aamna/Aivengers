import { Search } from 'lucide-react'
import Button from './Button.jsx'
export default function EmptyState({ query, onClear }) { return <div className="empty-state"><div className="empty-state__icon"><Search size={23} /></div><h3>No signals found{query ? ` for “${query}”` : ''}.</h3><p>Try a broader search or clear the current filters to see what is moving nearby.</p><Button variant="secondary" onClick={onClear}>Clear filters</Button></div> }
