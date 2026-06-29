import bcrypt from 'bcryptjs';
import { databases, Query, ID, APPWRITE_DB_ID } from './appwrite.js';
import fs from 'fs';
import path from 'path';

export let useOfflineFallback = true; // Default to true to prevent hangs, will verify connection in initDb

const getFallbackFilePath = (collectionId) => {
  return path.resolve(process.cwd(), 'data', `${collectionId}_fallback.json`);
};

export const readFallbackData = (collectionId) => {
  const filePath = getFallbackFilePath(collectionId);
  if (!fs.existsSync(filePath)) {
    if (collectionId === 'admins') {
      return [
        {
          "name": "Preetam Singh Yadav ",
          "email": "vipno1official@gmail.com",
          "password_hash": "$2a$10$WLOxEmru4/v2RFpMp1XyBuB.lwFbBIu/ikRFb.Ulct9/b9B5Ffj7q",
          "role": "superadmin",
          "status": "active",
          "bio": "Admin of DenceWance",
          "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80",
          "id": "69d663c300013ae31bb4",
          "_id": "69d663c300013ae31bb4",
          "created_at": "2026-04-08T14:18:43.289Z",
          "updated_at": "2026-05-24T04:25:00.553Z"
        }
      ];
    }
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading fallback JSON for ${collectionId}:`, err);
    return [];
  }
};

export const writeFallbackData = (collectionId, data) => {
  const filePath = getFallbackFilePath(collectionId);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing fallback JSON for ${collectionId}:`, err);
  }
};

export const mapFallbackDoc = (doc) => {
  if (!doc) return null;
  const id = doc.id || doc._id || doc.$id || Math.random().toString(36).substring(2, 11);
  return {
    ...doc,
    $id: id,
    _id: id,
    id: id,
    $createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
    $updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString(),
  };
};

const matchesQuery = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const [k, v] of Object.entries(query)) {
    if (k === '$or' && Array.isArray(v)) {
      const matched = v.some(subQuery => matchesQuery(doc, subQuery));
      if (!matched) return false;
    } else if (k !== '$or') {
      const field = normalizeFieldName(k);
      const val = doc[field];
      
      if (v instanceof RegExp) {
        if (!val || !v.test(String(val))) return false;
      } else if (Array.isArray(v)) {
        if (!v.includes(val)) return false;
      } else if (typeof v === 'object' && v !== null) {
        if (v.$in && Array.isArray(v.$in)) {
          if (!v.$in.includes(val)) return false;
        }
        if (v.$regex) {
          const regex = new RegExp(v.$regex, v.$options || '');
          if (!val || !regex.test(String(val))) return false;
        }
      } else {
        if (val !== v) return false;
      }
    }
  }
  return true;
};

const DB_ID = APPWRITE_DB_ID;
const timestampNow = () => new Date().toISOString();

const normalizeFieldName = (key) => {
  if (key === '$createdAt') return 'created_at';
  if (key === '$updatedAt') return 'updated_at';
  return key;
};

const normalizeSettingsPayload = (payload = {}) => {
  const next = { ...payload };
  const campaign = next.campaign && typeof next.campaign === 'object' ? next.campaign : null;

  if (campaign) {
    next.campaign_enabled = campaign.enabled ?? false;
    next.campaign_mode = campaign.mode ?? 'banner';
    next.campaign_title = campaign.title ?? '';
    next.campaign_subtitle = campaign.subtitle ?? '';
    next.campaign_description = campaign.description ?? '';
    next.campaign_ctaText = campaign.ctaText ?? '';
    next.campaign_ctaUrl = campaign.ctaUrl ?? '';
    next.campaign_mediaType = campaign.mediaType ?? 'none';
    next.campaign_mediaUrl = campaign.mediaUrl ?? '';
    next.campaign_startAt = campaign.startAt ?? '';
    next.campaign_endAt = campaign.endAt ?? '';
    next.campaign_dismissHours = campaign.dismissHours ?? 24;
    next.campaign_allowDismiss = campaign.allowDismiss ?? true;
    next.campaign_openInNewTab = campaign.openInNewTab ?? true;
    delete next.campaign;
  }

  return next;
};

