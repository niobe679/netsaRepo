const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();
app.use(express.json());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log("MongoDB connection error: ", err));
app.get('/', (req, res) => {
    res.send('Server is running!');
  });
  
  app.listen(PORT, () => {
    console.log(`Server is not listening on port ${PORT}`);
  });