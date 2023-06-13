const express = require("express");
const superadminController = require("../controllers/superadmin");
const isAuthmiddleware = require("../middleware/is-auth");
const ROLES = require("../middleware/roles");

const router = express.Router();

router.get(
  "/admins",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.SUPERADMIN]),
  superadminController.getAdmins
);

router.delete(
  "/deleteadmin/:adminId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.SUPERADMIN]),
  superadminController.deleteAdmin
);

router.delete(
  "/deletepost/:postId",
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkrole([ROLES.SUPERADMIN]),
  superadminController.superadminDeletePost
);

module.exports = router;
