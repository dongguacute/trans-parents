import { getCollection, type CollectionEntry } from 'astro:content';
import { pinyin } from 'pinyin-pro';
import articlesData from '../data/articles.json';

export type Post = CollectionEntry<'posts'> | any;

export interface ArticleInfo {
  id: number;
  slug: string;
  order: number;
  group: string;
}

export interface GroupInfo {
  name: {
    'zh-hans': string;
    'zh-hant': string;
  };
  order: number;
  color: string;
}

/**
 * 根据语言获取group的名称
 */
export function getGroupName(groupInfo: GroupInfo | undefined, lang?: string): string {
  if (!groupInfo) return '';
  const effectiveLang = (lang || 'zh-hans') as 'zh-hans' | 'zh-hant';
  return groupInfo.name[effectiveLang] || groupInfo.name['zh-hans'];
}

// 緩存文章列表 - 按语言缓存
const cachedPostsByLang = new Map<string, Post[]>();

// 緩存單篇文章渲染內容
const cachedPostRenders = new Map<string, any>();

/**
 * 根据语言获取对应的集合名称
 */
function getCollectionNameByLang(lang?: string): 'posts' | 'zh-hans/posts' | 'zh-hant/posts' {
  if (!lang || lang === 'zh-hans') {
    return 'zh-hans/posts';
  } else if (lang === 'zh-hant') {
    return 'zh-hant/posts';
  }
  // 默认返回 zh-hans
  return 'zh-hans/posts';
}

/**
 * 高性能獲取所有文章（帶緩存）- 支持多语言
 */
export async function getAllPosts(lang?: string): Promise<Post[]> {
  const effectiveLang = lang || 'zh-hans';

  if (cachedPostsByLang.has(effectiveLang)) {
    return cachedPostsByLang.get(effectiveLang)!;
  }

  const collectionName = getCollectionNameByLang(effectiveLang);
  const posts = await getCollection(collectionName as any) as Post[];
  cachedPostsByLang.set(effectiveLang, posts);

  return posts;
}

/**
 * 獲取已排序的文章列表（按日期降序）
 */
