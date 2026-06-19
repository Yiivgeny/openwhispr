const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  getParakeetModelConfig,
  resolveParakeetRuntimeFiles,
} = require("../../src/helpers/parakeetModelFiles");

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "parakeet-files-test-"));
}

function touch(dir, file) {
  fs.writeFileSync(path.join(dir, file), "");
}

test("resolves the packaged v3 int8 runtime files", () => {
  const tmp = makeTmpDir();
  try {
    for (const file of [
      "tokens.txt",
      "encoder.int8.onnx",
      "decoder.int8.onnx",
      "joiner.int8.onnx",
    ]) {
      touch(tmp, file);
    }

    const resolved = resolveParakeetRuntimeFiles("parakeet-tdt-0.6b-v3", tmp);

    assert.equal(resolved.ok, true);
    assert.equal(resolved.files.encoder.file, "encoder.int8.onnx");
    assert.equal(resolved.files.decoder.file, "decoder.int8.onnx");
    assert.equal(resolved.files.joiner.file, "joiner.int8.onnx");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("rejects v3 fp32 encoder without its external weights file", () => {
  const tmp = makeTmpDir();
  try {
    for (const file of ["tokens.txt", "encoder.onnx", "decoder.onnx", "joiner.onnx"]) {
      touch(tmp, file);
    }

    const resolved = resolveParakeetRuntimeFiles("parakeet-tdt-0.6b-v3", tmp);

    assert.equal(resolved.ok, false);
    assert.deepEqual(resolved.missing.find((entry) => entry.role === "encoder")?.candidates, [
      "encoder.int8.onnx",
      "encoder.onnx",
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("resolves v3 fp32 runtime files when encoder.weights is present", () => {
  const tmp = makeTmpDir();
  try {
    for (const file of [
      "tokens.txt",
      "encoder.onnx",
      "encoder.weights",
      "decoder.onnx",
      "joiner.onnx",
    ]) {
      touch(tmp, file);
    }

    const resolved = resolveParakeetRuntimeFiles("parakeet-tdt-0.6b-v3", tmp);

    assert.equal(resolved.ok, true);
    assert.equal(resolved.files.encoder.file, "encoder.onnx");
    assert.deepEqual(resolved.files.encoder.requiredCompanionFiles, ["encoder.weights"]);
    assert.equal(resolved.files.decoder.file, "decoder.onnx");
    assert.equal(resolved.files.joiner.file, "joiner.onnx");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("resolves the precise v3 fp16 runtime files only from the fp16 export layout", () => {
  const tmp = makeTmpDir();
  try {
    for (const file of ["tokens.txt", "encoder.onnx", "decoder.onnx", "joiner.onnx"]) {
      touch(tmp, file);
    }

    const resolved = resolveParakeetRuntimeFiles("parakeet-tdt-0.6b-v3-fp16", tmp);

    assert.equal(resolved.ok, true);
    assert.equal(resolved.files.encoder.file, "encoder.onnx");
    assert.deepEqual(resolved.files.encoder.requiredCompanionFiles, []);
    assert.equal(resolved.files.decoder.file, "decoder.onnx");
    assert.equal(resolved.files.joiner.file, "joiner.onnx");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("resolves the full precision v3 runtime files only from the fp32 export layout", () => {
  const tmp = makeTmpDir();
  try {
    for (const file of [
      "tokens.txt",
      "encoder.onnx",
      "encoder.weights",
      "decoder.onnx",
      "joiner.onnx",
    ]) {
      touch(tmp, file);
    }

    const resolved = resolveParakeetRuntimeFiles("parakeet-tdt-0.6b-v3-precise", tmp);

    assert.equal(resolved.ok, true);
    assert.equal(resolved.files.encoder.file, "encoder.onnx");
    assert.deepEqual(resolved.files.encoder.requiredCompanionFiles, ["encoder.weights"]);
    assert.equal(resolved.files.decoder.file, "decoder.onnx");
    assert.equal(resolved.files.joiner.file, "joiner.onnx");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("exposes downloadable configs for v3 precise models", () => {
  const fp16 = getParakeetModelConfig("parakeet-tdt-0.6b-v3-fp16");
  const fp32 = getParakeetModelConfig("parakeet-tdt-0.6b-v3-precise");

  assert.equal(
    fp16.url,
    "https://huggingface.co/Yiivgeny/parakeet-tdt-0.6b-v3-sherpa-onnx-fp16/resolve/main/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-fp16.tar.bz2"
  );
  assert.equal(fp16.extractDir, "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-fp16");

  assert.equal(
    fp32.url,
    "https://huggingface.co/Yiivgeny/parakeet-tdt-0.6b-v3-sherpa-onnx-fp32/resolve/main/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-fp32.tar.bz2"
  );
  assert.equal(fp32.extractDir, "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-fp32");
});
