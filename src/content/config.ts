import { defineCollection, z } from 'astro:content';

const postsSchema = z.object({
  title: z.string(),
  date: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const postsCollection = defineCollection({
  type: 'content',
  schema: postsSchema,
});

// Define collections for each language
const zhHansPostsCollection = defineCollection({
  type: 'content',
  schema: postsSchema,
});

const zhHantPostsCollection = defineCollection({
  type: 'content',
  schema: postsSchema,
});

export const collections = {
  // Keep old posts collection for backwards compatibility
  posts: postsCollection,
  // New language-specific collections
  'zh-hans/posts': zhHansPostsCollection,
  'zh-hant/posts': zhHantPostsCollection,
};