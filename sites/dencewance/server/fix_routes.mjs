import fs from 'fs';
const code = fs.readFileSync('src/index.js', 'utf8');
const fixed = code.replace(
  'const app = express();',
  "const app = express();\napp.get('/', (req, res) => res.json({ message: 'API is working! Open the frontend on Port 3000 to see the website.' }));"
);
fs.writeFileSync('src/index.js', fixed);
