module.exports = {
	root: true,
	parser: "vue-eslint-parser",
	parserOptions: {
		ecmaVersion: "latest",
		parser: "@typescript-eslint/parser",
		sourceType: "module",
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:vue/vue3-recommended",
		"plugin:prettier/recommended",
		"plugin:vue/base",
	],
	plugins: ["prettier", "@typescript-eslint"],
	rules: {
		"no-console": "off",
		"no-debugger": "off",
		"vue/multi-word-component-names": "off",
		"no-case-declarations": "off",
	},
};
