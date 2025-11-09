require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

const userRoutes = require("./routers/userRoutes");
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