export async function getSortedPosts(lang?: string): Promise<Post[]> {
  const posts = await getAllPosts(lang);
  return posts.sort((a, b) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
}

/**
 * 根據 slug 獲取單篇文章（帶緩存）
 */
export async function getPostBySlug(slug: string, lang?: string): Promise<Post | undefined> {
  const posts = await getAllPosts(lang);
  return posts.find(post => post.slug === slug);
}

/**
 * 獲取文章渲染內容（帶緩存）
 */
export async function getPostRender(slug: string, lang?: string): Promise<any | undefined> {
  const cacheKey = `${lang || 'zh-hans'}-${slug}`;

  if (cachedPostRenders.has(cacheKey)) {
    return cachedPostRenders.get(cacheKey);
  }

  const post = await getPostBySlug(slug, lang);
  if (!post) return undefined;

  const render = await post.render();
  cachedPostRenders.set(cacheKey, render);
  return render;
}

/**
 * 獲取分頁文章
 */
export async function getPaginatedPosts(page: number = 1, pageSize: number = 10, lang?: string) {
  const posts = await getSortedPosts(lang);
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
export async function getRelatedPosts(currentPost: Post, limit: number = 3, lang?: string): Promise<Post[]> {
  const allPosts = await getSortedPosts(lang);

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
      const commonTags = currentPost.data.tags.filter((tag: string) =>
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

/**
 * 检查文本是否匹配搜索查询（支持拼音搜索和模糊匹配）
 * 兼容各种输入法：拼音、五笔、仓颉、速成、注音等
 */
function matchesQuery(text: string, query: string): boolean {
  if (!text || !query) {
    return false;
  }
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  
  // 空查询返回 false
  if (lowerQuery === '') {
    return false;
  }
  
  // 1. 直接文本匹配（支持所有输入法输入的中文字符）
  if (lowerText.includes(lowerQuery)) {
    return true;
  }
  
  // 2. 拼音匹配（支持汉语拼音输入）
  try {
    // 2.1 全拼匹配（无音调）
    const pinyinFull = pinyin(text, { toneType: 'none', type: 'array' }).join('');
    if (pinyinFull.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // 2.2 首字母匹配
    const pinyinFirst = pinyin(text, { pattern: 'first', type: 'array' }).join('');
    if (pinyinFirst.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // 2.3 全拼（无分隔符）
    const pinyinNoSeparator = pinyin(text, { toneType: 'none', separator: '' });
    if (pinyinNoSeparator.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // 2.4 全拼（带空格分隔）
    const pinyinWithSpace = pinyin(text, { toneType: 'none', separator: ' ' });
    if (pinyinWithSpace.toLowerCase().includes(lowerQuery)) {
      return true;
    }
  } catch (error) {
    // 如果拼音转换失败，忽略错误继续
    console.error('Pinyin conversion error:', error);
  }
  
  // 3. 逐字符模糊匹配（支持部分字符匹配）
  // 这对使用五笔、仓颉等输入法的用户特别有用
  // 因为他们输入的中文可以被逐字匹配
  const textChars = Array.from(text);
  const queryChars = Array.from(lowerQuery);
  
  // 检查查询的每个字符是否都在文本中出现（顺序不限）
  const allCharsMatch = queryChars.every(char =>
    textChars.some(textChar => textChar.toLowerCase() === char)
  );
  
  if (allCharsMatch && queryChars.length >= 2) {
    return true;
  }
  
  return false;
}

/**
 * 搜索文章（支持标题、描述、标签搜索，兼容拼音搜索）
 */
export interface SearchOptions {
  query?: string;
  tags?: string[];
  group?: string;
}

export async function searchPosts(options: SearchOptions, lang?: string): Promise<Post[]> {
  const allPosts = await getAllPosts(lang);
  const { query, tags, group } = options;

  return allPosts.filter(post => {
    // 如果没有任何搜索条件，返回所有文章
    if (!query && (!tags || tags.length === 0) && !group) {
      return true;
    }

    let matches = true;

    // 搜索查询（标题和描述，支持拼音）
    if (query) {
      const titleMatch = matchesQuery(post.data.title, query);
      const descriptionMatch = post.data.description
        ? matchesQuery(post.data.description, query)
        : false;
      matches = matches && (titleMatch || descriptionMatch);
    }

    // 标签筛选
    if (tags && tags.length > 0 && post.data.tags) {
      const hasMatchingTag = tags.some(tag =>
        post.data.tags?.includes(tag)
      );
      matches = matches && hasMatchingTag;
    }

    // Group 筛选（需要从 articles.json 获取）
    // 这个将在组件中处理

    return matches;
  });
}


/**
 * 获取文章的group信息
 */
export function getArticleInfo(slug: string): ArticleInfo | undefined {
  return articlesData.articles.find(article => article.slug === slug);
}

/**
 * 获取group信息
 */
export function getGroupInfo(groupSlug: string): GroupInfo | undefined {
  return articlesData.groups[groupSlug as keyof typeof articlesData.groups];
}

/**
 * 获取同一group的所有文章（按order排序）
 */
export async function getGroupPosts(groupSlug: string, lang?: string): Promise<Array<Post & { articleInfo: ArticleInfo }>> {
  const allPosts = await getAllPosts(lang);
  const groupArticles = articlesData.articles
    .filter(article => article.group === groupSlug)
    .sort((a, b) => a.order - b.order);

  const groupPosts = groupArticles
    .map(article => {
      const post = allPosts.find(p => p.slug === article.slug);
      if (post) {
        return { ...post, articleInfo: article };
      }
      return null;
    })
    .filter((post): post is Post & { articleInfo: ArticleInfo } => post !== null);

  return groupPosts;
}

/**
 * 获取下一个group的第一篇文章
 */
export async function getNextGroupFirstArticle(currentGroupSlug: string, lang?: string): Promise<(Post & { articleInfo: ArticleInfo; groupInfo: GroupInfo }) | null> {
  const allPosts = await getAllPosts(lang);
  const currentGroupInfo = getGroupInfo(currentGroupSlug);

  if (!currentGroupInfo) {
    return null;
  }

  // 获取所有group并按order排序
  const sortedGroups = Object.entries(articlesData.groups)
    .map(([slug, info]) => ({ slug, ...info }))
    .sort((a, b) => a.order - b.order);

  // 找到当前group的索引
  const currentGroupIndex = sortedGroups.findIndex(g => g.slug === currentGroupSlug);

  if (currentGroupIndex === -1 || currentGroupIndex >= sortedGroups.length - 1) {
    return null; // 已经是最后一个group
  }

  // 获取下一个group
  const nextGroup = sortedGroups[currentGroupIndex + 1];

  // 获取下一个group的第一篇文章
  const nextGroupArticles = articlesData.articles
    .filter(article => article.group === nextGroup.slug)
    .sort((a, b) => a.order - b.order);

  if (nextGroupArticles.length === 0) {
    return null;
  }

  const firstArticle = nextGroupArticles[0];
  const post = allPosts.find(p => p.slug === firstArticle.slug);

  if (!post) {
    return null;
  }

  return {
    ...post,
    articleInfo: firstArticle,
    groupInfo: nextGroup as GroupInfo
  };
}

/**
 * 获取文章在其group中的位置信息
 */
export async function getArticlePosition(slug: string, lang?: string): Promise<{
  currentIndex: number;
  total: number;
  prevArticle?: Post & { articleInfo: ArticleInfo };
  nextArticle?: Post & { articleInfo: ArticleInfo };
  groupPosts: Array<Post & { articleInfo: ArticleInfo }>;
  groupInfo?: GroupInfo;
  nextGroupFirstArticle?: Post & { articleInfo: ArticleInfo; groupInfo: GroupInfo };
} | null> {
  const articleInfo = getArticleInfo(slug);
  if (!articleInfo) {
    return null;
  }

  const groupPosts = await getGroupPosts(articleInfo.group, lang);
  const currentIndex = groupPosts.findIndex(post => post.slug === slug);

  if (currentIndex === -1) {
    return null;
  }

  const isLastInGroup = currentIndex === groupPosts.length - 1;
  const nextGroupFirst = isLastInGroup ? await getNextGroupFirstArticle(articleInfo.group, lang) : undefined;

  return {
    currentIndex,
    total: groupPosts.length,
    prevArticle: currentIndex > 0 ? groupPosts[currentIndex - 1] : undefined,
    nextArticle: currentIndex < groupPosts.length - 1 ? groupPosts[currentIndex + 1] : undefined,
    groupPosts,
    groupInfo: getGroupInfo(articleInfo.group),
    nextGroupFirstArticle: nextGroupFirst || undefined,
  };
}
/**
 * 获取所有唯一的标签
 */
export async function getAllTags(lang?: string): Promise<string[]> {
  const posts = await getAllPosts(lang);
  const tagsSet = new Set<string>();

  posts.forEach(post => {
    if (post.data.tags) {
      post.data.tags.forEach((tag: string) => tagsSet.add(tag));
    }
  });

  return Array.from(tagsSet).sort();
}