const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");

const app = express();
dotenv.config();


const PORT = process.env.PORT || 3030;
app.use(cors());
app.use(express.json());

const { routeManager } = require("./routes/rts.js");
const { userRoute } = require("./routes/userRoutes.js");
const { adminRoute } = require("./routes/adminRoutes.js");
const { lodgeRoute } = require("./routes/lodgeRoutes.js");
const { commentRoute } = require("./routes/commentRoutes.js");

app.use("/", routeManager);
app.use("/users", userRoute);
app.use("/admin", adminRoute);
app.use("/lodges", lodgeRoute);
app.use("/lodges/comments", commentRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `CampusLife server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
});