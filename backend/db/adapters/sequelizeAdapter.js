const { Op } = require('sequelize');
const { withCurrentTransaction } = require('../requestContext');

const RELATED_MODELS = {
  assignedJudge: () => require('../models/User'),
  assignedBy: () => require('../models/User'),
  registeredBy: () => require('../models/User'),
  lastModifiedBy: () => require('../models/User'),
  deliveredBy: () => require('../models/User'),
  fromJudge: () => require('../models/User'),
  toJudge: () => require('../models/User'),
  transferredBy: () => require('../models/User'),
  uploadedBy: () => require('../models/User'),
  relatedCase: () => require('../models/Case'),
  processedBy: () => require('../models/User'),
  receivedBy: () => require('../models/User'),
  case: () => require('../models/Case'),
  generatedBy: () => require('../models/User'),
  sentTo: () => require('../models/User'),
  acknowledgedBy: () => require('../models/User'),
  recipient: () => require('../models/User'),
  sender: () => require('../models/User'),
  caseId: () => require('../models/Case'),
  imposedBy: () => require('../models/User'),
  issuedBy: () => require('../models/User'),
  assignedTo: () => require('../models/User'),
  requestedBy: () => require('../models/User'),
  assignedToResearch: () => require('../models/User'),
  officer: () => require('../models/User')
};

function isDate(value) {
  return value instanceof Date;
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function normalizeId(value) {
  return value && value.id ? value.id : value;
}

function getPathValue(source, path) {
  if (!source || !path) return undefined;
  if (path === '_id' || path === 'id') return source.id || source._id;

  const parts = path.split('.');
  let current = source;

  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current.get === 'function' && part in current.dataValues) {
      current = current.get(part);
    } else {
      current = current[part];
    }
  }

  return current;
}

