const express = require("express");
const User = require("../models/userModel");
const Verification = require("../models/verificationModel");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const errorHandler = require("../middlewares/errorsMiddleware");
const authTokenHandler = require("../middlewares/checkAuthToken");
const responseFunction = require("../utils/responseFunction");

async function mailer(receiveremail, filesenderemail) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "spandan.mozumder.prof@gmail.com",
      pass: "tcev ctsn oxmk bseu",
    },
  });

  let info = await transporter.sendMail({
    from: "Team BitS",
    to: receiveremail,
    subject: "New File",
    text: "You received a new file from " + filesenderemail,
    html: "<b>You received a new file from " + filesenderemail + "</b>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

const storage = multer.diskStorage({
  discharge: (req, file, cb) => {
    cb(null, "./public");
  },
  filename: (req, file, cb) => {
    let fileType = file.mimetype.split("/")[1];
    console.log(req.headers.filename);
    cb(null, `${Date.now()}.${fileType}`);
  },
});

const upload = multer({ storage: storage });

const fileUploadFunction = (req, res, next) => {
  upload.single("clientfile")(req, res, (err) => {
    if (err) {
      return responseFunction(res, 400, "File upload failed", null, false);
    }
    next();
  });
};

router.get("/test", (req, res) => {
  res.send("File routes are working");
});

router.post(
  "/sharefile",
  authTokenHandler,
  fileUploadFunction,
  async (req, res, next) => {
    try {
      const { receiveremail, filename } = req.body;

      let senderuser = await User.findOne({ _id: req.userId });
      let receiveruser = await User.findOne({ email: receiveremail });

      if (!senderuser) {
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("File deleted successfully");
            }
          });
        }
        return responseFunction(
          res,
          400,
          "Sender email not found",
          null,
          false
        );
      }

      if (!receiveruser) {
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("File deleted successfully");
            }
          });
        }

        return responseFunction(
          res,
          400,
          "Receiver email not found",
          null,
          false
        );
      }

      if (senderuser.email === receiveremail) {
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("File deleted successfully");
            }
          });
        }

        return responseFunction(
          res,
          400,
          "Receiver email cannot be same as Sender email",
          null,
          false
        );
      }

      senderuser.files.push({
        senderemail: senderuser.email,
        receiveremail: receiveremail,
        fileurl: req.file.path,
        filename: filename ? filename : new Date().toLocaleDateString(),
        sharedAt: Date.now(),
      });

      receiveruser.files.push({
        senderemail: senderuser.email,
        receiveremail: receiveremail,
        fileurl: req.file.path,
        filename: filename ? filename : new Date().toLocaleDateString(),
        sharedAt: Date.now(),
      });

      await senderuser.save();
      await receiveruser.save();

      await mailer(receiveremail, senderuser.email);
      return responseFunction(res, 200, "File shared succesfully", null, true);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/getfiles", authTokenHandler, async (req, res, next) => {
  try {
    let user = await User.findOne({ _id: req.userId });
    if (!user) {
      return responseFunction(res, 400, "User not found", null, false);
    }
    return responseFunction(
      res,
      200,
      "Files fetched successfully",
      user.files,
      true
    );
  } catch (error) {
    next(error);
  }
});

router.use(errorHandler);

module.exports = router;
