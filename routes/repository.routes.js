import express from "express";
import {
  createRepository,
  getRepositories,
  getRepositoryById,
  updateRepository,
  deleteRepository,
} from "../controller/repository.controller.js";

const router = express.Router();

router.route("/")
  .post(createRepository)
  .get(getRepositories);

router.route("/:id")
  .get(getRepositoryById)
  .patch(updateRepository)
  .delete(deleteRepository);

export default router;
