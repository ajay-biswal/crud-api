import mongoose from "mongoose";
import { Repository } from "../models/Repository.model.js";
import { User } from "../models/User.model.js";

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const repositoryFields = "name description visibility defaultBranch owner createdAt updatedAt";

export const createRepository = async (req, res) => {
  try {
    const { name, description = "", visibility = "private", ownerId } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "A repository name is required." });
    }

    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "A valid ownerId is required." });
    }

    if (typeof description !== "string") {
      return res.status(400).json({ message: "description must be a string." });
    }

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ message: "visibility must be public or private." });
    }

    const ownerExists = await User.exists({ _id: ownerId });
    if (!ownerExists) {
      return res.status(404).json({ message: "Repository owner was not found." });
    }

    const repository = await Repository.create({
      name: name.trim(),
      description: description.trim(),
      visibility,
      owner: ownerId,
    });

    return res.status(201).json({
      message: "Repository created successfully.",
      repository,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This owner already has a repository with that name." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("createRepository failed:", error);
    return res.status(500).json({ message: "Unable to create repository." });
  }
};

export const getRepositories = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const filter = {};

    if (ownerId !== undefined) {
      if (!isValidObjectId(ownerId)) {
        return res.status(400).json({ message: "ownerId must be a valid ID." });
      }
      filter.owner = ownerId;
    } else {
      // Without authentication, only public repositories may be listed globally.
      filter.visibility = "public";
    }

    const repositories = await Repository.find(filter)
      .select(repositoryFields)
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({ count: repositories.length, repositories });
  } catch (error) {
    console.error("getRepositories failed:", error);
    return res.status(500).json({ message: "Unable to fetch repositories." });
  }
};

export const getRepositoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Repository ID is invalid." });
    }

    const repository = await Repository.findById(id)
      .select(repositoryFields)
      .lean();

    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    // Private-repository authorization will be enforced once authentication is implemented.
    if (repository.visibility === "private") {
      return res.status(403).json({ message: "Private repository access requires authentication." });
    }

    return res.status(200).json({ repository });
  } catch (error) {
    console.error("getRepositoryById failed:", error);
    return res.status(500).json({ message: "Unable to fetch repository." });
  }
};

export const updateRepository = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, name, description, visibility, defaultBranch } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Repository ID is invalid." });
    }

    // Temporary ownership check until authenticated sessions are added.
    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "A valid ownerId is required." });
    }

    const repository = await Repository.findOne({ _id: id, owner: ownerId });
    if (!repository) {
      return res.status(404).json({ message: "Repository not found for this owner." });
    }

    if (name !== undefined) repository.name = name;
    if (description !== undefined) repository.description = description;
    if (visibility !== undefined) repository.visibility = visibility;
    if (defaultBranch !== undefined) repository.defaultBranch = defaultBranch;

    await repository.save();

    return res.status(200).json({
      message: "Repository updated successfully.",
      repository,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This owner already has a repository with that name." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("updateRepository failed:", error);
    return res.status(500).json({ message: "Unable to update repository." });
  }
};

export const deleteRepository = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Repository ID is invalid." });
    }

    // Temporary ownership check until authenticated sessions are added.
    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "A valid ownerId is required." });
    }

    const repository = await Repository.findOneAndDelete({ _id: id, owner: ownerId });

    if (!repository) {
      return res.status(404).json({ message: "Repository not found for this owner." });
    }

    return res.status(200).json({ message: "Repository deleted successfully." });
  } catch (error) {
    console.error("deleteRepository failed:", error);
    return res.status(500).json({ message: "Unable to delete repository." });
  }
};
