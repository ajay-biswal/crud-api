import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Repository } from "../models/Repository.model.js";
import { User } from "../models/User.model.js";
import { initializeBareRepository } from "../services/repository.service.js";

const isValidObjectId = (value) => mongoose.isValidObjectId(value);
const repositoryFields = "name description visibility defaultBranch owner createdAt updatedAt";

export const createRepository = async (req, res) => {
  let repository;
  let storageInitialized = false;

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

    const storageKey = randomUUID();
    repository = await Repository.create({
      name: name.trim(),
      description: description.trim(),
      visibility,
      owner: ownerId,
      storageKey,
    });

    await initializeBareRepository(storageKey);
    storageInitialized = true;

    return res.status(201).json({
      message: "Repository created successfully.",
      repository: {
        _id: repository._id,
        name: repository.name,
        description: repository.description,
        visibility: repository.visibility,
        defaultBranch: repository.defaultBranch,
        owner: repository.owner,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt,
      },
      gitStorage: { initialized: true, transport: "not yet configured" },
    });
  } catch (error) {
    // Roll back metadata if Git initialization failed, so we don't leave a broken repository record.
    if (repository && !storageInitialized) {
      await Repository.deleteOne({ _id: repository._id }).catch((cleanupError) => {
        console.error("Repository metadata rollback failed:", cleanupError);
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({ message: "This owner already has a repository with that name." });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("createRepository failed:", error);
    return res.status(500).json({
      message: "Unable to create repository.",
      ...(process.env.NODE_ENV === "development" ? { detail: error.message } : {}),
    });
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

    const repository = await Repository.findById(id).select(repositoryFields).lean();
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }
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
    return res.status(200).json({ message: "Repository updated successfully.", repository });
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
    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "A valid ownerId is required." });
    }

    // Metadata-only deletion for now. Physical Git data is retained until authenticated
    // deletion, recovery, and retention policies are implemented.
    const repository = await Repository.findOneAndDelete({ _id: id, owner: ownerId });
    if (!repository) {
      return res.status(404).json({ message: "Repository not found for this owner." });
    }

    return res.status(200).json({
      message: "Repository metadata deleted. Git storage is retained pending safe cleanup policy.",
    });
  } catch (error) {
    console.error("deleteRepository failed:", error);
    return res.status(500).json({ message: "Unable to delete repository." });
  }
};
