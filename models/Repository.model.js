import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Repository name is required"],
      trim: true,
      minlength: [1, "Repository name cannot be empty"],
      maxlength: [100, "Repository name cannot exceed 100 characters"],
      match: [/^[a-zA-Z0-9._-]+$/, "Repository name may contain letters, numbers, dots, underscores, and hyphens only"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Repository owner is required"],
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    defaultBranch: {
      type: String,
      default: "main",
      trim: true,
    },
    // Reserved for the future Git-storage service. Never accept this value from API input.
    storageKey: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
  },
  { timestamps: true }
);

repositorySchema.index({ owner: 1, name: 1 }, { unique: true });

export const Repository = mongoose.model("Repository", repositorySchema);
