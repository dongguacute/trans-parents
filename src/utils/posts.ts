import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

// 緩存文章列表
let cachedPosts: Post[] | null = null;

/**
 * 高性能獲取所有文章（帶緩存）
 */
export async function getAllPosts(): Promise<Post[]> {
  if (cachedPosts) {
    return cachedPosts;
  }
  
  cachedPosts = await getCollection('posts');
  return cachedPosts;
}

/**
 * 獲取已排序的文章列表（按日期降序）
 */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.sort((a, b) => 
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
}

/**
 * 根據 slug 獲取單篇文章
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}

/**
 * 獲取分頁文章
 */
export async function getPaginatedPosts(page: number = 1, pageSize: number = 10) {
  const posts = await getSortedPosts();
  const totalPages = Math.ceil(posts.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    posts: posts.slice(startIndex, endIndex),
    currentPage: page,
    totalPages,
    totalPosts: posts.length,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * 獲取相關文章（基於分類或標籤）
 */
export async function getRelatedPosts(currentPost: Post, limit: number = 3): Promise<Post[]> {
  const allPosts = await getSortedPosts();
  
  // 排除當前文章
  const otherPosts = allPosts.filter(post => post.slug !== currentPost.slug);
  
  // 計算相關性分數
  const postsWithScore = otherPosts.map(post => {
    let score = 0;
    
    // 相同分類加分
    if (currentPost.data.category && post.data.category === currentPost.data.category) {
      score += 10;
    }
    
    // 共同標籤加分
    if (currentPost.data.tags && post.data.tags) {
      const commonTags = currentPost.data.tags.filter(tag => 
        post.data.tags?.includes(tag)
      );
      score += commonTags.length * 5;
    }
    
    return { post, score };
  });
  
  // 按分數排序並返回前 N 篇
  return postsWithScore
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}