const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                node: true,
                require: "readonly",
                process: "readonly",
                module: "readonly",
                exports: "writable",
                __dirname: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                fetch: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
