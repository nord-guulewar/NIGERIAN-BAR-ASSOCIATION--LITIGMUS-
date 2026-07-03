const courtFeeStructure = {
  SC: {
    name: 'Supreme Court',
    fees: {
      Civil: {
        filingFee: 20000,
        hearingFee: 15000,
        processFee: 10000,
        bailiffFee: 5000,
        judgmentFee: 25000,
        motionFee: 15000,
        appealFee: 20000,
        certifiedTrueCopy: 500
      },
      Criminal: {
        filingFee: 20000,
        hearingFee: 15000,
        processFee: 10000,
        bailiffFee: 5000,
        judgmentFee: 25000
      }
    }
  },
  CA: {
    name: 'Court of Appeal',
    fees: {
      Civil: {
        filingFee: 15000,
        hearingFee: 12000,
        processFee: 8000,
        bailiffFee: 4000,
        judgmentFee: 20000,
        motionFee: 12000,
        appealFee: 15000
      },
      Criminal: {
        filingFee: 15000,
        hearingFee: 12000,
        processFee: 8000,
        bailiffFee: 4000,
        judgmentFee: 20000
      }
    }
  },
  FHC: {
    name: 'Federal High Court',
    fees: {
      Civil: {
        filingFee: 10000,
        hearingFee: 8000,
        processFee: 5000,
        bailiffFee: 3000,
        judgmentFee: 15000,
        motionFee: 8000
      },
      Criminal: {
        filingFee: 10000,
        hearingFee: 8000,
        processFee: 5000,
        bailiffFee: 3000,
        judgmentFee: 15000
      },
      Commercial: {
        filingFee: 15000,
        hearingFee: 10000,
        processFee: 7000,
        bailiffFee: 4000,
        judgmentFee: 20000
      },
      Tax: {
        filingFee: 12000,
        hearingFee: 9000,
        processFee: 6000,
        bailiffFee: 3000,
        judgmentFee: 18000
      },
      Maritime: {
        filingFee: 15000,
        hearingFee: 12000,
        processFee: 8000,
        bailiffFee: 5000,
        judgmentFee: 20000
      }
    }
  },
  SHC: {
    name: 'State High Court',
    fees: {
      Civil: {
        filingFee: 8000,
        hearingFee: 6000,
        processFee: 4000,
        bailiffFee: 2500,
        judgmentFee: 12000,
        motionFee: 6000
      },
      Criminal: {
        filingFee: 8000,
        hearingFee: 6000,
        processFee: 4000,
        bailiffFee: 2500,
        judgmentFee: 12000
      },
      Family: {
        filingFee: 6000,
        hearingFee: 5000,
        processFee: 3000,
        bailiffFee: 2000,
        judgmentFee: 10000
      },
      Land: {
        filingFee: 10000,
        hearingFee: 7000,
        processFee: 5000,
        bailiffFee: 3000,
        judgmentFee: 15000
      },
      Commercial: {
        filingFee: 12000,
        hearingFee: 8000,
        processFee: 6000,
        bailiffFee: 3500,
        judgmentFee: 18000
      },
      Labour: {
        filingFee: 7000,
        hearingFee: 5000,
        processFee: 3500,
        bailiffFee: 2000,
        judgmentFee: 10000
      }
    }
  },
  SCA: {
    name: 'Sharia Court of Appeal',
    fees: {
      Civil: {
        filingFee: 6000,
        hearingFee: 5000,
        processFee: 3000,
        bailiffFee: 2000,
        judgmentFee: 10000
      },
      Family: {
        filingFee: 5000,
        hearingFee: 4000,
        processFee: 2500,
        bailiffFee: 1500,
        judgmentFee: 8000
      }
    }
  },
  CCA: {
    name: 'Customary Court of Appeal',
    fees: {
      Civil: {
        filingFee: 6000,
        hearingFee: 5000,
        processFee: 3000,
        bailiffFee: 2000,
        judgmentFee: 10000
      },
      Family: {
        filingFee: 5000,
        hearingFee: 4000,
        processFee: 2500,
        bailiffFee: 1500,
        judgmentFee: 8000
      },
      Land: {
        filingFee: 7000,
        hearingFee: 5500,
        processFee: 3500,
        bailiffFee: 2500,
        judgmentFee: 12000
      }
    }
  },
  MC: {
    name: 'Magistrate Court',
    fees: {
      Civil: {
        filingFee: 3000,
        hearingFee: 2500,
        processFee: 1500,
        bailiffFee: 1000,
        judgmentFee: 5000,
        motionFee: 2000
      },
      Criminal: {
        filingFee: 3000,
        hearingFee: 2500,
        processFee: 1500,
        bailiffFee: 1000,
        judgmentFee: 5000
      },
      Family: {
        filingFee: 2500,
        hearingFee: 2000,
        processFee: 1200,
        bailiffFee: 800,
        judgmentFee: 4000
      }
    }
  },
  DC: {
    name: 'District Court',
    fees: {
      Civil: {
        filingFee: 2000,
        hearingFee: 1500,
        processFee: 1000,
        bailiffFee: 700,
        judgmentFee: 3500
      },
      Criminal: {
        filingFee: 2000,
        hearingFee: 1500,
        processFee: 1000,
        bailiffFee: 700,
        judgmentFee: 3500
      },
      Family: {
        filingFee: 1500,
        hearingFee: 1200,
        processFee: 800,
        bailiffFee: 500,
        judgmentFee: 3000
      }
    }
  }
};

const calculateCaseFees = (courtType, caseType) => {
  const court = courtFeeStructure[courtType];
  
  if (!court) {
    throw new Error(`Invalid court type: ${courtType}`);
  }

  const fees = court.fees[caseType] || court.fees.Civil;
  
  if (!fees) {
    throw new Error(`No fee structure found for ${caseType} in ${court.name}`);
  }

  const totalAmount = Object.entries(fees)
    .filter(([key]) => key.endsWith('Fee'))
    .reduce((sum, [, value]) => sum + value, 0);

  return {
    filingFee: fees.filingFee || 0,
    hearingFee: fees.hearingFee || 0,
    processFee: fees.processFee || 0,
    bailiffFee: fees.bailiffFee || 0,
    judgmentFee: fees.judgmentFee || 0,
    totalAmount,
    breakdown: fees
  };
};

const getAdditionalFees = (courtType, serviceType) => {
  const additionalServices = {
    SC: {
      certifiedTrueCopy: 500,
      recordOfProceedings: 20000,
      motionToRelist: 5000,
      motionToSetAside: 25000
    },
    CA: {
      certifiedTrueCopy: 400,
      recordOfProceedings: 15000,
      motionToRelist: 4000
    },
    FHC: {
      certifiedTrueCopy: 300,
      recordOfProceedings: 10000,
      affidavit: 2000
    },
    SHC: {
      certifiedTrueCopy: 250,
      recordOfProceedings: 8000,
      affidavit: 1500
    },
    MC: {
      certifiedTrueCopy: 150,
      recordOfProceedings: 3000,
      affidavit: 1000
    },
    DC: {
      certifiedTrueCopy: 100,
      recordOfProceedings: 2000,
      affidavit: 800
    }
  };

  const services = additionalServices[courtType] || additionalServices.MC;
  return services[serviceType] || 0;
};

module.exports = {
  courtFeeStructure,
  calculateCaseFees,
  getAdditionalFees
};
