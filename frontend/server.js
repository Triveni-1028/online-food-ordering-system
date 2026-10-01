const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 8004;
app.listen(PORT, () => console.log(`Frontend: http://localhost:${PORT}`));