function setPathValue(target, path, value) {
  const parts = path.split('.');
  let current = target;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (current[part] == null) current[part] = {};
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

function toPlainDocument(doc) {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  plain._id = plain.id || plain._id;
  plain.id = plain.id || plain._id;
  return plain;
}

function attachIdAlias(instance) {
  if (!instance || instance._idAliasAttached) return instance;

  Object.defineProperty(instance, '_id', {
    configurable: true,
    get() {
      return this.id || this.getDataValue?.('id');
    },
    set(value) {
      if (this.setDataValue) this.setDataValue('id', value);
      else this.id = value;
    }
  });

  instance._idAliasAttached = true;
  return instance;
}

function attachMutableJson(instance, keys) {
  for (const key of keys) {
    let value = instance[key];

    if (Array.isArray(value)) {
      const originalPush = value.push.bind(value);
      const originalUnshift = value.unshift.bind(value);
      const originalSplice = value.splice.bind(value);

      value.push = (...items) => {
        const result = originalPush(...items);
        instance.setDataValue?.(key, [...value]);
        return result;
      };
      value.unshift = (...items) => {
        const result = originalUnshift(...items);
        instance.setDataValue?.(key, [...value]);
        return result;
      };
      value.splice = (...args) => {
        const result = originalSplice(...args);
        instance.setDataValue?.(key, [...value]);
        return result;
      };
    } else if (isPlainObject(value)) {
      const markChanged = () => instance.setDataValue?.(key, { ...value });

      value = new Proxy(value, {
        set(target, prop, nextValue) {
          target[prop] = nextValue;
          markChanged();
          return true;
        }
      });
    }

    Object.defineProperty(instance, key, {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(nextValue) {
        value = nextValue;
        // Ensure Sequelize is notified of the change
        if (typeof instance.setDataValue === 'function') {
          instance.setDataValue(key, nextValue);
        } else if (typeof instance.changed === 'function') {
          instance.changed(key, true);
        }
      }
    });
  }

  return instance;
}

function normalizeDocument(instance) {
  if (!instance) return null;
  attachIdAlias(instance);
  attachMutableJson(instance, [
    'caseNotes',
    'calendarEvents',
    'emailVerificationRisk',
    'plaintiff',
    'defendant',
    'hearingDates',
    'fees',
    'documents',
    'judgment',
    'adjournments',
    'caseTransfers',
    'metadata',
    'payer',
    'finedParty',
    'specialization',
    'availability',
    'documentsList',
    'paymentTransactionDetails' // Track payment verification workflow
  ]);
  instance.toObject = () => toPlainDocument(instance);
  
  // Sequelize instances have a save() method that should work as-is
  // However, ensure the method is available and callable
  if (instance && !instance._sequelizeSaveWrapped) {
    if (typeof instance.save === 'function') {
      const originalSave = instance.save.bind(instance);
      instance.save = (options = {}) => originalSave(withCurrentTransaction(options));

      if (typeof instance.destroy === 'function') {
        const originalDestroy = instance.destroy.bind(instance);
        instance.destroy = (options = {}) => originalDestroy(withCurrentTransaction(options));
      }

      instance._sequelizeSaveWrapped = true;
    } else {
      // Fallback - shouldn't happen with Sequelize instances
      instance.save = async function() {
        throw new Error('Instance does not have a valid Sequelize save() method');
      };
      instance._sequelizeSaveWrapped = true;
    }
  }
  
  return instance;
}

function applyUpdate(instance, updates) {
  if (!instance || !updates) return;
  for (const [key, value] of Object.entries(updates)) {
    if (instance.setDataValue && typeof instance.setDataValue === 'function') {
      instance.setDataValue(key, value);
    } else {
      instance[key] = value;
    }
  }
}

function aggregateDocuments(documents, pipeline) {
  if (!Array.isArray(documents) || !Array.isArray(pipeline)) return documents;
  
  let result = [...documents];
  
  for (const stage of pipeline) {
    if (stage.$match) {
      result = result.filter(doc => matchesOperatorObject(doc, stage.$match));
    } else if (stage.$group) {
      const grouped = {};
      for (const doc of result) {
        const key = stage.$group._id;
        const groupKey = typeof key === 'string' && key.startsWith('$') 
          ? getPathValue(doc, key.slice(1)) 
          : key;
        const groupKeyStr = JSON.stringify(groupKey);
        
        if (!grouped[groupKeyStr]) {
          grouped[groupKeyStr] = { _id: groupKey };
        }
        
        for (const [field, expr] of Object.entries(stage.$group)) {
          if (field === '_id') continue;
          if (expr.$sum === 1) {
            grouped[groupKeyStr][field] = (grouped[groupKeyStr][field] || 0) + 1;
          } else if (expr.$sum && typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
            const fieldName = expr.$sum.slice(1);
            const value = getPathValue(doc, fieldName);
            grouped[groupKeyStr][field] = (grouped[groupKeyStr][field] || 0) + (value || 0);
          }
        }
      }
      result = Object.values(grouped);
    } else if (stage.$sort) {
      result = sortDocuments(result, stage.$sort);
    } else if (stage.$limit) {
      result = result.slice(0, stage.$limit);
    } else if (stage.$skip) {
      result = result.slice(stage.$skip);
    } else if (stage.$project) {
      result = result.map(doc => {
        const projected = {};
        for (const [field, include] of Object.entries(stage.$project)) {
          if (include === 1 || include === true) {
            projected[field] = getPathValue(doc, field);
          }
        }
        return projected;
      });
    }
  }
  
  return result;
}

function selectFromOperator(operator) {
  switch (operator) {
    case '$in': return Op.in;
    case '$nin': return Op.notIn;
    case '$gte': return Op.gte;
    case '$lte': return Op.lte;
    case '$gt': return Op.gt;
    case '$lt': return Op.lt;
    case '$ne': return Op.ne;
    case '$eq': return Op.eq;
    default: return null;
  }
}

function buildWhereFromQuery(query) {
  if (!query || typeof query !== 'object') return {};

  const where = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;

    const fieldName = key === '_id' ? 'id' : key;
    if (key === '$or') {
      where[Op.or] = value.map(buildWhereFromQuery);
      continue;
    }

    if (isPlainObject(value) && Object.keys(value).every((item) => item.startsWith('$'))) {
      where[fieldName] = {};
      for (const [operator, operatorValue] of Object.entries(value)) {
        const sequelizeOperator = selectFromOperator(operator);
        if (sequelizeOperator) where[fieldName][sequelizeOperator] = operatorValue;
      }
      continue;
    }

    where[fieldName] = value;
  }

  return where;
}