const normalizePayloadValues = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizePayloadValues).filter((entry) => entry !== undefined);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key, normalizePayloadValues(entry)])
      .filter(([, entry]) => entry !== undefined)
  );
};

const stripDocumentMeta = (doc) => {
  const payload = { ...doc };
  delete payload._id;
  delete payload.id;
  delete payload.toJSON;
  delete payload.save;
  delete payload.deleteOne;
  delete payload.select;
  delete payload.lean;
  delete payload.$id;
  delete payload.$collectionId;
  delete payload.$databaseId;
  delete payload.$createdAt;
  delete payload.$updatedAt;
  delete payload.$permissions;
  return payload;
};

const buildSettingsDocument = (doc) => {
  const mapped = toDocument(doc);
  if (!mapped) return null;

  mapped.campaign = {
    enabled: mapped.campaign_enabled ?? false,
    mode: mapped.campaign_mode ?? 'banner',
    title: mapped.campaign_title ?? '',
    subtitle: mapped.campaign_subtitle ?? '',
    description: mapped.campaign_description ?? '',
    ctaText: mapped.campaign_ctaText ?? '',
    ctaUrl: mapped.campaign_ctaUrl ?? '',
    mediaType: mapped.campaign_mediaType ?? 'none',
    mediaUrl: mapped.campaign_mediaUrl ?? '',
    startAt: mapped.campaign_startAt ?? '',
    endAt: mapped.campaign_endAt ?? '',
    dismissHours: mapped.campaign_dismissHours ?? 24,
    allowDismiss: mapped.campaign_allowDismiss ?? true,
    openInNewTab: mapped.campaign_openInNewTab ?? true,
  };

  return mapped;
};

const prepareCreatePayload = (collectionId, data) => {
  let payload = stripDocumentMeta(data);
  if (collectionId === 'settings') payload = normalizeSettingsPayload(payload);
  payload = normalizePayloadValues(payload);
  const now = timestampNow();
  payload.created_at = payload.created_at || now;
  payload.updated_at = payload.updated_at || now;
  return payload;
};

const prepareUpdatePayload = (collectionId, data) => {
  let payload = stripDocumentMeta(data);
  if (collectionId === 'settings') payload = normalizeSettingsPayload(payload);
  payload = normalizePayloadValues(payload);
  payload.updated_at = timestampNow();
  if (!payload.created_at && data?.created_at) payload.created_at = data.created_at;
  return payload;
};

const normalizeValue = (value) => (Array.isArray(value) ? value : [value]);

const toDocument = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc.$id,
    id: doc.$id,
    created_at: doc.created_at ?? doc.$createdAt,
    updated_at: doc.updated_at ?? doc.$updatedAt,
    toJSON: function () {
      const payload = stripDocumentMeta(this);
      payload.id = this.id || this._id || this.$id;
      return payload;
    }
  };
};

const attachDocumentMethods = (collectionId, doc) => {
  if (!doc) return null;
  doc.save = async () => {
    const payload = prepareUpdatePayload(collectionId, doc);
    if (useOfflineFallback) {
      const list = readFallbackData(collectionId).map(mapFallbackDoc);
      const idx = list.findIndex(item => item.id === doc.$id || item._id === doc.$id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, updated_at: new Date().toISOString() };
        writeFallbackData(collectionId, list);
      }
      return;
    }
    try {
      await databases.updateDocument(DB_ID, collectionId, doc.$id, payload);
    } catch (error) {
      console.error('Save error:', error);
    }
  };
  doc.deleteOne = async () => {
    if (useOfflineFallback) {
      let list = readFallbackData(collectionId).map(mapFallbackDoc);
      list = list.filter(item => item.id !== doc.$id && item._id !== doc.$id);
      writeFallbackData(collectionId, list);
      return true;
    }
    try {
      await databases.deleteDocument(DB_ID, collectionId, doc.$id);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };
  doc.select = () => doc;
  doc.lean = () => doc;
  return doc;
};

class Model {
  constructor(collectionId) {
    this.collectionId = collectionId;
  }

  _map(doc) {
    const mapped = this.collectionId === 'settings' ? buildSettingsDocument(doc) : toDocument(doc);
    return attachDocumentMethods(this.collectionId, mapped);
  }

