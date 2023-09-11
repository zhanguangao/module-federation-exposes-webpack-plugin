import path from "path";
import { generateExposes } from "../../src/generateExposes";

generateExposes({
  exportFile: path.resolve(__dirname, "index.ts"),
  generateDir: path.resolve(__dirname, "../exposes"),
  transform: (libraryName: string) => {
    return libraryName.replace("./", "../fixtures/");
  },
});
