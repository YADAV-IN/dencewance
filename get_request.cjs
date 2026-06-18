const fs = require('fs');
const path = 'C:\\Users\\vipno\\.gemini\\antigravity\\brain\\816c3143-a36d-4b38-a128-da4d251b5d4e\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
const userInputs = lines.map(l => JSON.parse(l)).filter(o => o.type === 'USER_INPUT');
if(userInputs.length > 0) {
  const lastInput = userInputs[userInputs.length - 1];
  console.log(lastInput.content);
} else {
  console.log('No user input found');
}
