"use strict";

module.exports = [
  {
    ignores: [
      "dist/"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs"
    },

    rules: {
      "brace-style": [2, "1tbs", { "allowSingleLine": false }],
      quotes: [
        2,
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true
        }
      ],
      "comma-dangle": [2, "only-multiline"],
      "curly": [2, "multi-line"],
      "eol-last": 2,
      "eqeqeq": 2,
      "key-spacing": [2, { "beforeColon": false, "afterColon": true }],
      "keyword-spacing": 2,
      "new-cap": 0,
      "no-native-reassign": 2,
      "no-extra-semi": 2,
      "no-multiple-empty-lines": [2, { "max": 1 }],
      // "no-param-reassign": [2, { "props": false }],
      "no-trailing-spaces": 2,
      "no-underscore-dangle": 0,
      "no-unused-vars": [
        2,
        {
          vars: "all",
          args: "none",
          caughtErrors: "all",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "object-curly-spacing": [2, "always"],
      "padded-blocks": [2, "never"],
      "semi": [2, "always"],
      "space-before-blocks": [2, "always"],
      "no-var": 2,
      "prefer-const": [
        2,
        {
          destructuring: "any",
          ignoreReadBeforeAssign: true
        }
      ],

      "prefer-promise-reject-errors": 2,
      "prefer-template": 2
    }
  }
];
