require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json()); // Middleware to parse JSON bodies

//Routes
const userRoutes = require("./routers/userRoutes");

app.use("/api/users", userRoutes);

app.listen(PORT);
