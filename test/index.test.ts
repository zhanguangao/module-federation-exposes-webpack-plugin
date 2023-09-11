import Server from "webpack-dev-server";
import fs from "fs-extra";
import path from "path";
import { createServer, getOptions } from "./helpers";
import { generateExposes } from "../src/generateExposes";

const baseDir = path.join(__dirname, "temp");

async function generate(content: { index: string; utils: string }) {
  const exportFile = path.join(baseDir, "index.ts");
  const utilsPath = path.join(baseDir, "utils.ts");

  await fs.writeFile(exportFile, content.index);
  await fs.writeFile(utilsPath, content.utils);

  const options = getOptions(baseDir);
  await generateExposes(options);
}

async function checkFileData(filename: string, strData: string) {
  const data = await fs.readFile(path.join(baseDir, `exposes/${filename}`), {
    encoding: "utf-8",
  });
  expect(data).toBe(strData);
}

async function checkJsonData(jsonData: Record<string, string>) {
  const data = await fs.readJSON(path.join(baseDir, "exposes/index.json"));
  expect(data).toEqual(jsonData);
}

async function checkFileIsExists(filename: string, flag = true) {
  const boolean = await fs.exists(path.join(baseDir, `exposes/${filename}`));
  expect(boolean).toBe(flag);
}

beforeEach(async () => {
  // 判断是否生成了临时目录, 没有则生成
  const isExists = await fs.exists(baseDir);
  if (!isExists) {
    await fs.mkdir(baseDir);
  }
});

afterEach(async () => {
  // 执行完测试用例后删除临时文件
  await fs.remove(baseDir);
});

describe("test generateExposes", () => {
  test("test one ExportSpecifier", async () => {
    await generate({
      index: `export { get } from "./utils";`,
      utils: `export function get() {}`,
    });
    await checkFileData("get.ts", `export { get as default } from "../utils";`);
    await checkJsonData({ "./get": "./exposes/get" });
  });

  test("test two ExportSpecifier", async () => {
    await generate({
      index: `export { get, pick } from "./utils";`,
      utils: `export function get() {}
              export function pick() {}`,
    });
    await checkFileData("get.ts", `export { get as default } from "../utils";`);
    await checkFileData(
      "pick.ts",
      `export { pick as default } from "../utils";`
    );
    await checkJsonData({
      "./get": "./exposes/get",
      "./pick": "./exposes/pick",
    });
  });

  test("test renamed ExportSpecifier", async () => {
    await generate({
      index: `export { get as myGet } from "./utils";`,
      utils: `export function get() {}`,
    });
    await checkFileData(
      "myGet.ts",
      `export { get as default } from "../utils";`
    );
    await checkJsonData({ "./myGet": "./exposes/myGet" });
  });

  test("test one ExportSpecifier and one renamed ExportSpecifier", async () => {
    await generate({
      index: `export { get, pick as myPick } from "./utils";`,
      utils: `export function get() {}
              export function pick() {}`,
    });
    await checkFileData("get.ts", `export { get as default } from "../utils";`);
    await checkFileData(
      "myPick.ts",
      `export { pick as default } from "../utils";`
    );
    await checkJsonData({
      "./get": "./exposes/get",
      "./myPick": "./exposes/myPick",
    });
  });

  test("test default ExportSpecifier", async () => {
    await generate({
      index: `export { default } from "./utils";`,
      utils: `export default { }`,
    });
    await checkFileData("default.ts", `export { default } from "../utils";`);
    await checkJsonData({ "./default": "./exposes/default" });
  });

  test("test renamed default ExportSpecifier", async () => {
    await generate({
      index: `export { default as Utils } from "./utils";`,
      utils: `export default { }`,
    });
    await checkFileData("Utils.ts", `export { default } from "../utils";`);
    await checkJsonData({ "./Utils": "./exposes/Utils" });
  });

  test("test ExportAllDeclaration", async () => {
    await generate({
      index: `export * as utils from "./utils";`,
      utils: `export function get() {}
              export function pick() {}`,
    });
    await checkFileData("utils.ts", `export * as default from "../utils";`);
    await checkJsonData({ "./utils": "./exposes/utils" });
  });

  test("test export type", async () => {
    await generate({
      index: `export type { TUtils } from "./utils";`,
      utils: `export type TUtils = {};`,
    });
    await checkFileIsExists("TUtils.ts", false);
    await checkJsonData({});
  });
});

describe("test as a webpack plugin", () => {
  let server: Server;

  beforeEach(async () => {
    await generate({
      index: `export { get } from "./utils";`,
      utils: `export function get() {}`,
    });

    server = createServer(baseDir);
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  test("test init server", async () => {
    await checkFileData("get.ts", `export { get as default } from "../utils";`);
    await checkJsonData({ "./get": "./exposes/get" });
  });

  test("test file change", async () => {
    await generate({
      index: `export { pick } from "./utils";`,
      utils: `export function pick() {}`,
    });
    await checkFileData(
      "pick.ts",
      `export { pick as default } from "../utils";`
    );
    await checkJsonData({ "./pick": "./exposes/pick" });
  });
});
