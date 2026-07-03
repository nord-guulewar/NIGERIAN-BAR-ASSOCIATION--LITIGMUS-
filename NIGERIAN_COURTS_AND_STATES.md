# Nigerian Courts and State Codes Reference

## Nigerian States with Codes

This system supports all 36 states of Nigeria plus the Federal Capital Territory (FCT).

| State Name | Code | Capital | Geopolitical Zone |
|------------|------|---------|-------------------|
| Abia | AB | Umuahia | South East |
| Adamawa | AD | Yola | North East |
| Akwa Ibom | AK | Uyo | South South |
| Anambra | AN | Awka | South East |
| Bauchi | BA | Bauchi | North East |
| Bayelsa | BY | Yenagoa | South South |
| Benue | BE | Makurdi | North Central |
| Borno | BO | Maiduguri | North East |
| Cross River | CR | Calabar | South South |
| Delta | DE | Asaba | South South |
| Ebonyi | EB | Abakaliki | South East |
| Edo | ED | Benin City | South South |
| Ekiti | EK | Ado-Ekiti | South West |
| Enugu | EN | Enugu | South East |
| FCT | FC | Abuja | North Central |
| Gombe | GO | Gombe | North East |
| Imo | IM | Owerri | South East |
| Jigawa | JI | Dutse | North West |
| Kaduna | KD | Kaduna | North West |
| Kano | KN | Kano | North West |
| Katsina | KT | Katsina | North West |
| Kebbi | KE | Birnin Kebbi | North West |
| Kogi | KO | Lokoja | North Central |
| Kwara | KW | Ilorin | North Central |
| Lagos | LA | Ikeja | South West |
| Nasarawa | NA | Lafia | North Central |
| Niger | NI | Minna | North Central |
| Ogun | OG | Abeokuta | South West |
| Ondo | ON | Akure | South West |
| Osun | OS | Osogbo | South West |
| Oyo | OY | Ibadan | South West |
| Plateau | PL | Jos | North Central |
| Rivers | RI | Port Harcourt | South South |
| Sokoto | SO | Sokoto | North West |
| Taraba | TA | Jalingo | North East |
| Yobe | YO | Damaturu | North East |
| Zamfara | ZA | Gusau | North West |

## Nigerian Court System Hierarchy

### 1. Supreme Court (SC)
- **Level**: Apex Court (Level 1)
- **Jurisdiction**: Federal
- **Location**: Abuja
- **Description**: The highest court in Nigeria with final appellate jurisdiction over all courts
- **Composition**: Chief Justice of Nigeria and up to 21 Justices
- **Cases**: Final appeals from Court of Appeal

### 2. Court of Appeal (CA)
- **Level**: Intermediate Appellate Court (Level 2)
- **Jurisdiction**: Federal
- **Divisions**: 
  - Lagos Division
  - Abuja Division
  - Enugu Division
  - Kaduna Division
  - Ibadan Division
  - Benin Division
  - Jos Division
  - Calabar Division
  - Ilorin Division
  - Port Harcourt Division
  - Sokoto Division
  - Yola Division
  - Makurdi Division
- **Description**: Hears appeals from Federal High Court, State High Courts, Sharia Court of Appeal, and Customary Court of Appeal
- **Composition**: President of the Court of Appeal and up to 90 Justices

### 3. Federal High Court (FHC)
- **Level**: Superior Court (Level 3)
- **Jurisdiction**: Federal
- **Locations**: All state capitals and FCT
- **Exclusive Jurisdiction**:
  - Revenue matters (taxation, customs, excise)
  - Banking and financial institutions
  - Companies and allied matters
  - Copyright, patents, trademarks
  - Citizenship and naturalization
  - Immigration and deportation
  - Admiralty and maritime
  - Aviation
  - Mines and minerals
  - Federal Government disputes
  - Electoral matters (federal)
  - Labour and industrial relations (federal)

### 4. State High Court (SHC)
- **Level**: Superior Court (Level 3)
- **Jurisdiction**: State
- **Availability**: All 36 states
- **Description**: Unlimited original jurisdiction except matters reserved for Federal High Court
- **Cases**:
  - Civil matters above Magistrate Court jurisdiction
  - Criminal matters (felonies)
  - Land matters
  - Probate and administration of estates
  - Matrimonial causes
  - Constitutional matters (state)
  - Appeals from Magistrate Courts

### 5. Sharia Court of Appeal (SCA)
- **Level**: Appellate Court (Level 3)
- **Jurisdiction**: State
- **Availability**: Northern states and some others
- **Description**: Hears appeals on Islamic personal law matters
- **Applicable States**:
  - Bauchi, Borno, Gombe, Jigawa, Kaduna, Kano, Katsina, Kebbi
  - Kwara, Niger, Sokoto, Yobe, Zamfara
  - And other states that have adopted Sharia
- **Cases**:
  - Marriage, divorce, family relationships
  - Guardianship of infants
  - Gifts, wills, succession (Muslims)
  - Wakf (Islamic endowment)

### 6. Customary Court of Appeal (CCA)
- **Level**: Appellate Court (Level 3)
- **Jurisdiction**: State
- **Availability**: States with customary law systems
- **Description**: Hears appeals on customary law matters
- **Cases**:
  - Marriage, family, guardianship (under customary law)
  - Inheritance and succession (customary law)
  - Land matters (customary tenure)
  - Chieftaincy matters

