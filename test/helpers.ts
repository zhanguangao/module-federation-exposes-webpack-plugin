import webpack, { Compiler } from "webpack";
import Server from "webpack-dev-server";
import path from "path";
import ModuleFederationExposesPlugin from "../src";
import type { Options } from "../src/generateExposes";

export function getOptions(
  baseDir: string,
  options?: Partial<Options>
): Options {
  const {
    exportFile = path.resolve(baseDir, "index.ts"),
    generateDir = path.resolve(baseDir, "exposes"),
    filetype,
    transform = (libraryName: string) => {
      return libraryName.replace("./", "../");
    },
  } = options || {};

  return {
    exportFile,
    generateDir,
    filetype,
    transform,
  };
}

export function getCompiler(pluginOptions: Options) {
  return webpack({
    mode: "development",
    entry: path.resolve(__dirname, "fixtures/index.ts"),
    output: {
      path: path.resolve(__dirname, "../outputs"),
      filename: "[name].[contenthash].js",
    },
    resolve: {
      extensions: [".ts", ".js", ".json"],
    },
    module: {
      rules: [{ test: /\.ts$/, loader: "ts-loader" }],
    },
    plugins: [new ModuleFederationExposesPlugin(pluginOptions)],
  });
}

export function createServer(baseDir: string) {
  const options = getOptions(baseDir);
  const compiler = getCompiler(options);
  return new Server({}, compiler);
}

export function compile(compiler: Compiler) {
  new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }

      return resolve(stats);
    });
  });
}
