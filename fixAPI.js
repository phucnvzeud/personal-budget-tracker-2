const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useFinancialData.ts');

// Read the file content
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Replace the dynamic API_URL with a hardcoded one
  const newContent = data.replace(
    /const API_URL = process\.env\.REACT_APP_API_URL \|\|\s+\(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1'\s+\? `\${window\.location\.protocol}\/\/${window\.location\.hostname}:\${window\.location\.port}`\s+: ''\); \/\/ Empty string for same-origin requests in production/g,
    "const API_URL = 'http://localhost:8080'; // Hardcoded URL for testing"
  );

  // Write the modified content back to the file
  fs.writeFile(filePath, newContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully updated API_URL in useFinancialData.ts');
  });
}); 