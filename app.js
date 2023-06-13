const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const blogRoutes = require("./routes/blog");
const adminBlogRoutes = require("./routes/admin");
const superadminBlogRoutes = require("./routes/superadmin");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin-auth");
const superAdminRoutes = require("./routes/superadmin-auth");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.use("/blog", blogRoutes);
app.use("/admin", adminBlogRoutes);
app.use("/superadmin", superadminBlogRoutes);
app.use("/user/auth", authRoutes);
app.use("/admin/auth", adminRoutes);
app.use("/superadmin/auth", superAdminRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, (err) => {
      if (!err) {
        console.log(`Server listening at Port: ${process.env.PORT || 3000}`);
      } else console.log(err);
    });
  })
  .catch((err) => {
    console.log(err);
  });
