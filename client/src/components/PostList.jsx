import PostCard from './PostCard.jsx'
import EmptyState from './EmptyState.jsx'
export default function PostList({ posts, query, onClear, onUpdate, onNotify }) { if (!posts.length) return <EmptyState query={query} onClear={onClear} />; return <div>{posts.map((post) => <PostCard key={post.id} post={post} onUpdate={onUpdate} onNotify={onNotify} />)}</div> }