function matchesOperator(actual, expected) {
  if (!isPlainObject(expected)) return actual === expected;

  for (const [operator, operatorValue] of Object.entries(expected)) {
    if (operator === '$in' && !operatorValue.includes(actual)) return false;
    if (operator === '$nin' && operatorValue.includes(actual)) return false;
    if (operator === '$gte' && !(actual >= operatorValue)) return false;
    if (operator === '$lte' && !(actual <= operatorValue)) return false;
    if (operator === '$gt' && !(actual > operatorValue)) return false;
    if (operator === '$lt' && !(actual < operatorValue)) return false;
    if (operator === '$ne' && actual === operatorValue) return false;
    if (operator === '$exists' && operatorValue === (actual === undefined || actual === null)) return false;
    if (operator === '$size' && (!Array.isArray(actual) || actual.length !== operatorValue)) return false;
    if (operator === '$regex') {
      const regex = operatorValue instanceof RegExp ? operatorValue : new RegExp(operatorValue);
      if (!regex.test(String(actual ?? ''))) return false;
    }
    if (operator === '$elemMatch') {
      if (!Array.isArray(actual)) return false;
      if (!actual.some((item) => matchesOperatorObject(item, operatorValue))) return false;
    }
  }

  return true;
}

function matchesOperatorObject(document, expected) {
  if (!isPlainObject(expected)) return true;

  for (const [key, value] of Object.entries(expected)) {
    if (key === '$or') {
      if (!value.some((item) => matchesOperatorObject(document, item))) return false;
      continue;
    }

    const actual = getPathValue(document, key);
    if (!matchesOperator(actual, value)) return false;
  }

  return true;
}

function buildPostFilters(query) {
  if (!query || typeof query !== 'object') return [];
  const filters = [];

  for (const [key, value] of Object.entries(query)) {
    if (key === '$or') {
      filters.push((document) => value.some((item) => matchesOperatorObject(document, item)));
      continue;
    }

    if (isPlainObject(value) && Object.keys(value).some((item) => item.startsWith('$'))) {
      filters.push((document) => matchesOperator(getPathValue(document, key), value));
      continue;
    }

    if (key.includes('.') || (isPlainObject(value) && !isDate(value))) {
      filters.push((document) => matchesOperator(getPathValue(document, key), value));
    }
  }

  return filters;
}

function applyPostFilters(documents, filters) {
  if (!filters.length) return documents;
  return documents.filter((document) => filters.every((filter) => filter(document)));
}

function normalizeSort(sort) {
  if (!sort) return null;
  if (typeof sort === 'string') {
    const descending = sort.startsWith('-');
    return [[descending ? sort.slice(1) : sort, descending ? 'DESC' : 'ASC']];
  }
  if (Array.isArray(sort)) return sort;
  return Object.entries(sort).map(([field, direction]) => [field, direction === -1 ? 'DESC' : 'ASC']);
}

function sortDocuments(documents, sort) {
  const normalized = normalizeSort(sort);
  if (!normalized) return documents;

  return [...documents].sort((a, b) => {
    for (const [field, direction] of normalized) {
      const multiplier = direction === 'DESC' ? -1 : 1;
      const aValue = getPathValue(a, field);
      const bValue = getPathValue(b, field);

      if (aValue == null && bValue == null) continue;
      if (aValue == null) return -1 * multiplier;
      if (bValue == null) return 1 * multiplier;

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
    }
    return 0;
  });
}

function parseSelect(select) {
  if (!select) return null;
  if (typeof select !== 'string') return select;
  return select.split(/\s+/).filter(Boolean);
}

function applySelect(document, select) {
  const tokens = parseSelect(select);
  if (!tokens) return document;

  const includePlus = tokens.filter((token) => token.startsWith('+')).map((token) => token.slice(1));
  const exclude = tokens.filter((token) => token.startsWith('-')).map((token) => token.slice(1));

  if (typeof document?.get === 'function' && typeof document?.set === 'function') {
    for (const field of includePlus) {
      document.set(field, document.get(field));
    }
    for (const field of exclude) {
      if (field !== '__v') {
        document.set(field, null);
      }
    }
    return document;
  }

  const plain = toPlainDocument(document);

  if (includePlus.length > 0) {
    const next = { id: plain.id, _id: plain.id };
    for (const field of includePlus) {
      if (field in plain) next[field] = plain[field];
    }
    return next;
  }

  for (const field of exclude) {
    if (field === '__v') continue;
    delete plain[field];
  }

  return plain;
}

async function populateDocument(document, field, select) {
  if (!document || !field) return document;
  const id = getPathValue(document, field);
  if (!id) return document;

  const modelFactory = RELATED_MODELS[field] || RELATED_MODELS[`${field}Research`];
  if (!modelFactory) return document;

  const model = modelFactory();
  const related = await model.findById(id);
  setPathValue(document, field, related ? applySelect(related, select) : null);
  return document;
}

