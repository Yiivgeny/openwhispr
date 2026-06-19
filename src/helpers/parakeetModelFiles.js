const fs = require("fs");
const path = require("path");

const modelRegistryData = require("../models/modelRegistryData.json");

const DEFAULT_RUNTIME_FILES = {
  tokens: ["tokens.txt"],
  encoder: ["encoder.int8.onnx"],
  decoder: ["decoder.int8.onnx"],
  joiner: ["joiner.int8.onnx"],
  requiredCompanionFiles: [],
};

function getParakeetModelInfo(modelName) {
  return modelRegistryData.parakeetModels[modelName] || null;
}

function getValidParakeetModelNames() {
  return Object.keys(modelRegistryData.parakeetModels);
}

function normalizeCandidate(candidate) {
  if (typeof candidate === "string") {
    return { file: candidate, requiredCompanionFiles: [] };
  }

  if (candidate && typeof candidate === "object" && typeof candidate.file === "string") {
    return {
      file: candidate.file,
      requiredCompanionFiles: Array.isArray(candidate.requiredCompanionFiles)
        ? candidate.requiredCompanionFiles
        : [],
    };
  }

  return null;
}

function getCandidates(runtimeFiles, role) {
  const candidates = runtimeFiles?.[role] || DEFAULT_RUNTIME_FILES[role];
  return candidates.map(normalizeCandidate).filter(Boolean);
}

function getParakeetRuntimeConfig(modelName) {
  const modelInfo = getParakeetModelInfo(modelName);
  const runtimeFiles = modelInfo?.runtimeFiles || DEFAULT_RUNTIME_FILES;

  return {
    tokens: getCandidates(runtimeFiles, "tokens"),
    encoder: getCandidates(runtimeFiles, "encoder"),
    decoder: getCandidates(runtimeFiles, "decoder"),
    joiner: getCandidates(runtimeFiles, "joiner"),
    requiredCompanionFiles: Array.isArray(runtimeFiles.requiredCompanionFiles)
      ? runtimeFiles.requiredCompanionFiles
      : [],
  };
}

function resolveCandidate(modelDir, candidates) {
  for (const candidate of candidates) {
    const candidatePath = path.join(modelDir, candidate.file);
    if (!fs.existsSync(candidatePath)) continue;

    const missingCompanions = candidate.requiredCompanionFiles.filter(
      (file) => !fs.existsSync(path.join(modelDir, file))
    );
    if (missingCompanions.length > 0) continue;

    return {
      file: candidate.file,
      path: candidatePath,
      requiredCompanionFiles: candidate.requiredCompanionFiles,
    };
  }

  return null;
}

function resolveParakeetRuntimeFiles(modelName, modelDir) {
  const config = getParakeetRuntimeConfig(modelName);
  const missing = [];
  const files = {};

  for (const role of ["tokens", "encoder", "decoder", "joiner"]) {
    const resolved = resolveCandidate(modelDir, config[role]);
    if (resolved) {
      files[role] = resolved;
    } else {
      missing.push({
        role,
        candidates: config[role].map((candidate) => candidate.file),
      });
    }
  }

  for (const companionFile of config.requiredCompanionFiles) {
    if (!fs.existsSync(path.join(modelDir, companionFile))) {
      missing.push({
        role: "requiredCompanionFile",
        candidates: [companionFile],
      });
    }
  }

  return {
    ok: missing.length === 0,
    files,
    missing,
  };
}

function formatMissingRuntimeFiles(missing) {
  return missing.map(({ role, candidates }) => `${role}: ${candidates.join(" or ")}`).join(", ");
}

function getParakeetModelConfig(modelName) {
  const modelInfo = getParakeetModelInfo(modelName);
  if (!modelInfo) return null;

  return {
    url: modelInfo.downloadUrl,
    size: modelInfo.expectedSizeBytes || modelInfo.sizeMb * 1_000_000,
    language: modelInfo.language,
    supportedLanguages: modelInfo.supportedLanguages || [],
    extractDir: modelInfo.extractDir,
  };
}

function getDirectorySizeSync(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        total += getDirectorySizeSync(entryPath);
      } else if (entry.isFile()) {
        total += fs.statSync(entryPath).size;
      }
    } catch {}
  }
  return total;
}

module.exports = {
  formatMissingRuntimeFiles,
  getDirectorySizeSync,
  getParakeetModelConfig,
  getParakeetRuntimeConfig,
  getValidParakeetModelNames,
  resolveParakeetRuntimeFiles,
};