### 7. Magistrate Court (MC)
- **Level**: Lower Court (Level 4)
- **Jurisdiction**: State
- **Availability**: All states and local government areas
- **Description**: Handles minor civil and criminal matters
- **Civil Jurisdiction**: Usually up to ₦1,000,000 - ₦5,000,000 (varies by state)
- **Criminal Jurisdiction**: Misdemeanors and some felonies
- **Grades**:
  - Chief Magistrate Court
  - Magistrate Court Grade I
  - Magistrate Court Grade II

### 8. District Court (DC)
- **Level**: Lower Court (Level 4)
- **Jurisdiction**: State
- **Availability**: Selected states (mainly northern states)
- **Description**: Similar to Magistrate Courts in some states
- **Cases**: Minor civil and criminal matters at local level

## Case Types Supported

The system supports the following case types:

1. **Civil**: Contract disputes, torts, property disputes
2. **Criminal**: Felonies, misdemeanors, criminal offenses
3. **Family**: Divorce, custody, maintenance, adoption
4. **Commercial**: Business disputes, corporate matters
5. **Land**: Land disputes, property rights, boundaries
6. **Constitutional**: Constitutional interpretation, fundamental rights
7. **Labour**: Employment disputes, industrial relations
8. **Tax**: Tax disputes, revenue matters
9. **Maritime**: Shipping, admiralty matters
10. **Election**: Electoral disputes, election petitions
11. **Other**: Miscellaneous cases

## Case Number Format

The system generates case numbers in the following format:

```
[COURT_CODE]/[STATE_CODE]/[CASE_TYPE]/[SEQUENCE]/[YEAR]
```

### Examples:
- `FHC/LA/CIV/00001/2024` - Federal High Court, Lagos, Civil case #1, 2024
- `SHC/AB/CRM/00025/2024` - State High Court, Abia, Criminal case #25, 2024
- `MC/FC/FAM/00100/2024` - Magistrate Court, FCT, Family case #100, 2024

## Payment Types

The system handles various payment types:

1. **Filing Fee**: Initial case filing fees
2. **Hearing Fee**: Fees for court hearings
3. **Judgment Fee**: Fees for judgment execution
4. **Administrative Fee**: General administrative costs
5. **Court Maintenance**: Building and facility maintenance
6. **Staff Salary**: Court staff salaries
7. **Utilities**: Electricity, water, internet
8. **Equipment**: Office equipment and supplies
9. **Other**: Miscellaneous payments

## Receipt Number Format

```
RCP/[STATE_CODE]/[PAYMENT_TYPE]/[YYYYMMDD]/[TIMESTAMP]
```

### Example:
- `RCP/LA/FIL/20240115/123456` - Receipt for Filing Fee in Lagos

## Geopolitical Zones

Nigeria is divided into 6 geopolitical zones:

1. **North Central**: Benue, FCT, Kogi, Kwara, Nasarawa, Niger, Plateau
2. **North East**: Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe
3. **North West**: Jigawa, Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara
4. **South East**: Abia, Anambra, Ebonyi, Enugu, Imo
5. **South South**: Akwa Ibom, Bayelsa, Cross River, Delta, Edo, Rivers
6. **South West**: Ekiti, Lagos, Ogun, Ondo, Osun, Oyo

## Usage in the System

### When Registering a Case:
1. Select the appropriate **Court Type** (SC, CA, FHC, SHC, etc.)
2. Select the **State** where the case is filed
3. Select the **Case Type** (Civil, Criminal, etc.)
4. The system will automatically generate a unique **Case Number**
5. The system will assign an available **Judge** based on:
   - Court type match
   - State match
   - Case type specialization
   - Current workload

### Judge Assignment Logic:
- Judges are assigned based on their court type, state, and specialization
- The system checks the judge's current workload against their maximum daily cases
- Judges with lower workload are prioritized
- If no judge is available, the case is registered without assignment

### Payment Processing:
- All payments are tracked with unique receipt numbers
- Daily due payments are automatically calculated
- Overdue payments are flagged for follow-up
- Payment reports can be generated by state, court type, or payment type

## API Endpoints for States and Courts

### Get All States
```
GET /api/states
```

### Get State by Code
```
GET /api/states/:code
```

### Get States by Zone
```
GET /api/states/zone/:zone
```

### Get All Courts
```
GET /api/courts
```

### Get Court by Code
```
GET /api/courts/:code
```

### Get Case Types
```
GET /api/courts/types
```

## Notes

- All state codes are two-letter uppercase codes
- Court codes are 2-4 letter uppercase codes
- The system is designed to be extensible for future court types
- Offline functionality ensures data is not lost when internet is unavailable
- All timestamps are stored in ISO 8601 format
- Currency is Nigerian Naira (₦)

## References

- Constitution of the Federal Republic of Nigeria 1999 (as amended)
- Court of Appeal Act
- Federal High Court Act
- High Court Laws of various states
- Magistrates' Courts Laws of various states

---

**Last Updated**: January 2024
**Version**: 1.0.0