async function populateDocuments(documents, populate) {
  if (!populate) return documents;
  const items = Array.isArray(populate) ? populate : [populate];

  for (const document of documents) {
    for (const item of items) {
      const field = typeof item === 'string' ? item : item.field;
      const select = typeof item === 'object' ? item.select : undefined;
      await populateDocument(document, field, select);
    }
  }

  return documents;
}

class QueryChain {
  constructor(model, options = {}) {
    this.model = model;
    this.options = options;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }

  async exec() {
    const where = buildWhereFromQuery(this.options.query || {});
    const postFilters = buildPostFilters(this.options.query || {});
    const sequelizeOptions = {};

    if (this.options.select) {
      const select = this.options.select;
      const tokens = typeof select === 'string' ? select.split(/\s+/).filter(Boolean) : select;
      const includePlus = tokens.filter((token) => token.startsWith('+')).map((token) => token.slice(1));
      const exclude = tokens.filter((token) => token.startsWith('-')).map((token) => token.slice(1));

      if (includePlus.length > 0) {
        sequelizeOptions.attributes = { include: includePlus };
      } else if (exclude.length > 0) {
        sequelizeOptions.attributes = { exclude: exclude.filter(f => f !== '__v') };
      }
    }

    const documents = await this.model.findAll(withCurrentTransaction({ where, raw: this.options.raw, ...sequelizeOptions }));

    let results = applyPostFilters(documents, postFilters);
    results = sortDocuments(results, this.options.sort);

    if (this.options.skip) results = results.slice(this.options.skip);
    if (this.options.limit) results = results.slice(0, this.options.limit);

    if (this.options.raw) {
      return this.options.limit === 1 ? (results[0] || null) : results;
    }

    let normalized = results.map(normalizeDocument);
    await populateDocuments(normalized, this.options.populate);

    return normalized;
  }

  sort(sort) {
    this.options.sort = sort;
    return this;
  }

  skip(skip) {
    this.options.skip = skip;
    return this;
  }

  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  populate(field, select) {
      if (!this.options.populate) {
        this.options.populate = [];
      }
      if (Array.isArray(this.options.populate)) {
        this.options.populate.push({ field, select });
      } else {
        this.options.populate = [this.options.populate, { field, select }];
      }
      return this;
    }

  select(select) {
    this.options.select = select;
    return this;
  }

  lean() {
    this.options.lean = true;
    return this;
  }
}

function createAdapter(model) {
  return {
    find(query = {}) {
      return new QueryChain(model, { query });
    },

    findOne(query = {}) {
      const chain = new QueryChain(model, { query, limit: 1, raw: false });
      const originalExec = chain.exec.bind(chain);
      chain.exec = async () => {
        const instances = await originalExec();
        return Array.isArray(instances) ? (instances[0] || null) : instances;
      };
      return chain;
    },

    findById(id) {
      return this.findOne({ id });
    },

    async create(data = {}) {
      if (Array.isArray(data)) {
        const instances = await model.bulkCreate(data, withCurrentTransaction());
        return instances.map(normalizeDocument);
      }

      const payload = { ...data };
      if (payload._id && !payload.id) payload.id = payload._id;
      const instance = await model.create(payload, withCurrentTransaction());
      return normalizeDocument(instance);
    },

    async deleteMany(query = {}) {
      const instances = await new QueryChain(model, { query, raw: true }).exec();
      await Promise.all(instances.map((instance) => instance.destroy()));
      return { deletedCount: instances.length };
    },

    async countDocuments(query = {}) {
      const documents = await new QueryChain(model, { query }).exec();
      return documents.length;
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const instance = await this.findById(id);
      if (!instance) return null;
      applyUpdate(instance, update);
      await instance.save();
      return normalizeDocument(instance);
    },

    async updateMany(query, update) {
      const instances = await new QueryChain(model, { query, raw: true }).exec();
      for (const instance of instances) {
        applyUpdate(instance, update);
        await instance.save();
      }
      return { matchedCount: instances.length, modifiedCount: instances.length };
    },

    async findByIdAndDelete(id) {
      const instance = await this.findById(id);
      if (!instance) return null;
      await instance.destroy();
      return normalizeDocument(instance);
    },

    async aggregate(pipeline = []) {
      const documents = await model.findAll(withCurrentTransaction({ raw: false }));
      return aggregateDocuments(documents.map(normalizeDocument), pipeline);
    }
  };
}

module.exports = {
  createAdapter,
  normalizeDocument,
  toPlainDocument,
  getPathValue,
  setPathValue,
  applySelect
};
