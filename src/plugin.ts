import * as Serverless from "serverless";

const LOG_PREFIX = "[selective-functions]";

interface ServerlessPluginCommand {
  commands?: Record<string, ServerlessPluginCommand>;
  lifecycleEvents?: string[];
  options?: Record<
    string,
    {
      default?: any;
      required?: boolean;
      shortcut?: string;
      usage?: string;
    }
  >;
  usage?: string;
}

type FunctionWithStages = Serverless.FunctionDefinition & {
  stages?: { include?: string[]; exclude?: string[] };
};

export default class ServerlessSelectiveFunctions {
  public readonly serverless: Serverless;

  public readonly commands: Record<string, ServerlessPluginCommand>;

  public readonly hooks: Record<string, () => any | Promise<any>>;

  private info: (..._: unknown[]) => void;

  private error: (..._: unknown[]) => void;

  public constructor(serverless: Serverless) {
    this.serverless = serverless;
    this.commands = {};
    this.hooks = {
      "before:package:initialize": this.filterFunctions,
      "before:offline:start:init": this.filterFunctions,
    };

    this.info = (...args: unknown[]) =>
      serverless.cli.log([LOG_PREFIX, "[INFO]", ...args].join(" "));
    this.error = (...args: unknown[]) =>
      serverless.cli.log([LOG_PREFIX, "[ERROR]", ...args].join(" "));
  }

  /**
   * Finds and deletes functions if they do not match the current stage
   */
  private filterFunctions = () => {
    const functions = this.serverless.service.getAllFunctions();
    if (functions.length <= 0) {
      this.error(`No functions were found`);
      return;
    } else {
      this.info(`Found ${functions.length} functions`);
    }

    const { stage } = this.serverless.service.provider;
    this.info(`Selecting functions for stage: "${stage}"`);

    const selectedFunctions: {
      [functionName: string]: FunctionWithStages;
    } = {};
    functions.forEach((functionName) => {
      const functionProps = this.serverless.service.getFunction(
        functionName
      ) as FunctionWithStages;
      if (
        ServerlessSelectiveFunctions.shouldFunctionBeSelected(
          stage,
          functionProps.stages?.include,
          functionProps.stages?.exclude
        )
      ) {
        this.info(`Selected: ${functionName}`);
        selectedFunctions[functionName] = functionProps;
      }
    });

    (this.serverless.service as any).functions = selectedFunctions;
    const numSelectedFunctions = Object.keys(selectedFunctions).length;
    if (numSelectedFunctions > 0) {
      this.info(
        `Selection complete, ${numSelectedFunctions} function${
          numSelectedFunctions > 1 ? "s" : ""
        } added`
      );
    } else {
      // TODO (enhancement): Config to specify if this should throw an error
      this.info(`Selection complete, no functions added`);
    }
  };

  /**
   * Given a stage, determine if matches the included and excluded stages.
   * Each included/excluded stage can be a regex.
   * Matches are case insensitive.
   *
   * Note that the stages will be matched exactly, for example:
   * - `pr247` will match `pr[0-9]*`
   * - `pr247` will not match `pr`
   *
   * @param stage
   * @param includedStages
   * @param excludedStages
   */
  static shouldFunctionBeSelected = (
    stage: string,
    includedStages: string[] | undefined,
    excludedStages: string[] | undefined
  ) => {
    let isSelected = true; // Default to automatically selected

    if (
      (includedStages ?? []).length === 0 &&
      (excludedStages ?? []).length === 0
    ) {
      return isSelected;
    }

    // TODO (enhancement): Inclusion list config that will include all functions
    // e.g. offline stage will deploy all functions

    // First pass included stages
    if (includedStages && includedStages.length > 0) {
      isSelected = includedStages.some((includedStage) =>
        ServerlessSelectiveFunctions.matchExact(includedStage, stage)
      );
    }

    // Second pass excluded stages
    if (excludedStages && excludedStages.length > 0) {
      isSelected = !excludedStages.some((excludedStage) =>
        ServerlessSelectiveFunctions.matchExact(excludedStage, stage)
      );
    }

    return isSelected;
  };

  /**
   * Matches exact, case insensitive
   * @param regex
   * @param str
   */
  static matchExact(regex: string, str: string) {
    const match = str.toLowerCase().match(regex.toLowerCase());
    return match && str === match[0];
  }
}
