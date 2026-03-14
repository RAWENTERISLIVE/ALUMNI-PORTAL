"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
const mapWhere = (query = {}) => {
    const where = {};
    if (query.author)
        where.authorId = String(query.author);
    if (query.category)
        where.category = String(query.category);
    if (query.visibility)
        where.visibility = String(query.visibility);
    if (query.isSchoolUpdate !== undefined)
        where.isSchoolUpdate = Boolean(query.isSchoolUpdate);
    if (query.isFeatured !== undefined)
        where.isFeatured = Boolean(query.isFeatured);
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
            .map((condition) => {
            const [[field, value]] = Object.entries(condition);
            if (!value || typeof value !== 'object')
                return null;
            if ('$regex' in value) {
                return { [field]: { contains: String(value.$regex), mode: 'insensitive' } };
            }
            return null;
        })
            .filter(Boolean);
    }
    return where;
};
const normalizePost = (record) => {
    const reactions = (record.reactions || []).map((reaction) => ({
        user: reaction.userId,
        type: reaction.type
    }));
    const bookmarks = (record.bookmarks || []).map((bookmark) => bookmark.id);
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
    constructor(where) {
        this.orderBy = { createdAt: 'desc' };
        this.skipValue = 0;
        this.where = where;
    }
    populate(_path, _select) {
        return this;
    }
    select(_selection) {
        return this;
    }
    sort(sortInput) {
        const [field, direction] = Object.entries(sortInput)[0] || ['createdAt', -1];
        this.orderBy = { [field]: direction === 1 ? 'asc' : 'desc' };
        return this;
    }
    skip(value) {
        this.skipValue = value;
        return this;
    }
    limit(value) {
        this.take = value;
        return this;
    }
    lean() {
        return this;
    }
    async execute() {
        const records = await prisma_1.default.post.findMany({
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
    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.execute().catch(onrejected);
    }
    finally(onfinally) {
        return this.execute().finally(onfinally);
    }
}
class SinglePostQuery {
    constructor(id) {
        this.id = id;
    }
    populate(_path, _select) {
        return this;
    }
    select(_selection) {
        return this;
    }
    lean() {
        return this;
    }
    async execute() {
        const record = await prisma_1.default.post.findUnique({
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
    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.execute().catch(onrejected);
    }
    finally(onfinally) {
        return this.execute().finally(onfinally);
    }
}
class PostDocument {
    constructor(data) {
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
            const created = await prisma_1.default.post.create({
                data: {
                    ...data,
                    mentions: this.mentions?.length ? { connect: this.mentions.map((id) => ({ id })) } : undefined,
                    bookmarks: this.bookmarks?.length ? { connect: this.bookmarks.map((id) => ({ id })) } : undefined
                }
            });
            this._id = created.id;
            if (this.reactions?.length) {
                await prisma_1.default.postReaction.createMany({
                    data: this.reactions.map((reaction) => ({
                        postId: created.id,
                        userId: reaction.user,
                        type: reaction.type || 'like'
                    })),
                    skipDuplicates: true
                });
            }
            return this;
        }
        await prisma_1.default.post.update({
            where: { id: this._id },
            data: {
                ...data,
                mentions: this.mentions ? { set: this.mentions.map((id) => ({ id })) } : undefined,
                bookmarks: this.bookmarks ? { set: this.bookmarks.map((id) => ({ id })) } : undefined
            }
        });
        await prisma_1.default.postReaction.deleteMany({ where: { postId: this._id } });
        if (this.reactions?.length) {
            await prisma_1.default.postReaction.createMany({
                data: this.reactions.map((reaction) => ({
                    postId: this._id,
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
const PostModel = class extends PostDocument {
    static find(query = {}) {
        return new PostQuery(mapWhere(query));
    }
    static findById(id) {
        return new SinglePostQuery(id);
    }
    static async countDocuments(query = {}) {
        return prisma_1.default.post.count({ where: mapWhere(query) });
    }
    static findByIdAndUpdate(id, update) {
        const normalizedUpdate = { ...update };
        if (normalizedUpdate.$inc) {
            for (const [field, value] of Object.entries(normalizedUpdate.$inc)) {
                normalizedUpdate[field] = { increment: Number(value) };
            }
            delete normalizedUpdate.$inc;
        }
        const runner = async () => {
            await prisma_1.default.post.update({ where: { id }, data: normalizedUpdate });
            return new SinglePostQuery(id);
        };
        const proxy = {
            populate() {
                return this;
            },
            lean() {
                return this;
            },
            then(onfulfilled, onrejected) {
                return runner().then((query) => query.then(onfulfilled, onrejected));
            }
        };
        return proxy;
    }
    static async findByIdAndDelete(id) {
        return prisma_1.default.post.delete({ where: { id } });
    }
};
exports.default = PostModel;
//# sourceMappingURL=Post.js.map