const https = require('https');
const http = require('http');

const DEFAULT_VERIFYME_BASE_URL = 'https://vapi.verifyme.ng/v1/verifications/identities/nin';
const DEFAULT_METAMAP_BASE_URL = 'https://api.prod.metamap.com/govchecks/v1/ng/nin';
const DEFAULT_NIMC_BASE_URL = process.env.NIMC_API_BASE_URL || '';
const NIN_API_KEY = process.env.NIN_API_KEY || '';
const NIN_PROVIDER = process.env.NIN_VERIFICATION_PROVIDER || 'verifyme';

function requestJson(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: Number(process.env.NIN_API_TIMEOUT_MS || 15000)
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 504, body: JSON.stringify({ message: 'NIN verification service timed out.' }) });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function normalizeVerifyMeResult(nin, result) {
  const data = result.data || {};
  return {
    success: true,
    data: {
      nin,
      firstName: data.firstname || data.firstName || '',
      lastName: data.lastname || data.lastName || '',
      middleName: data.middlename || data.middleName || '',
      dateOfBirth: data.birthdate || data.dateOfBirth || '',
      gender: data.gender || '',
      phone: data.phone || '',
      photo: data.photo || '',
      fieldMatches: data.fieldMatches || {},
      verified: true,
      verificationId: data.verificationId || `VERIFYME-${Date.now()}-${nin.slice(-4)}`,
      provider: 'verifyme'
    }
  };
}

async function verifyWithVerifyMe(nin, context = {}) {
  const baseUrl = process.env.NIN_API_BASE_URL || DEFAULT_VERIFYME_BASE_URL;
  const url = `${baseUrl.replace(/\/$/, '')}/${nin}`;
  const response = await requestJson('POST', url, {
    headers: {
      Authorization: `Bearer ${NIN_API_KEY}`
    },
    body: {
      firstname: context.firstName,
      lastName: context.lastName,
      dob: context.dateOfBirth
    }
  });

  let parsed = {};
  try {
    parsed = response.body ? JSON.parse(response.body) : {};
  } catch (error) {
    return {
      success: false,
      message: 'Invalid response from NIN verification service.'
    };
  }

  if (response.statusCode === 201 && parsed.status === 'success') {
    return normalizeVerifyMeResult(nin, parsed);
  }

  return {
    success: false,
    message: parsed.message || parsed.error || 'NIN verification failed. Please check the NIN and registered identity details.'
  };
}

async function verifyWithMetaMap(nin, context = {}) {
  const response = await requestJson('POST', process.env.NIN_API_BASE_URL || DEFAULT_METAMAP_BASE_URL, {
    headers: {
      Authorization: `Bearer ${NIN_API_KEY}`
    },
    body: {
      documentNumber: nin,
      firstName: context.firstName,
      lastName: context.lastName,
      dateOfBirth: context.dateOfBirth,
      phone: context.phoneNumber,
      callbackUrl: process.env.NIN_VERIFICATION_CALLBACK_URL
    }
  });

  let parsed = {};
  try {
    parsed = response.body ? JSON.parse(response.body) : {};
  } catch (error) {
    return {
      success: false,
      message: 'Invalid response from NIN verification service.'
    };
  }

  if (response.statusCode >= 200 && response.statusCode < 300) {
    return {
      success: true,
      data: {
        nin,
        verified: true,
        verificationId: parsed.id || parsed.verificationId || `METAMAP-${Date.now()}`,
        provider: 'metamap',
        status: parsed.status || 'pending',
        message: 'NIN verification request accepted. Complete webhook confirmation if your provider requires asynchronous verification.'
      }
    };
  }

  return {
    success: false,
    message: parsed.message || parsed.error || 'NIN verification request was not accepted.'
  };
}

async function verifyWithNimc(nin, context = {}) {
  if (!DEFAULT_NIMC_BASE_URL || !process.env.NIMC_USERNAME || !process.env.NIMC_PASSWORD) {
    return {
      success: false,
      message: 'Official NIMC NVS credentials are not configured. Use NIN_VERIFICATION_PROVIDER=verifyme for live REST verification or keep demo mode for development.'
    };
  }

  const response = await requestJson('POST', DEFAULT_NIMC_BASE_URL, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.NIMC_USERNAME}:${process.env.NIMC_PASSWORD}`).toString('base64')}`
    },
    body: {
      nin,
      firstName: context.firstName,
      lastName: context.lastName,
      dateOfBirth: context.dateOfBirth,
      phoneNumber: context.phoneNumber
    }
  });

  let parsed = {};
  try {
    parsed = response.body ? JSON.parse(response.body) : {};
  } catch (error) {
    return {
      success: false,
      message: 'Invalid response from NIMC verification service.'
    };
  }

  if (response.statusCode >= 200 && response.statusCode < 300 && parsed.success !== false) {
    return {
      success: true,
      data: {
        nin,
        firstName: parsed.firstName || parsed.firstname || '',
        lastName: parsed.lastName || parsed.lastname || '',
        dateOfBirth: parsed.dateOfBirth || parsed.dob || '',
        verified: true,
        verificationId: parsed.verificationId || `NIMC-${Date.now()}`,
        provider: 'nimc'
      }
    };
  }

  return {
    success: false,
    message: parsed.message || parsed.error || 'NIMC verification failed.'
  };
}

function demoVerifyNIN(nin) {
  return {
    success: true,
    data: {
      nin,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      stateOfOrigin: '',
      lga: '',
      phone: '',
      verified: true,
      verificationId: `DEMO-${Date.now()}-${nin.slice(-4)}`,
      provider: 'demo',
      message: 'NIN verification simulated. Configure NIN_API_KEY and NIN_VERIFICATION_PROVIDER for live verification.'
    }
  };
}

async function verifyNIN(nin, context = {}) {
  if (!nin || nin.length !== 11 || !/^\d{11}$/.test(nin)) {
    return {
      success: false,
      message: 'Invalid NIN format. NIN must be 11 digits.'
    };
  }

  const provider = (process.env.NIN_VERIFICATION_PROVIDER || 'verifyme').toLowerCase();

  if (!NIN_API_KEY && provider !== 'demo') {
    return demoVerifyNIN(nin);
  }

  if (provider === 'metamap') return verifyWithMetaMap(nin, context);
  if (provider === 'nimc') return verifyWithNimc(nin, context);
  if (provider === 'demo') return demoVerifyNIN(nin);

  return verifyWithVerifyMe(nin, context);
}

async function checkNINExists(nin, userModel) {
  const UserModel = userModel || require('../models/User');
  const existing = await UserModel.findOne({ nin });
  if (existing) {
    return {
      exists: true,
      message: 'This NIN is already registered to another account. Each person may only register once.'
    };
  }
  return { exists: false };
}

module.exports = { verifyNIN, checkNINExists };
