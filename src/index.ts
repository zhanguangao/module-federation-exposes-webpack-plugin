import { Compiler } from "webpack";
import { Options, generateExposes } from "./generateExposes";
import fs from "fs-extra";

declare interface FileSystemInfoEntry {
  safeTime: number;
  timestamp: number;
}

export default class ModuleFederationExposesPlugin {
  exportFile: Options["exportFile"];
  generateDir: Options["generateDir"];
  filetype: Options["filetype"];
  transform?: Options["transform"];
  prevTimestamps: Record<string, number>;

  constructor(options: Options) {
    const { exportFile, generateDir, filetype, transform } = options;
    this.exportFile = exportFile;
    this.generateDir = generateDir;
    this.filetype = filetype;
    this.transform = transform;

    this.prevTimestamps = {};
  }

  apply(compiler: Compiler) {
    // 在触发新编译之后但在编译实际开始之前，在监视模式下执行插件
    compiler.hooks.watchRun.tapAsync(
      this.constructor.name,
      async (compiler, callback) => {
        const changedFiles = this.getChangedFiles(compiler);
        // 当没有generateDir目录时，或exportFile文件改变时
        if (
          !fs.existsSync(this.generateDir) ||
          changedFiles.includes(this.exportFile)
        ) {
          await generateExposes({
            exportFile: this.exportFile,
            generateDir: this.generateDir,
            filetype: this.filetype,
            transform: this.transform,
          });
        }
        callback();
      }
    );
  }

  getChangedFiles(compiler: Compiler) {
    // 获取 compiler 对象中文件的时间戳
    const fileTimestamps = Array.from(compiler.fileTimestamps || []);

    const changedFiles = [];

    // 检查哪些文件发生了变化
    for (const [key, value] of fileTimestamps) {
      const timestamp = (value as FileSystemInfoEntry)?.timestamp;
      if (
        // 文件有时间戳
        timestamp &&
        // 文件首次出现 文件时间戳变化
        (!this.prevTimestamps[key] || timestamp > this.prevTimestamps[key])
      ) {
        // 更新文件的时间戳
        this.prevTimestamps[key] = timestamp;
        changedFiles.push(key);
      }
    }

    return changedFiles;
  }
}
