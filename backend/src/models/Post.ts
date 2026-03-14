import prisma from '../config/prisma';

type ReactionInput = {
  user: string;
  type?: string;
};

type PostInput = {
  _id?: string;
  title?: string;
  content: string;
  author?: string;
  authorId?: string;
  category?: string;
  visibility?: string;
  tags?: string[];
  isSchoolUpdate?: boolean;
  isFeatured?: boolean;
  attachments?: unknown;
  externalLinks?: string[];
  mentions?: string[];
  reactions?: ReactionInput[];
  bookmarks?: string[];
  sharedPost?: string;
  sharedPostId?: string;
  shareType?: string;
  shareCount?: number;
  commentCount?: number;
};

const mapWhere = (query: any = {}) => {
  const where: any = {};

  if (query.author) where.authorId = String(query.author);
  if (query.category) where.category = String(query.category);
  if (query.visibility) where.visibility = String(query.visibility);
  if (query.isSchoolUpdate !== undefined) where.isSchoolUpdate = Boolean(query.isSchoolUpdate);
  if (query.isFeatured !== undefined) where.isFeatured = Boolean(query.isFeatured);

  if (query.tags?.$in && Array.isArray(query.tags.$in)) {
    where.tags = { hasSome: query.tags.$in };
  }

  if (query.bookmarks) {
    where.bookmarks = { some: { id: String(query.bookmarks) } };
  }

  if (query.attachments?.$exists && query.attachments?.$ne) {
    where.NOT = { attachments: { equals: [] } };
  }

  if (query.$or && Array.isArray(query.$or)) {
    where.OR = query.$or
      .map((condition: any) => {
        const [[field, value]] = Object.entries(condition);
        if (!value || typeof value !== 'object') return null;
        if ('$regex' in value) {
          return { [field]: { contains: String(value.$regex), mode: 'insensitive' } };
        }
        return null;
      })
      .filter(Boolean);
  }

  return where;
};

const normalizePost = (record: any) => {
  const reactions = (record.reactions || []).map((reaction: any) => ({
    user: reaction.userId,
    type: reaction.type
  }));

  const bookmarks = (record.bookmarks || []).map((bookmark: any) => bookmark.id);

  return {
    ...record,
    _id: record.id,
    author: record.author,
    mentions: record.mentions,
    sharedPost: record.sharedPost
      ? {
          ...record.sharedPost,
          _id: record.sharedPost.id,
          author: record.sharedPost.author
        }
      : null,
    reactions,
    bookmarks,
    toObject() {
      return { ...this };
    }
  };
};

class PostQuery {
  private where: any;
  private orderBy: any = { createdAt: 'desc' };
  private take?: number;
  private skipValue = 0;

  constructor(where: any) {
    this.where = where;
  }

  populate(_path: any, _select?: any) {
    return this;
  }

  select(_selection: string) {
    return this;
  }

  sort(sortInput: Record<string, 1 | -1>) {
    const [field, direction] = Object.entries(sortInput)[0] || ['createdAt', -1];
    this.orderBy = { [field]: direction === 1 ? 'asc' : 'desc' };
    return this;
  }

  skip(value: number) {
    this.skipValue = value;
    return this;
  }

  limit(value: number) {
    this.take = value;
    return this;
  }

  lean() {
    return this;
  }

  private async execute() {
    const records = await prisma.post.findMany({
      where: this.where,
      include: {
        author: true,
        mentions: true,
        sharedPost: { include: { author: true } },
        bookmarks: { select: { id: true } },
        reactions: true
      },
      orderBy: this.orderBy,
      skip: this.skipValue,
      take: this.take
    });

    return records.map(normalizePost);
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any | TResult> {
    return this.execute().catch(onrejected as any);
  }

  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.execute().finally(onfinally as any);
  }
}

class SinglePostQuery {
  constructor(private readonly id: string) {}

  populate(_path: any, _select?: any) {
    return this;
  }

