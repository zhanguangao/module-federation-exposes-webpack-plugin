# module-federation-exposes-webpack-plugin

## 安装

```
$ yarn add module-federation-exposes-webpack-plugin -D

or

$ npm install module-federation-exposes-webpack-plugin -D
```

## 使用

webpack.config.ts:

```typescript
import path from "path";
import webpack, { Configuration } from "webpack";
import ModuleFederationExposesPlugin from "module-federation-exposes-webpack-plugin";

const config: Configuration = {
  plugins: [
    new ModuleFederationExposesPlugin({
      exportFile: path.resolve(__dirname, "index.ts"),
      generateDir: path.resolve(__dirname, "../exposes"),
      transform: (libraryName: string) => {
        return libraryName.replace("./", "../fixtures/");
      },
    }),
  ],
};

export default config;
```

当`exportFile`导出文件的内容如下时:

```typescript
export { map } from "./utils";
export { get as myGet } from "./utils";
export { get, pick as myPick } from "./utils";
export { default } from "./utils";
export { default as Utils, filter } from "./utils";
export * as util from "./utils";
export * from "./utils";
export type { TUtils } from "./utils";
```

会在当前目录的上一级生成 exposese 文件夹，文件列表如下：
| 文件名 | 内容 |
| ------------- | --------------------------------- |
| map.ts |export { map as default } from "../fixtures/utils";|
| myGet.ts |export { get as default } from "../fixtures/utils";|
| get.ts |export { get as default } from "../fixtures/utils";|
| myPick.ts |export { pick as default } from "../fixtures/utils";|
| default.ts | export { default } from "../fixtures/utils"; |
| Utils.ts |export { default } from "../fixtures/utils"; |
| filter.ts |export { filter as default } from "../fixtures/utils";|
| util.ts |export \* as default from "../fixtures/utils"; |
| inde.json |{ "./map": "./exposes/map", "./myGet": "./exposes/myGet", "./get": "./exposes/get", "./myPick": "./exposes/myPick", "./default": "./exposes/default", "./Utils": "./exposes/Utils", "./filter": "./exposes/filter","./util": "./exposes/util"}|

## 配置

| 字段名      | 类型                            | 是否必填 | 默认值 | 描述               |
| ----------- | ------------------------------- | -------- | ------ | ------------------ |
| exportFile  | string                          | 是       |        | 导出组件的入口文件 |
| generateDir | string                          | 是       |        | 生成的文件目录     |
| filetype    | `ts` \| `js`                    | 否       | `ts`   | 生成的文件类型     |
| transform   | (libraryName: string) => string | 否       |        | 转换引入的包名称   |
