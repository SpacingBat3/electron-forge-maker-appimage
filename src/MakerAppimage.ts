import MakerBase, { MakerOptions } from "@electron-forge/maker-base";
import {
  ForgePlatform,
  IForgeResolvableMaker,
  IForgeMaker
} from "@electron-forge/shared-types";
import path from "path";
import * as appBuilder from "app-builder-lib/out/util/appBuilder";
import { MakerAppImageConfig, MakerAppImageConfigOptions } from "./Config";
import { mkdirSync, existsSync, rmdirSync } from "fs";
import { exec } from "child_process";

const makerPackageName = "electron-forge-maker-appimage";

const isIForgeResolvableMaker = (
  maker: IForgeResolvableMaker | IForgeMaker
): maker is IForgeResolvableMaker => {
  return maker.hasOwnProperty("name");
};

function isDefinied(value:undefined|string, alternative:string): string {
  let returnString: string;
  if(value !== undefined) {
      returnString = value;
    } else {
      returnString = alternative;
    }
    return returnString;
}

export default class MakerAppImage extends MakerBase<MakerAppImageConfig> {
  name = "AppImage"; // "appImage" really annoyed me ;)

  defaultPlatforms: ForgePlatform[] = ["linux"];

  isSupportedOnCurrentPlatform() {
    return process.platform === "linux";
  }

  async make({
    dir, // eg. '/home/build/Software/monorepo/packages/electron/out/name-linux-x64'
    appName, // eg. 'name'
    makeDir, // eg. '/home/build/Software/monorepo/packages/electron/out/make',
    targetArch, // eg. 'x64'
    packageJSON,
    targetPlatform, // == 'linux'
    forgeConfig
  }: MakerOptions) {
    const executableName = forgeConfig.packagerConfig.executableName || appName;
    // Check for any optional configuration data passed in from forge config, specific to this maker.
    let config: MakerAppImageConfig | undefined;
    const maker = forgeConfig.makers.find(
      maker => isIForgeResolvableMaker(maker) && maker.name === makerPackageName
    );

    let desktopName:string = appName;
    let binName:string = executableName;
    let genericName:string = appName;
    let desktopCategories:string = "Utility";
    let imageVersion:string = packageJSON.version;
    let compression:string = "xz";
    let options:MakerAppImageConfigOptions|undefined = undefined;

    if (maker !== undefined && isIForgeResolvableMaker(maker)) {
      config = maker.config;
    }
    if (config !== undefined && config.options !== undefined) {
      options = config.options;
      if (config.options.bin !== undefined) {
        binName = config.options.bin;
      }
      if (config.options.categories !== undefined) {
        desktopCategories = config.options.categories.join(";");
      }
      if (config.options.version !== undefined) {
        imageVersion = config.options.version;
      }
      if (config.options.compression !== undefined) {
        compression = config.options.compression;
      }
      if (config.options.name !== undefined) {
        desktopName = config.options.name;
        genericName = config.options.name;
      }
    }

    const outDir = path.join(makeDir, "AppImage", targetArch)
    const appFileName = `${packageJSON.name}-${packageJSON.version}-${targetArch}.AppImage`;
    const appPath = path.join(outDir, appFileName);

    // construct the desktop file.
    const desktopMeta: { [parameter: string]: string } = {
      Name: desktopName,
      GenericName: genericName,
      Exec: binName,
      Terminal: "false",
      Type: "Application",
      Icon: executableName,
      StartupWMClass: packageJSON.productName as string,
      "X-AppImage-Version": imageVersion,
      Comment: packageJSON.description,
      Categories: desktopCategories
    };

    let desktopEntry = `[Desktop Entry]`;
    for (const name of Object.keys(desktopMeta)) {
      desktopEntry += `\n${name}=${desktopMeta[name]}`;
    }
    desktopEntry += "\n";

    /* 
     * This/these icon/-s will be visible with AppImage thumbnailer
     * installed (at least that's the case for Gnome/XFCE4).
     */
    interface iconType {
      [index: number]: { file: string; size: number };
    }
    let icons: iconType;
    if (options !== undefined && options.icon !== undefined) {
      const iconPath = path.join(
        dir,
        "../.."
      );
      icons = [
        { file: `${iconPath}/${options.icon}`, size: 0 }
      ];
    } else {
      // default Electron icons when "config.icon" isn't definied:
      const iconPath = path.join(
        dir,
        "../..",
        "node_modules/app-builder-lib/templates/icons/electron-linux"
      );
      icons = [
        { file: `${iconPath}/16x16.png`, size: 16 },
        { file: `${iconPath}/32x32.png`, size: 32 },
        { file: `${iconPath}/48x48.png`, size: 48 },
        { file: `${iconPath}/64x64.png`, size: 64 },
        { file: `${iconPath}/128x128.png`, size: 128 },
        { file: `${iconPath}/256x256.png`, size: 256 }
      ];
    }
    const iconFiles = icons;

    const stageDir = path.join(makeDir, `.temp-AppImage-${targetArch}`);
    
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    if (existsSync(stageDir)) {
      rmdirSync(stageDir, { recursive: true });
    }
    mkdirSync(stageDir, { recursive: true });

    // if the user passed us a chmodChromeSandbox parameter, use that to modify the permissions of chrome-sandbox.
    // this sets up the ability to run the application conditionally with --no-sandbox on select systems.
    if(config !== undefined && config.chmodChromeSandbox !== undefined) {
      await exec(`chmod ${config.chmodChromeSandbox} ${path.join(dir, 'chrome-sandbox')}`);
    }

    const args = [
      "appimage",
      "--stage",
      stageDir,
      "--arch",
      targetArch,
      "--output",
      appPath,
      "--app",
      dir,
      "--compression",
      "xz",
      "--configuration",
      JSON.stringify({
        productName: appName,
        productFilename: appName,
        desktopEntry: desktopEntry,
        executableName: executableName,
        icons: iconFiles,
        fileAssociations: []
      })
    ];

    // the --template option allows us to replace AppRun bash script with a custom version, e.g. a libstdc++ bootstrapper.
    if (config !== undefined && config.template) {
      args.push("--template");
      args.push(config.template);
    }

    const result = await appBuilder.executeAppBuilderAsJson(args);

    return [appPath];
  }
}
