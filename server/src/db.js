import { Client, Databases, Query, ID } from 'node-appwrite';
import bcrypt from 'bcryptjs';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');

if (process.env.APPWRITE_API_KEY) {
  client.setKey(process.env.APPWRITE_API_KEY);
}

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';

class Model {
  constructor(collectionId) {
    this.collectionId = collectionId;
  }

  _map(doc) {
    if (!doc) return null;
    return {
      ...doc,
      _id: doc.$id,
      id: doc.$id,
      toJSON: function() { return this; }
    };
  }

  async findOne(query = {}) {
    let queries = [];
    for (const [k, v] of Object.entries(query)) {
      queries.push(Query.equal(k, v));
    }
    queries.push(Query.limit(1));
    try {
      const result = await databases.listDocuments(DB_ID, this.collectionId, queries);
      if (result.documents.length === 0) return null;
      
      const doc = this._map(result.documents[0]);
      doc.save = async () => {
        const payload = { ...doc };
        delete payload._id;
        delete payload.id;
        delete payload.toJSON;
        delete payload.save;
        delete payload.$id;
        delete payload.$collectionId;
        delete payload.$databaseId;
        delete payload.$createdAt;
        delete payload.$updatedAt;
        delete payload.$permissions;
        await databases.updateDocument(DB_ID, this.collectionId, doc.$id, payload);
      };
      return doc;
    } catch {
      return null;
    }
  }

  async findById(id) {
    if (!id) return null;
    try {
      const doc = await databases.getDocument(DB_ID, this.collectionId, id.toString());
      const mapped = this._map(doc);
      mapped.save = async () => {
        const payload = { ...mapped };
        delete payload._id;
        delete payload.id;
        delete payload.toJSON;
        delete payload.save;
        delete payload.$id;
        delete payload.$collectionId;
        delete payload.$databaseId;
        delete payload.$createdAt;
        delete payload.$updatedAt;
        delete payload.$permissions;
        await databases.updateDocument(DB_ID, this.collectionId, mapped.$id, payload);
      };
      mapped.select = () => mapped;
      mapped.lean = () => mapped;
      return mapped;
    } catch {
      return null;
    }
  }

  find(query = {}) {
    const that = this;
    const qBuilder = {
      _limit: null,
      _sort: null,
      select: function() { return this; },
      sort: function(conf) { this._sort = conf; return this; },
      limit: function(l) { this._limit = l; return this; },
      skip: function(s) { this._skip = s; return this; },
      lean: function() { return this; },
      then: async function(resolve, reject) {
        try {
          let queries = [];
          if (query && typeof query === 'object') {
            for (const [k, v] of Object.entries(query)) {
              if (k !== 'tags' && k !== 'category' && typeof v !== 'object') {
                 queries.push(Query.equal(k, v));
              }
            }
          }
          if (this._limit) queries.push(Query.limit(this._limit));
          else queries.push(Query.limit(100)); // Default Appwrite limit max

          if (this._sort) {
            for (const [k, v] of Object.entries(this._sort)) {
              if (v === -1 || v === 'asc') queries.push(Query.orderDesc(k));
              else queries.push(Query.orderAsc(k));
            }
          }
          const result = await databases.listDocuments(DB_ID, that.collectionId, queries);
          resolve(result.documents.map(d => that._map(d)));
        } catch (err) {
          if (reject) reject(err);
        }
      }
    };
    return qBuilder;
  }

  async findByIdAndUpdate(id, data, opts) {
    const payload = { ...data };
    delete payload._id; delete payload.id; delete payload.$id;
    if (payload.$addToSet && payload.$addToSet.viewers) {
      try {
        const doc = await databases.getDocument(DB_ID, this.collectionId, id);
        let viewers = doc.viewers || [];
        if (!viewers.includes(payload.$addToSet.viewers)) {
          viewers.push(payload.$addToSet.viewers);
          await databases.updateDocument(DB_ID, this.collectionId, id, { viewers });
        }
        return this._map(doc);
      } catch { return null; }
    }
    const doc = await databases.updateDocument(DB_ID, this.collectionId, id, payload);
    return this._map(doc);
  }

  async findOneAndUpdate(query, data) {
    const doc = await this.findOne(query);
    if (!doc) return null;
    return this.findByIdAndUpdate(doc.$id, data);
  }

  async findByIdAndDelete(id) {
    try {
      await databases.deleteDocument(DB_ID, this.collectionId, id);
      return true;
    } catch {
      return false;
    }
  }

  async create(data) {
    const payload = { ...data };
    delete payload._id; delete payload.id;
    
    if (this.collectionId === 'news' || this.collectionId === 'reels') {
      if (!payload.published_at) payload.published_at = new Date().toISOString();
      if (!payload.views) payload.views = 0;
    }
    
    try {
      const doc = await databases.createDocument(DB_ID, this.collectionId, ID.unique(), payload);
      const mapped = this._map(doc);
      mapped.save = async () => {};
      return mapped;
    } catch(err) {
      console.error(err);
      return null;
    }
  }
  
  async aggregate(pipes) {
     const result = await databases.listDocuments(DB_ID, this.collectionId, [Query.limit(100)]);
     const tagsObj = {};
     result.documents.forEach(d => {
       if (d.tags && Array.isArray(d.tags)) {
         d.tags.forEach(t => {
           tagsObj[t] = (tagsObj[t] || 0) + 1;
         });
       }
     });
     return Object.entries(tagsObj).sort((a,b) => b[1] - a[1]).slice(0, 10).map(kv => ({ _id: kv[0], count: kv[1] }));
  }
}

export const Admin = new Model('admins');
export const News = new Model('news');
export const Reel = new Model('reels');
export const Status = new Model('status');
export const SiteSettings = new Model('settings');
export const ReelComment = new Model('comments');
export const SavedReel = new Model('saved_reels');
export const UserProfile = new Model('profiles');

export const initDb = async () => {
  console.log('🚀 Appwrite DB Wrapper initialized. Mongoose overridden successfully!');
};
