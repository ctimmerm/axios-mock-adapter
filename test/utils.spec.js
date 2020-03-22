var expect = require("chai").expect;
var find = require("../src/utils").find;
var isEqual = require("../src/utils").isEqual;

describe("utility functions", function () {
  context("find", function () {
    it("returns the value for which the predicate holds true", function () {
      var array = [1, 2, 3];
      var value = find(array, function (value) {
        return value === 2;
      });
      expect(value).to.equal(2);
    });

    it("returns the first value for which the predicate holds true", function () {
      var array = [
        { key: 1, value: "one" },
        { key: 1, value: "two" },
      ];
      var value = find(array, function (value) {
        return value.key === 1;
      });
      expect(value.value).to.equal("one");
    });

    it("returns undefined if the value is not found", function () {
      var array = [1, 2, 3];
      var value = find(array, function (value) {
        return value === 4;
      });
      expect(value).to.be.undefined;
    });
  });

  context("isEqual", function () {
    it("checks with strict equality", function () {
      var a = { foo: "5" };
      var b = { foo: 5 };
      expect(isEqual(a, b)).to.be.false;
    });
  });
});
