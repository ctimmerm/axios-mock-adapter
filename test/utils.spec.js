var expect = require("chai").expect;
var find = require("../src/utils").find;
var isEqual = require("../src/utils").isEqual;
var isObjectOrArray = require("../src/utils").isObjectOrArray;
var isBlob = require("../src/utils").isBlob;
var isBodyOrParametersMatching = require("../src/utils").isBodyOrParametersMatching;

describe("utility functions", function () {
  context("find", function () {
    it("returns the value for which the predicate holds true", function () {
      var array = [1, 2, 3];
      var value = find(array, function (value) {
        return value === 2;
      });
      expect(value[0]).to.equal(2);
    });

    it("returns the first value for which the predicate holds true", function () {
      var array = [
        { key: 1, value: "one" },
        { key: 1, value: "two" },
      ];
      var value = find(array, function (value) {
        return value.key === 1;
      });
      expect(value[0].value).to.equal("one");
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

  context("isObjectOrArray", function () {
    it("returns true for plain objects", function () {
      expect(isObjectOrArray({ foo: "bar" })).to.be.true;
    });

    it("returns true for arrays", function () {
      expect(isObjectOrArray([1, 2, 3])).to.be.true;
    });

    it("returns false for anything that is not an object or array", function () {
      expect(isObjectOrArray(true)).to.be.false;
      expect(isObjectOrArray(false)).to.be.false;
      expect(isObjectOrArray(null)).to.be.false;
      expect(isObjectOrArray(undefined)).to.be.false;
      expect(isObjectOrArray(function () {})).to.be.false;
      expect(isObjectOrArray(0)).to.be.false;
      expect(isObjectOrArray(1)).to.be.false;
      expect(isObjectOrArray("")).to.be.false;
      expect(isObjectOrArray(" ")).to.be.false;
      expect(isObjectOrArray("1")).to.be.false;
    });
  });

  context("isBlob", function () {
    it("returns false for anything that is not a Blob", function () {
      expect(isBlob(true)).to.be.false;
      expect(isBlob(false)).to.be.false;
      expect(isBlob(null)).to.be.false;
      expect(isBlob(undefined)).to.be.false;
      expect(isBlob(function () {})).to.be.false;
      expect(isBlob(0)).to.be.false;
      expect(isBlob(1)).to.be.false;
      expect(isBlob("")).to.be.false;
      expect(isBlob(" ")).to.be.false;
      expect(isBlob("1")).to.be.false;
      expect(isBlob({ foo: "bar" })).to.be.false;
      expect(isBlob([1, 2, 3])).to.be.false;
    });
  });

  context("isBodyOrParametersMatching", function() {
    it('delete has params only', function () {
      expect(isBodyOrParametersMatching('delete', null, { 'a': 2 }, { 'params': { 'a': 2 } } )).to.be.true;
      expect(isBodyOrParametersMatching('delete', null, { 'a': 2 }, { 'params': { 'b': 2 } } )).to.be.false;
    });
    it('delete has data only', function () {
      expect(isBodyOrParametersMatching('delete', { 'x': 1 }, null, { 'data': { 'x': 1 } })).to.be.true;
      expect(isBodyOrParametersMatching('delete', { 'x': 1 }, null, { 'data': { 'y': 1 } })).to.be.false;
    });
    it('delete has body and params', function () {
      expect(isBodyOrParametersMatching('delete', { 'x': 1 }, { 'a': 2 }, { 'data': { 'x': 1 }, 'params': { 'a': 2 } })).to.be.true;
      expect(isBodyOrParametersMatching('delete', { 'x': 1 }, { 'a': 2 }, { 'data': { 'x': 1 }, 'params': { 'b': 2 } })).to.be.false;
      expect(isBodyOrParametersMatching('delete', { 'x': 1 }, { 'a': 2 }, { 'data': { 'y': 1 }, 'params': { 'a': 2 } })).to.be.false;
    });
  });
});
