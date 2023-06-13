const express = require("express");

const adminController = require("../controllers/admin");
const isAuthmiddleware = require("../middleware/is-auth");
const ROLES = require("../middleware/roles");

const router = express.Router();

router.get(
  "/users",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.getUsers
);

router.get(
  "/allposts",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.getAllPosts
);

router.get(
  "/post/:postId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.getPost
);

router.delete(
  "/deletepost/:postId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.adminDeletePost
);

router.delete(
  "/post/:postId/comment/:commentId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.deleteComment
);

router.delete(
  "/deleteuser/:userId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.deleteUser
);

router.put(
  "/userStatus/:userId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  adminController.changeUserStatus
);

module.exports = router;
