import { LoaderCircle } from 'lucide-react'
export default function Loading({ label = 'Loading...' }) { return <div className="loading-state"><LoaderCircle size={19} className="spin" /><span>{label}</span></div> }
