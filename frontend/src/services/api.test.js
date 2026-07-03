import api, { authAPI, caseAPI, courtAPI, judgeAPI, lgaAPI, paymentAPI, reportAPI, stateAPI } from './api';

describe('frontend API client', () => {
  test('exports configured axios instance and API modules', () => {
    const headers = api.defaults.headers;
    const contentType = typeof headers.get === 'function'
      ? headers.get('Content-Type')
      : headers['Content-Type'] || headers.common?.['Content-Type'];

    expect(api.defaults.baseURL).toBe('/api');
    expect(contentType).toBe('application/json');
    expect(authAPI).toEqual(expect.objectContaining({
      confirmEmail: expect.any(Function),
      registerJudge: expect.any(Function),
      judgeLoginStep1: expect.any(Function),
      judgeVerifyLoginCode: expect.any(Function)
    }));
    expect(caseAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      getById: expect.any(Function),
      create: expect.any(Function),
      addHearing: expect.any(Function)
    }));
    expect(judgeAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      create: expect.any(Function),
      getWorkload: expect.any(Function)
    }));
    expect(paymentAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      create: expect.any(Function),
      getDue: expect.any(Function)
    }));
    expect(stateAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      getByCode: expect.any(Function)
    }));
    expect(courtAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      getCaseTypes: expect.any(Function)
    }));
    expect(lgaAPI).toEqual(expect.objectContaining({
      getAll: expect.any(Function),
      getByState: expect.any(Function)
    }));
    expect(reportAPI).toEqual(expect.objectContaining({
      getDashboard: expect.any(Function),
      getMonthlyCases: expect.any(Function)
    }));
  });
});
