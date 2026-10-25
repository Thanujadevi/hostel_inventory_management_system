import { matchesSearch } from '../src/utils/searchUtils.js';

const testItems = [
  { int_Item_Code: 'ITM-2026-001', txt_Item_Name: 'Study Desk Chair', txt_Category: 'Furniture', txt_Unit: 'Nos', dec_Price: 1200 },
  { int_Item_Code: 'ITM-2026-002', txt_Item_Name: 'Cooking Oil', txt_Category: 'Kitchen & Dining', txt_Unit: 'Litre', dec_Price: 150 },
  { int_Item_Code: 'ITM-2026-003', txt_Item_Name: 'Wooden Bed', txt_Category: 'Furniture', txt_Unit: 'Nos', dec_Price: 5000 },
  { int_Item_Code: 'ITM-2026-004', txt_Item_Name: 'LED Light Bulb', txt_Category: 'Electrical', txt_Unit: 'Nos', dec_Price: 200 },
  { int_Item_Code: 'ITM-2026-005', txt_Item_Name: 'Bed Sheet Double', txt_Category: 'Linen & Bedding', txt_Unit: 'Nos', dec_Price: 450 },
];

const testCases = [
  { query: 'd', expectedNames: ['Study Desk Chair', 'Cooking Oil', 'Wooden Bed', 'LED Light Bulb', 'Bed Sheet Double'] }, // all have 'd' in name, category, or code!
  { query: 'oil', expectedNames: ['Cooking Oil'] }, // substring search 'oil'
  { query: 'ook', expectedNames: ['Cooking Oil'] }, // substring search in between 'ook'
  { query: 'ing', expectedNames: ['Cooking Oil'] }, // substring search in between 'ing' (Kitchen & Dining, Cooking Oil)
  { query: 'co', expectedNames: ['Cooking Oil'] }, // prefix / acronym 'co'
  { query: 'c o', expectedNames: ['Cooking Oil'] }, // multi-token initials 'c o'
  { query: 'sdc', expectedNames: ['Study Desk Chair'] }, // acronym 'sdc' for Study Desk Chair
  { query: 's d c', expectedNames: ['Study Desk Chair'] }, // multi-token initials 's d c'
  { query: 'kd', expectedNames: ['Cooking Oil'] }, // acronym 'kd' for Kitchen & Dining
  { query: '2026', expectedNames: ['Study Desk Chair', 'Cooking Oil', 'Wooden Bed', 'LED Light Bulb', 'Bed Sheet Double'] }, // code substring
];

let failed = 0;
console.log('Running Search Unit Tests...\n');

testCases.forEach(({ query, expectedNames }) => {
  const matched = testItems.filter(item => matchesSearch(item, query));
  const matchedNames = matched.map(i => i.txt_Item_Name);
  
  const isMatch = expectedNames.every(name => matchedNames.includes(name));
  if (isMatch) {
    console.log(`[PASS] Query '${query}': Matched [${matchedNames.join(', ')}]`);
  } else {
    failed++;
    console.error(`[FAIL] Query '${query}': Expected [${expectedNames.join(', ')}], Got [${matchedNames.join(', ')}]`);
  }
});

console.log(`\nTest Summary: ${testCases.length - failed}/${testCases.length} tests passed.`);
process.exit(failed > 0 ? 1 : 0);
