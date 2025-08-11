// Debug script to test mock flag
console.log('=== MOCK DEBUG TEST ===');
console.log('import.meta.env.VITE_MOCK_DATA:', import.meta.env.VITE_MOCK_DATA);
console.log('import.meta.env.DEV:', import.meta.env.DEV);
console.log('import.meta.env.MODE:', import.meta.env.MODE);

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true';
console.log('MOCK_ENABLED calculation:', MOCK_ENABLED);

export { MOCK_ENABLED as DEBUG_MOCK_ENABLED };