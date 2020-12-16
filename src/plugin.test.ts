import ServerlessSelectiveFunctions from "./plugin";

describe("ServerlessSelectiveFunctions", () => {
  describe("shouldFunctionBeSelected", () => {
    describe("when stage should be included", () => {
      it.each([
        ["offline", undefined, undefined],
        ["offline", [], undefined],
        ["offline", undefined, []],
        ["offline", [], []],
        ["offline", [".*"], undefined],
        ["offline", [".*"], []],
        ["offline", ["off.*"], []],
        ["offline", ["off.+ne"], []],
        ["offline", ["off.+ne", "staging"], []],
        ["offline", ["offline", "staging"], []],
        ["offline", ["OFFLINE"], []],
        ["offline", ["OFFline"], []],
        ["offline", [], ["off"]],
        ["offline", [], ["OFF"]],
        ["offline", [], ["asd"]],
        ["offline", [], ["asd", "off"]],
        ["offline", [], ["a*"]],
        ["pr247", ["pr[0-9]*"], []],
        ["pr247", ["pr[0-9]*"], ["pr"]],
        ["prod-2", ["prod-2"], ["prod"]],
      ])(
        "should return true when stage: %s, includedStages: %s, excludedStages: %s",
        (stage, includedStages, excludedStages) => {
          expect(
            ServerlessSelectiveFunctions.shouldFunctionBeSelected(
              stage,
              includedStages,
              excludedStages
            )
          ).toBe(true);
        }
      );
    });

    describe("when stage should be excluded", () => {
      it.each([
        ["offline", [".*off", "prod"], undefined],
        ["offline", [".*off", "prod"], []],
        ["offline", [".*off"], []],
        ["offline", ["f{2}.*"], []],
        ["offline", [], [".*"]],
        ["offline", [], ["offline"]],
        ["offline", [], ["offLINE"]],
        ["offline", [], ["off.+ne"]],
        ["offline", [], ["off.+ne", "asd"]],
        ["offline", [], [".*f{2}.*"]],
        ["offline", ["offline"], ["offline"]],
        ["offline", [".*"], ["offline"]],
        ["offline", [".*"], [".*"]],
        ["pr247", [], ["pr2[0-9]*"]],
        ["pr247", ["pr[0-9]*"], ["pr247"]],
        ["pr247", ["pr[0-9]*"], ["pr.*"]],
      ])(
        "should return false when stage: %s, includedStages: %s, excludedStages: %s",
        (stage, includedStages, excludedStages) => {
          expect(
            ServerlessSelectiveFunctions.shouldFunctionBeSelected(
              stage,
              includedStages,
              excludedStages
            )
          ).toBe(false);
        }
      );
    });
  });
});