  async findOne(query = {}) {
    if (useOfflineFallback) {
      const list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      for (const doc of list) {
        if (matchesQuery(doc, query)) {
          return this._map(doc);
        }
      }
      return null;
    }

    if (query.$search && Array.isArray(query.$search.fields) && query.$search.value) {
      const searchResults = await this.search(query.$search.fields, query.$search.value, { limit: 1 });
      return searchResults[0] || null;
    }

    let queries = [];
    for (const [k, v] of Object.entries(query)) {
      if (k === '$or' && Array.isArray(v)) {
        for (const subQuery of v) {
          const res = await this.findOne(subQuery);
          if (res) return res;
        }
        return null;
      } else if (k !== '$or') {
        queries.push(Query.equal(normalizeFieldName(k), normalizeValue(v)));
      }
    }
    if (queries.length === 0 && Object.keys(query).length > 0) return null;
    
    queries.push(Query.limit(1));
    try {
      const result = await databases.listDocuments(DB_ID, this.collectionId, queries);
      if (result.documents.length === 0) return null;
      return this._map(result.documents[0]);
    } catch (e) { return null; }
  }

  async findById(id) {
    if (!id) return null;
    if (useOfflineFallback) {
      const list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      const found = list.find(item => item.id === id || item._id === id);
      return found ? this._map(found) : null;
    }
    try {
      const doc = await databases.getDocument(DB_ID, this.collectionId, id.toString());
      return this._map(doc);
    } catch (e) { return null; }
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
        if (useOfflineFallback) {
          try {
            let list = readFallbackData(that.collectionId).map(mapFallbackDoc);
            if (query && typeof query === 'object') {
              list = list.filter(doc => matchesQuery(doc, query));
            }
            if (this._sort) {
              const sortFields = Object.entries(this._sort);
              list.sort((a, b) => {
                for (const [key, dir] of sortFields) {
                  const field = normalizeFieldName(key);
                  const valA = a[field];
                  const valB = b[field];
                  if (valA < valB) return dir === -1 || dir === 'desc' ? 1 : -1;
                  if (valA > valB) return dir === -1 || dir === 'desc' ? -1 : 1;
                }
                return 0;
              });
            } else {
              list.sort((a, b) => {
                const timeA = new Date(a.created_at || a.$createdAt || 0).getTime();
                const timeB = new Date(b.created_at || b.$createdAt || 0).getTime();
                return timeB - timeA;
              });
            }
            const skip = this._skip || 0;
            const limit = this._limit || list.length;
            const sliced = list.slice(skip, skip + limit);
            resolve(sliced.map(d => that._map(d)));
          } catch (err) {
            if (reject) reject(err);
          }
          return;
        }

        try {
          let queries = [];
          if (query && typeof query === 'object') {
            if (Array.isArray(query.$or) && query.$or.length > 0) {
              const searchFields = [];
              let searchTerm = '';
              let canSearch = true;

              for (const clause of query.$or) {
                if (!clause || typeof clause !== 'object') {
                  canSearch = false;
                  break;
                }

                const clauseEntries = Object.entries(clause);
                if (clauseEntries.length === 0) {
                  canSearch = false;
                  break;
                }

                const [field, value] = clauseEntries[0];
                if (!field || !(value instanceof RegExp)) {
                  canSearch = false;
                  break;
                }

                searchFields.push(normalizeFieldName(field));
                const clauseTerm = value.source.replace(/^\^/, '').replace(/\$$/, '');
                if (!searchTerm) searchTerm = clauseTerm;
                else if (searchTerm !== clauseTerm) canSearch = false;
              }

              if (canSearch && searchTerm) {
                const searchQueries = searchFields.map((field) => Query.search(field, searchTerm));
                queries.push(searchQueries.length === 1 ? searchQueries[0] : Query.or(searchQueries));
              }
            }

            for (const [k, v] of Object.entries(query)) {
              if (k === '$or') continue;
              if (k !== 'tags' && typeof v !== 'object') {
                 queries.push(Query.equal(normalizeFieldName(k), normalizeValue(v)));
              }
            }
          }
          if (this._limit) queries.push(Query.limit(this._limit));
          else queries.push(Query.limit(100)); // Default Appwrite limit max

          if (this._sort) {
            for (const [k, v] of Object.entries(this._sort)) {
              const field = normalizeFieldName(k);
              if (v === -1 || v === 'desc') queries.push(Query.orderDesc(field));
              else queries.push(Query.orderAsc(field));
            }
          }
          const result = await databases.listDocuments(DB_ID, that.collectionId, queries);
          resolve(result.documents.map(d => that._map(d)));
        } catch (err) {
          console.error(`Appwrite query failed, using local fallback for ${that.collectionId}`, err.message);
          try {
            let list = readFallbackData(that.collectionId).map(mapFallbackDoc);
            if (query && typeof query === 'object') {
              list = list.filter(doc => matchesQuery(doc, query));
            }
            if (this._sort) {
              const sortFields = Object.entries(this._sort);
              list.sort((a, b) => {
                for (const [key, dir] of sortFields) {
                  const field = normalizeFieldName(key);
                  const valA = a[field];
                  const valB = b[field];
                  if (valA < valB) return dir === -1 || dir === 'desc' ? 1 : -1;
                  if (valA > valB) return dir === -1 || dir === 'desc' ? -1 : 1;
                }
                return 0;
              });
            } else {
              list.sort((a, b) => {
                const timeA = new Date(a.created_at || a.$createdAt || 0).getTime();
                const timeB = new Date(b.created_at || b.$createdAt || 0).getTime();
                return timeB - timeA;
              });
            }
            const skip = this._skip || 0;
            const limit = this._limit || list.length;
            const sliced = list.slice(skip, skip + limit);
            resolve(sliced.map(d => that._map(d)));
          } catch (fallbackErr) {
            if (reject) reject(fallbackErr);
          }
        }
      }
    };
    return qBuilder;
  }

  async search(fields = [], value = '', options = {}) {
    if (useOfflineFallback) {
      const searchTerm = typeof value === 'string' ? value.toLowerCase().trim() : '';
      if (searchTerm.length < 3 || !Array.isArray(fields) || fields.length === 0) {
        return [];
      }
      let list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      list = list.filter(doc => {
        return fields.some(field => {
          const val = doc[normalizeFieldName(field)];
          return val && String(val).toLowerCase().includes(searchTerm);
        });
      });
      if (options.sort) {
        const sortFields = Object.entries(options.sort);
        list.sort((a, b) => {
          for (const [key, dir] of sortFields) {
            const field = normalizeFieldName(key);
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return dir === -1 || dir === 'desc' ? 1 : -1;
            if (valA > valB) return dir === -1 || dir === 'desc' ? -1 : 1;
          }
          return 0;
        });
      }
      const limit = Math.min(Number(options.limit) || 20, 100);
      const sliced = list.slice(0, limit);
      return sliced.map(doc => this._map(doc));
    }

    const searchTerm = typeof value === 'string' ? value.trim() : '';
    if (searchTerm.length < 3 || !Array.isArray(fields) || fields.length === 0) {
      return [];
    }

    const searchQueries = fields.map((field) => Query.search(field, searchTerm));
    const queries = [searchQueries.length === 1 ? searchQueries[0] : Query.or(searchQueries)];

    if (options.sort && typeof options.sort === 'object') {
      for (const [field, direction] of Object.entries(options.sort)) {
        if (direction === -1 || direction === 'desc') queries.push(Query.orderDesc(field));
        else queries.push(Query.orderAsc(field));
      }
    }

    queries.push(Query.limit(Math.min(Number(options.limit) || 20, 100)));

    const result = await databases.listDocuments(DB_ID, this.collectionId, queries);
    return result.documents.map((doc) => this._map(doc));
  }

  async findByIdAndUpdate(id, data, opts) {
    if (useOfflineFallback) {
      const list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      const idx = list.findIndex(item => item.id === id || item._id === id);
      if (idx === -1) return null;

      let doc = list[idx];
      let mergedPayload = stripDocumentMeta(doc);
      if (this.collectionId === 'settings') mergedPayload = normalizeSettingsPayload(mergedPayload);

      let payload = { ...data };
      if (payload.$set && typeof payload.$set === 'object') {
        Object.assign(mergedPayload, payload.$set);
      }
      if (payload.$inc && typeof payload.$inc === 'object') {
        for (const [field, amount] of Object.entries(payload.$inc)) {
          mergedPayload[field] = Number(mergedPayload[field] || 0) + Number(amount || 0);
        }
      }
      if (payload.$addToSet && typeof payload.$addToSet === 'object') {
        for (const [field, value] of Object.entries(payload.$addToSet)) {
          const currentValues = Array.isArray(mergedPayload[field]) ? [...mergedPayload[field]] : [];
          const valuesToAdd = Array.isArray(value) ? value : [value];
          for (const item of valuesToAdd) {
            if (!currentValues.includes(item)) currentValues.push(item);
          }
          mergedPayload[field] = currentValues;
        }
      }
      if (payload.$unset && typeof payload.$unset === 'object') {
        for (const field of Object.keys(payload.$unset)) {
          delete mergedPayload[field];
        }
      }
      for (const [field, value] of Object.entries(payload)) {
        if (field.startsWith('$')) continue;
        mergedPayload[field] = value;
      }

      const now = new Date().toISOString();
      const updatedDoc = {
        ...doc,
        ...mergedPayload,
        updated_at: now,
      };

      list[idx] = updatedDoc;
      writeFallbackData(this.collectionId, list);
      return this._map(updatedDoc);
    }

    let payload = { ...data };
    delete payload._id; delete payload.id; delete payload.$id;
    const strippedAttrs = new Set();
    const tryUpdate = async (currentPayload) => {
      try {
        const payloadToWrite = prepareUpdatePayload(this.collectionId, currentPayload);
        for (const attr of strippedAttrs) delete payloadToWrite[attr];
        
        const doc = await databases.updateDocument(DB_ID, this.collectionId, id, payloadToWrite);
        return this._map(doc);
      } catch(err) {
        if (err.message && err.message.includes('Unknown attribute:')) {
          const match = err.message.match(/Unknown attribute: "([^"]+)"/);
          if (match && match[1]) {
            const badAttr = match[1];
            strippedAttrs.add(badAttr);
            console.warn(`[Appwrite] Set stripping missing attribute "${badAttr}" from ${this.collectionId}`);
            return tryUpdate(currentPayload);
          }
        }
        console.error(`[Appwrite Update Error] in ${this.collectionId}:`, err);
        return null;
      }
    };

    const hasOperators = ['$inc', '$set', '$unset', '$addToSet'].some((key) => payload[key]);
    if (hasOperators) {
      try {
        const existingDoc = await databases.getDocument(DB_ID, this.collectionId, id);
        let mergedPayload = stripDocumentMeta(existingDoc);
        if (this.collectionId === 'settings') mergedPayload = normalizeSettingsPayload(mergedPayload);

        if (payload.$set && typeof payload.$set === 'object') {
          Object.assign(mergedPayload, payload.$set);
        }

        if (payload.$inc && typeof payload.$inc === 'object') {
          for (const [field, amount] of Object.entries(payload.$inc)) {
            const currentValue = Number(mergedPayload[field] || 0);
            mergedPayload[field] = currentValue + Number(amount || 0);
          }
        }

        if (payload.$addToSet && typeof payload.$addToSet === 'object') {
          for (const [field, value] of Object.entries(payload.$addToSet)) {
            const currentValues = Array.isArray(mergedPayload[field]) ? [...mergedPayload[field]] : [];
            const valuesToAdd = Array.isArray(value) ? value : [value];
            for (const item of valuesToAdd) {
              if (!currentValues.includes(item)) currentValues.push(item);
            }
            mergedPayload[field] = currentValues;
          }
        }

        if (payload.$unset && typeof payload.$unset === 'object') {
          for (const field of Object.keys(payload.$unset)) {
            delete mergedPayload[field];
          }
        }

        for (const [field, value] of Object.entries(payload)) {
          if (field.startsWith('$')) continue;
          mergedPayload[field] = value;
        }

        return tryUpdate(mergedPayload);
      } catch (error) {
        console.error(`[Appwrite Update Error] in ${this.collectionId}:`, error);
        return null;
      }
    }

    return tryUpdate(payload);
  }

  async findOneAndUpdate(query, data) {
    const doc = await this.findOne(query);
    if (!doc) return null;
    return this.findByIdAndUpdate(doc.$id, data);
  }

  async findByIdAndDelete(id) {
    if (useOfflineFallback) {
      let list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      const initialLength = list.length;
      list = list.filter(item => item.id !== id && item._id !== id);
      if (list.length < initialLength) {
        writeFallbackData(this.collectionId, list);
        return true;
      }
      return false;
    }
    try {
      await databases.deleteDocument(DB_ID, this.collectionId, id);
      return true;
    } catch (e) { console.error("Delete error in Appwrite:", e); return false; }
  }

  async deleteMany(query) {
    try {
      const docs = await this.find(query);
      let count = 0;
      for (const doc of docs) {
        if (doc && doc.deleteOne) {
          const success = await doc.deleteOne();
          if (success) count++;
        }
      }
      return { deletedCount: count };
    } catch (err) {
      console.error('deleteMany error:', err);
      return { deletedCount: 0 };
    }
  }

  async create(data) {
    if (useOfflineFallback) {
      const list = readFallbackData(this.collectionId).map(mapFallbackDoc);
      const payload = prepareCreatePayload(this.collectionId, data);
      
      if (this.collectionId === 'news' || this.collectionId === 'reels') {
        if (!payload.published_at) payload.published_at = new Date().toISOString();
        if (!payload.views) payload.views = 0;
      }
      
      const newId = ID.unique();
      const newDoc = {
        ...payload,
        $id: newId,
        _id: newId,
        id: newId,
        $createdAt: payload.created_at,
        $updatedAt: payload.updated_at,
      };
      
      list.push(newDoc);
      writeFallbackData(this.collectionId, list);
      return this._map(newDoc);
    }

    const payload = prepareCreatePayload(this.collectionId, data);
    if (this.collectionId === 'news' || this.collectionId === 'reels') {
      if (!payload.published_at) payload.published_at = new Date().toISOString();
      if (!payload.views) payload.views = 0;
    }
    
    const tryInsert = async (currentPayload) => {
      try {
        const doc = await databases.createDocument(DB_ID, this.collectionId, ID.unique(), currentPayload);
        return this._map(doc);
      } catch(err) {
        if (err.message && err.message.includes('Unknown attribute:')) {
          const match = err.message.match(/Unknown attribute: "([^"]+)"/);
          if (match && match[1]) {
            const badAttr = match[1];
            delete currentPayload[badAttr];
            console.warn(`[Appwrite] Stripped unknown attribute "${badAttr}" from ${this.collectionId}`);
            return tryInsert(currentPayload);
          }
        }
        console.error(`[Appwrite] Create Error in ${this.collectionId}:`, err);
        throw err;
      }
    };
    return tryInsert(payload);
  }
  
  async aggregate(pipes) {
     if (useOfflineFallback) {
       const list = readFallbackData(this.collectionId).map(mapFallbackDoc);
       const tagsObj = {};
       list.forEach(d => {
         if (d.tags && Array.isArray(d.tags)) {
           d.tags.forEach(t => {
             tagsObj[t] = (tagsObj[t] || 0) + 1;
           });
         }
       });
       return Object.entries(tagsObj).sort((a,b) => b[1] - a[1]).slice(0, 10).map(kv => ({ _id: kv[0], count: kv[1] }));
     }

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
export const Report = new Model('reports');
export const AnalyticsEvent = new Model('analytics_events');
export const AnalyticsError = new Model('analytics_errors');
export const DeveloperReport = new Model('developer_reports');
export const Pyq = new Model('pyq');
export const Interaction = new Model('interactions');
export const Follow = new Model('follows');
export const MusicTrack = new Model('music_tracks');

export const initDb = async () => {
  console.log('🚀 Appwrite DB Wrapper initialized. Overridden successfully!');
  
  if (process.env.OFFLINE_MODE === 'true') {
    useOfflineFallback = true;
    console.log('🔌 OFFLINE MODE forced via env. Using local JSON databases.');
  } else {
    try {
      // Test check with a 1.5s timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      await databases.listDocuments(DB_ID, 'settings', [Query.limit(1)]);
      clearTimeout(id);
      useOfflineFallback = false;
      console.log('🌐 Appwrite is online. Connected successfully.');
    } catch (err) {
      useOfflineFallback = true;
      console.log('🔌 Appwrite is offline/unreachable. Automatically falling back to local JSON databases.');
    }
  }

  // Preetam's testing details
  const preetamId = '69d663c300013ae31bb4';
  const preetamName = 'Preetam Singh Yadav ';
  const preetamHandle = 'vipno1official';
  const preetamEmail = 'vipno1official@gmail.com';

  // Seed default admin in local fallback if not exists
  if (useOfflineFallback) {
    try {
      const admins = readFallbackData('admins').map(mapFallbackDoc);
      let hasPreetam = admins.some(a => a.id === preetamId || a.email === preetamEmail);
      if (!hasPreetam) {
        admins.push({
          name: preetamName,
          email: preetamEmail,
          password_hash: "$2a$10$WLOxEmru4/v2RFpMp1XyBuB.lwFbBIu/ikRFb.Ulct9/b9B5Ffj7q", // admin123
          role: "superadmin",
          status: "active",
          bio: "Admin of DenceWance",
          avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80",
          id: preetamId,
          _id: preetamId,
          username: preetamHandle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        writeFallbackData('admins', admins);
        console.log('✅ Local Preetam admin seeded successfully.');
      } else {
        // Make sure Preetam has username: 'vipno1official'
        const idx = admins.findIndex(a => a.id === preetamId || a.email === preetamEmail);
        if (idx !== -1 && !admins[idx].username) {
          admins[idx].username = preetamHandle;
          writeFallbackData('admins', admins);
          console.log('✅ Local Preetam username updated.');
        }
      }
    } catch (e) {
      console.error('Error seeding local admin:', e);
    }
  }

  // Backfill/Migrate all local fallback data to Preetam's account
  try {
    // Update news posts fallback
    const newsList = readFallbackData('news').map(mapFallbackDoc);
    let newsUpdated = false;
    newsList.forEach(n => {
      if (n.author_id !== preetamId || n.author_name !== preetamName) {
        n.author_id = preetamId;
        n.author_name = preetamName;
        newsUpdated = true;
      }
    });
    if (newsUpdated) {
      writeFallbackData('news', newsList);
      console.log('✅ Backfilled local news posts to Preetam');
    }

    // Update reels fallback
    const reelsList = readFallbackData('reels').map(mapFallbackDoc);
    let reelsUpdated = false;
    reelsList.forEach(r => {
      if (r.creator_id !== preetamId || r.creator_handle !== preetamHandle || r.creator_name !== preetamName) {
        r.creator_id = preetamId;
        r.creator_name = preetamName;
        r.creator_handle = preetamHandle;
        reelsUpdated = true;
      }
    });
    if (reelsUpdated) {
      writeFallbackData('reels', reelsList);
      console.log('✅ Backfilled local reels to Preetam');
    }

    // Update comments fallback
    const commentsList = readFallbackData('comments').map(mapFallbackDoc);
    let commentsUpdated = false;
    commentsList.forEach(c => {
      if (c.user_id !== preetamId) {
        c.user_id = preetamId;
        c.author_name = preetamName;
        c.author_handle = '@' + preetamHandle;
        commentsUpdated = true;
      }
    });
    if (commentsUpdated) {
      writeFallbackData('comments', commentsList);
      console.log('✅ Backfilled local comments to Preetam');
    }
  } catch (err) {
    console.error('Error during fallback migration:', err);
  }

  // Normal Appwrite check if online
  if (!useOfflineFallback) {
    try {
      const existingAdmin = await Admin.findOne();
      if (!existingAdmin) {
        console.log('No admin found in Appwrite, creating default...');
        const defaultEmail = process.env.ADMIN_EMAIL || 'vipno1official@gmail.com';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const defaultName = process.env.ADMIN_NAME || 'Preetam Singh Yadav ';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await Admin.create({
          name: defaultName,
          email: defaultEmail,
          password_hash: hashedPassword,
          status: 'active',
          role: 'superadmin'
        });
        console.log('✅ Default superadmin configured in Appwrite');
      }
    } catch (error) {
      console.error('Error in Appwrite initDb:', error);
    }
  }
};
