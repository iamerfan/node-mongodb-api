const express = require("express");
const { ConnectToDatabase } = require("./connectMongo");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const dotenv = require("dotenv").config();

// const fs = require("fs");
// const multer = require("multer");
// const path = require("path");
// const upload = multer({ dest: "public/clothing" });

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());
app.listen(port, () => console.log(`Server is running on port ${port}`));

//  API's //

//home
app.get("/api/home", async (req, res) => {
  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const items = db.collection("items");
  try {
    const result = await items.find({}).toArray();
    return res.json(result);
  } catch (error) {
    console.log(error);
  } finally {
    await close();
  }
});

//item
app.get("/api/item/:id", async (req, res) => {
  const id = req.params.id;
  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const items = db.collection("items");
  try {
    const result = await items.findOne({ id });
    return res.json(result);
  } catch (error) {
    throw error;
  } finally {
    await close();
  }
});

//order
app.post("/api/order", async (req, res) => {
  const { user, cart } = await req.body();
  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const orders = db.collection("orders");
  try {
    const _id = new ObjectId(user.id);
    const available = await orders.findOne({ id: _id });
    if (!available) {
      const insert = await orders.insertOne({ id: _id, order: [cart] });
      return res.json(insert);
    }
    const availableOrders = available.order;
    return res.json(
      await orders.updateOne(
        { id: _id },
        { $set: { order: [...availableOrders, cart] } }
      )
    );
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await close();
  }
});

app.get("/api/order", async (req, res) => {
  const id = req.query.id;

  const { connect, close, db } = await ConnectToDatabase();

  await connect();

  const orders = db.collection("orders");

  try {
    const order = await orders.findOne({ id });

    return res.json(order);
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await close();
  }
});

//search
app.get("/api/search", async (req, res) => {
  const { q, category } = req.query;
  const { connect, close, db } = await ConnectToDatabase();
  connect();
  const items = db.collection("items");

  try {
    let filter = {};
    if (q)
      filter = {
        $or: [
          { title: q },
          { tags: q },
          { colors: { $elemMatch: { $or: [{ enTitle: q }, { title: q }] } } },
        ],
      };
    const result = await items.find(filter).toArray();
    return res.json(result);
  } catch (error) {
    console.log(error);
  } finally {
    await close();
  }
});

//login
app.post("/api/auth/login", async (req, res) => {
  const data = req.body;
  if (!data) return res.json("اشکال در دریافت اطلاعات کاربر");
  const { email, password } = data;

  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ email, password });
    if (!user) return res.json({ status: "not correct" });
    return res.json({
      status: "success",
      user: { ...user, password: "" },
    });
  } catch (error) {
    throw error;
  } finally {
    await close();
  }
});

//signup
app.post("/api/auth/signup", async (req, res) => {
  const data = await req.body;
  const { db, close, connect } = await ConnectToDatabase();
  await connect();

  const users = db.collection("users");
  const notUnique = await users.findOne({ email: data.email });
  if (notUnique)
    return res.json({
      message: "ایمیل شما قبلا در سیستم ثبت شده است",
      status: "not unique",
    });

  try {
    const user = await users.insertOne(data);
    if (user)
      return res.json({
        status: "success",
        data: { ...data, password: "" },
      });
  } catch (error) {
    throw error;
  } finally {
    await close();
  }
});

//profile
app.get("/api/auth/profile/:id", async (req, res) => {
  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const users = db.collection("users");

  const { id } = req.params;
  if (!id) return res.json("اشکال در دریافت اطلاعات کاربر");

  try {
    const _id = new ObjectId(id);
    const user = await users.findOne({ _id });
    if (!user) return res.json({ status: "not correct" });
    return res.json({ ...user, password: "" });
  } catch (error) {
    throw error;
  } finally {
    await close();
  }
});
app.put("/api/auth/profile", async (req, res) => {
  const data = await req.body;
  const { connect, close, db } = await ConnectToDatabase();
  await connect();
  const users = db.collection("users");
  if (!data) return res.json("اشکال در دریافت اطلاعات کاربر");
  const { email, password } = data;

  try {
    const user = await users.findOne({ email });
    if (password !== user?.password) return res.json("not correct");
    const updatedData = data.newPassword
      ? { ...data, password: data.newPassword }
      : { ...data };
    const value = await users.findOneAndUpdate(
      { email },
      { $set: { ...updatedData } },
      { returnDocument: "after" }
    );
    if (!value) throw new Error();
    return res.json({ user: { ...value, password: "" } });
  } catch (error) {
    throw error;
  } finally {
    await close();
  }
});

//admin

// //add item
// app.post("/api/auth/admin", async (req, res) => {
//   const { item } = await req.body;
//   if (!item)
//     return res.status(400).json("Error in receiving product information");

//   const { connect, close, db } = await ConnectToDatabase();
//   await connect();
//   const items = db.collection("items");

//   const lastItem = await items.find().sort({ id: -1 }).limit(1).toArray();
//   const lastItemId = lastItem.length > 0 ? Number(lastItem[0].id) : 0;
//   const data = { ...item, id: (lastItemId + 1).toString() };

//   try {
//     const result = await items.insertOne(data);
//     return res.status(200).json(result);
//   } catch (error) {
//     throw error;
//   } finally {
//     await close();
//   }
// });

// //item upload img
// app.post("/api/auth/admin/upload", upload.array("images"), async (req, res) => {
//   try {
//     const urls = req.files.map((file) => {
//       const extension = path.extname(file.originalname);
//       const newName = `${Date.now()}${extension}`;
//       const newPath = `/clothing/${newName}`;
//       fs.renameSync(file.path, `public${newPath}`);
//       return newPath;
//     });
//     return res.json({ ...urls });
//   } catch (error) {
//     console.error("Error uploading files:", error);
//     return res.json({ error: "Failed to upload files" });
//   }
// });

module.exports = app;
