const fs = require('fs');
let code = fs.readFileSync('server/src/index.js', 'utf8');

code = code.replace(
  'app.use(express.urlencoded({ limit: \'500mb\', extended: true }));',
  'app.use(express.urlencoded({ limit: \'500mb\', extended: true }));\napp.use((req,res,next)=>{console.log(req.method, req.url); next();});'
);

fs.writeFileSync('server/src/index.js', code);
