import * as path from "path";
import * as fs from "fs";
import * as ts from "typescript";

/**
 * Given a file, return the list of files it imports as absolute paths.
 */
export function getImportsForFile(file: string, srcRoot: string) {
  // Follow symlink so directory check works.
  file = fs.realpathSync(file);

  if (fs.lstatSync(file).isDirectory()) {
    const index = path.join(file, "index.ts");
    if (fs.existsSync(index)) {
      // https://basarat.gitbooks.io/typescript/docs/tips/barrel.html
      console.warn(`Warning: Barrel import: ${path.relative(srcRoot, file)}`);
      file = index;
    } else {
      console.warn(
        `Warning: Importing a directory without an index.ts file: ${path.relative(
          srcRoot,
          file,
        )}`,
      );
      return [];
    }
  }

  const fileInfo = ts.preProcessFile(fs.readFileSync(file).toString());
  return (
    fileInfo.importedFiles
      .map((importedFile) => importedFile.fileName)
      // remove svg, css imports
      .filter(
        (fileName) =>
          !fileName.endsWith(".css") &&
          !fileName.endsWith(".svg") &&
          !fileName.endsWith(".json") &&
          !fileName.endsWith(".scss") &&
          !fileName.endsWith(".yaml") &&
          !fileName.endsWith(".png") &&
          !fileName.endsWith("loadAsComponent") &&
          !fileName.endsWith("loadAsUrl") &&
          !fileName.endsWith("loadAsText"),
      )
      // Assume .js/.jsx imports have a .d.ts available
      .filter(
        (fileName) => !fileName.endsWith(".js") && !fileName.endsWith(".jsx"),
      )
      // remove node modules (the import must contain '/')
      .filter((x) => /\//.test(x))
      // remove additional node modules not caught above
      .filter(
        (fileName) =>
          !fileName.startsWith("@reduxjs/") &&
          !fileName.startsWith("@testing-library/") &&
          !fileName.startsWith("@fortawesome/") &&
          !fileName.startsWith("@rjsf/") &&
          !fileName.startsWith("immer") &&
          !fileName.startsWith("react-") &&
          !fileName.startsWith("css-selector") &&
          !fileName.startsWith("@/vendors") &&
          !fileName.startsWith("@cfworker") &&
          !fileName.startsWith("idb/") &&
          !fileName.startsWith("@apidevtools/") &&
          !fileName.startsWith("redux-") &&
          !fileName.startsWith("primereact/") &&
          !fileName.startsWith("@atlaskit/") &&
          !fileName.startsWith("type-fest") &&
          !fileName.startsWith("formik/") &&
          !fileName.startsWith("intro.js") &&
          !fileName.startsWith("use-sync-external-store") &&
          !fileName.startsWith("@xobotyi/") &&
          !fileName.startsWith("@mozilla") &&
          !fileName.startsWith("@popperjs") &&
          !fileName.startsWith("@floating-ui") &&
          !fileName.startsWith("regenerator-runtime") &&
          !fileName.startsWith("@uipath") &&
          !fileName.startsWith("@datadog") &&
          !fileName.startsWith("cooky-cutter/") &&
          !fileName.startsWith("fake-indexeddb") &&
          !fileName.startsWith("iframe-resizer") &&
          !fileName.startsWith("webextension-polyfill") &&
          !fileName.startsWith("ace-builds") &&
          !fileName.startsWith("@vespaiach/") &&
          !fileName.startsWith("@pixiebrix/") &&
          !fileName.startsWith("@storybook/") &&
          !fileName.startsWith("@sinonjs/") &&
          !fileName.startsWith("@shopify/"),
      )
      .map((fileName) => {
        // join relative imports
        if (/(^\.\/)|(^\.\.\/)/.test(fileName)) {
          return path.join(path.dirname(file), fileName);
        }
        // handle absolute imports
        return path.join(srcRoot, fileName);
      })
      .map((fileName) => {
        if (fileName.includes("/@/")) {
          fileName = fileName.replace("/@/", "/");
        }
        if (fs.existsSync(`${fileName}.ts`)) {
          return `${fileName}.ts`;
        }
        if (fs.existsSync(`${fileName}.tsx`)) {
          return `${fileName}.tsx`;
        }
        if (fs.existsSync(`${fileName}.d.ts`)) {
          return `${fileName}.d.ts`;
        }
        if (fs.existsSync(`${fileName}`)) {
          return fileName;
        }

        console.warn(
          `Warning: Unresolved import ${path.relative(srcRoot, fileName)} ` +
            `in ${path.relative(srcRoot, file)}`,
        );
        return null;
      })
      .filter((fileName) => !!fileName)
  );
}

/**
 * This class memoizes the list of imports for each file.
 */
export class ImportTracker {
  private imports = new Map<string, string[]>();

  constructor(private srcRoot: string) {}

  public getImports(file: string): string[] {
    if (this.imports.has(file)) {
      return this.imports.get(file);
    }
    const imports = getImportsForFile(file, this.srcRoot + "/");
    this.imports.set(file, imports);
    return imports;
  }
}
