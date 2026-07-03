const { AsyncLocalStorage } = require('async_hooks');

const requestContextStorage = new AsyncLocalStorage();

const runWithRequestContext = (context, callback) => {
  return requestContextStorage.run(context, callback);
};

const getRequestContext = () => {
  return requestContextStorage.getStore() || null;
};

const getCurrentTransaction = () => {
  return getRequestContext()?.transaction || null;
};

const getCurrentRlsContext = () => {
  return getRequestContext()?.rlsContext || null;
};

const withCurrentTransaction = (options = {}) => {
  if (options.transaction) {
    return options;
  }

  const transaction = getCurrentTransaction();
  if (!transaction) {
    return options;
  }

  return {
    ...options,
    transaction
  };
};

module.exports = {
  runWithRequestContext,
  getRequestContext,
  getCurrentTransaction,
  getCurrentRlsContext,
  withCurrentTransaction
};