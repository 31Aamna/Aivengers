import { AlertTriangle, Bell, Briefcase, PackageSearch } from 'lucide-react'

export const categoryConfig = {
  all: { label: 'All signals', short: 'All signals', color: 'ink' },
  internships: { label: 'Internships & Scholarships', short: 'Opportunities', color: 'violet' },
  lost: { label: 'Lost & Found', short: 'Lost & Found', color: 'blue' },
  issues: { label: 'Local Issues & Emergencies', short: 'Local issues', color: 'coral' },
  events: { label: 'Events & Announcements', short: 'Events', color: 'amber' },
}

export const categoryIcon = { internships: Briefcase, lost: PackageSearch, issues: AlertTriangle, events: Bell }

