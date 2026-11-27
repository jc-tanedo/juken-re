const { withProjectBuildGradle } = require('expo/config-plugins');

const SHERPA_ONNX_IVY_MARKER = "includeGroup 'com.k2fsa.sherpa.onnx'";

const SHERPA_ONNX_IVY_BLOCK = `    ivy {
      url 'https://github.com/k2-fsa/sherpa-onnx/releases/download'
      patternLayout {
        artifact 'v[revision]/[artifact]-[revision].[ext]'
      }
      metadataSources {
        artifact()
      }
      content {
        includeGroup 'com.k2fsa.sherpa.onnx'
      }
    }`;

function addSherpaOnnxRepo(contents) {
  if (contents.includes(SHERPA_ONNX_IVY_MARKER)) {
    return contents;
  }

  const allProjectsMatch = /(allprojects\s*\{[\s\S]*?repositories\s*\{)/.exec(contents);
  if (allProjectsMatch) {
    const insertAt = allProjectsMatch.index + allProjectsMatch[0].length;
    return `${contents.slice(0, insertAt)}\n${SHERPA_ONNX_IVY_BLOCK}${contents.slice(insertAt)}`;
  }

  return `${contents.trimEnd()}\n\nallprojects {\n  repositories {\n${SHERPA_ONNX_IVY_BLOCK}\n  }\n}\n`;
}

module.exports = function withSherpaOnnxRepo(config) {
  return withProjectBuildGradle(config, modConfig => {
    modConfig.modResults.contents = addSherpaOnnxRepo(modConfig.modResults.contents);
    return modConfig;
  });
};

module.exports.addSherpaOnnxRepo = addSherpaOnnxRepo;