  select(_selection: string) {
    return this;
  }

  lean() {
    return this;
  }

  private async execute() {
    const record = await prisma.post.findUnique({
      where: { id: this.id },
      include: {
        author: true,
        mentions: true,
        sharedPost: { include: { author: true } },
        bookmarks: { select: { id: true } },
        reactions: true
      }
    });

    return record ? normalizePost(record) : null;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any | TResult> {
    return this.execute().catch(onrejected as any);
  }

  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.execute().finally(onfinally as any);
  }
}

class PostDocument {
  _id?: string;
  [key: string]: any;

  constructor(data: PostInput) {
    Object.assign(this, data);
    this._id = data._id;
  }

  async save() {
    const data = {
      title: this.title,
      content: this.content,
      authorId: this.author || this.authorId,
      category: this.category || 'general',
      visibility: this.visibility || 'public',
      tags: this.tags || [],
      isSchoolUpdate: Boolean(this.isSchoolUpdate),
      isFeatured: Boolean(this.isFeatured),
      attachments: this.attachments || [],
      externalLinks: this.externalLinks || [],
      shareType: this.shareType,
      shareCount: this.shareCount || 0,
      commentCount: this.commentCount || 0,
      sharedPostId: this.sharedPost || this.sharedPostId || null
    };

    if (!this._id) {
      const created = await prisma.post.create({
        data: {
          ...data,
          mentions: this.mentions?.length ? { connect: this.mentions.map((id) => ({ id })) } : undefined,
          bookmarks: this.bookmarks?.length ? { connect: this.bookmarks.map((id) => ({ id })) } : undefined
        }
      });
      this._id = created.id;

      if (this.reactions?.length) {
        await prisma.postReaction.createMany({
          data: this.reactions.map((reaction: ReactionInput) => ({
            postId: created.id,
            userId: reaction.user,
            type: reaction.type || 'like'
          })),
          skipDuplicates: true
        });
      }

      return this;
    }

    await prisma.post.update({
      where: { id: this._id },
      data: {
        ...data,
        mentions: this.mentions ? { set: this.mentions.map((id: string) => ({ id })) } : undefined,
        bookmarks: this.bookmarks ? { set: this.bookmarks.map((id: string) => ({ id })) } : undefined
      }
    });

    await prisma.postReaction.deleteMany({ where: { postId: this._id } });
    if (this.reactions?.length) {
      await prisma.postReaction.createMany({
        data: this.reactions.map((reaction: ReactionInput) => ({
          postId: this._id as string,
          userId: reaction.user,
          type: reaction.type || 'like'
        })),
        skipDuplicates: true
      });
    }

    return this;
  }

  toObject() {
    return { ...this };
  }
}

const PostModel: any = class extends PostDocument {
  static find(query: any = {}) {
    return new PostQuery(mapWhere(query));
  }

  static findById(id: string) {
    return new SinglePostQuery(id);
  }

  static async countDocuments(query: any = {}) {
    return prisma.post.count({ where: mapWhere(query) });
  }

  static findByIdAndUpdate(id: string, update: any) {
    const normalizedUpdate = { ...update };

    if (normalizedUpdate.$inc) {
      for (const [field, value] of Object.entries(normalizedUpdate.$inc)) {
        normalizedUpdate[field] = { increment: Number(value) };
      }
      delete normalizedUpdate.$inc;
    }

    const runner = async () => {
      await prisma.post.update({ where: { id }, data: normalizedUpdate });
      return new SinglePostQuery(id);
    };

    const proxy: any = {
      populate() {
        return this;
      },
      lean() {
        return this;
      },
      then(onfulfilled: any, onrejected: any) {
        return runner().then((query) => query.then(onfulfilled, onrejected));
      }
    };

    return proxy;
  }

  static async findByIdAndDelete(id: string) {
    return prisma.post.delete({ where: { id } });
  }
};

export default PostModel;
