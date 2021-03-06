import { astParser } from "../src/astParser";
import { ArrayExpressionNode, BooleanNode, DeclarationNode, MapExpressionNode, MapSubNode, NumberNode, RootNode, StringNode, VariableNode } from "../src/constants/astTypes";
import { ASTParserError } from "../src/constants/errors";
import { KeyWords } from "../src/constants/keywords";
import { Token, TokenTypes } from "../src/constants/tokens";

describe("AST Parser", () => {
	describe("Expressions", () => {
		it("EMPTY", () => {
			// EMPTY
		});
	});

	describe("mapping declaration", () => {
		it("should map const statements (const)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "const"),
				new Token(TokenTypes.Name, "key"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.String, "Hello String"),
				new Token(TokenTypes.EOF, "")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new DeclarationNode(KeyWords.Const, [
					new VariableNode("key", new StringNode("Hello String"))
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map const statements (let)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "let"),
				new Token(TokenTypes.Name, "key"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.String, "Hello String"),
				new Token(TokenTypes.EOF, "")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new DeclarationNode(KeyWords.Let, [
					new VariableNode("key", new StringNode("Hello String"))
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map const multiple statements (const)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "const"),
				new Token(TokenTypes.Name, "key"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.String, "Hello String"),
				new Token(TokenTypes.Seperator, ","),
				new Token(TokenTypes.Name, "key1"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.String, "Hello String1")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new DeclarationNode(KeyWords.Const, [
					new VariableNode("key", new StringNode("Hello String")),
					new VariableNode("key1", new StringNode("Hello String1"))
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map const statement with EOL (const)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "const"),
				new Token(TokenTypes.Name, "key"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.String, "Hello String"),
				new Token(TokenTypes.EOL, ""),
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new DeclarationNode(KeyWords.Const, [
					new VariableNode("key", new StringNode("Hello String"))
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});
	});

	describe("mapping arrays", () => {
		it("should map array statements (without array)", () => {
			const tokens = [
				new Token(TokenTypes.Enclosure, "["),
				new Token(TokenTypes.Number, "1"),
				new Token(TokenTypes.Seperator, ","),
				new Token(TokenTypes.Number, "2"),
				new Token(TokenTypes.Enclosure, "]")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new ArrayExpressionNode([
					new NumberNode("1"),
					new NumberNode("2")
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map array statements (with array)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "array"),
				new Token(TokenTypes.Enclosure, "["),
				new Token(TokenTypes.Number, "1"),
				new Token(TokenTypes.Seperator, ","),
				new Token(TokenTypes.Number, "2"),
				new Token(TokenTypes.Enclosure, "]")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new ArrayExpressionNode([
					new NumberNode("1"),
					new NumberNode("2")
				])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map array statements (empty)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "array"),
				new Token(TokenTypes.Enclosure, "["),
				new Token(TokenTypes.Enclosure, "]")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new ArrayExpressionNode([])
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});
	});

	describe("mapping maps", () => {
		it("should map map statements", () => {
			const tokens = [
				new Token(TokenTypes.Name, "map"),
				new Token(TokenTypes.Enclosure, "["),
				new Token(TokenTypes.String, "key"),
				new Token(TokenTypes.Operator, "="),
				new Token(TokenTypes.Operator, ">"),
				new Token(TokenTypes.String, "Hello String"),
				new Token(TokenTypes.Enclosure, "]")
			];

			const expected = new RootNode([
				new MapExpressionNode([
					new MapSubNode("key", new StringNode("Hello String"))
				])
			]);

			const ast = astParser(tokens);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map map statements (empty)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "map"),
				new Token(TokenTypes.Enclosure, "["),
				new Token(TokenTypes.Enclosure, "]")
			];

			const expected = new RootNode([
				new MapExpressionNode([])
			]);

			const ast = astParser(tokens);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});
	});

	describe("mapping booleans", () => {
		it("should map boolean statements (true)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "true")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new BooleanNode("true")
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});

		it("should map boolean statements (false)", () => {
			const tokens = [
				new Token(TokenTypes.Name, "false")
			];

			const ast = astParser(tokens);

			const expected = new RootNode([
				new BooleanNode("false")
			]);

			expect(ast).toBeObject();
			expect(ast).toStrictEqual(expected);
		});
	});
});

describe("AST Parser Error", () => {
	describe("declarations", () => {
		it("should fail when no key is given for declarations", () => {
			const tokens = [
				new Token(TokenTypes.Name, "const"),
				new Token(TokenTypes.Seperator, ";"),
				new Token(TokenTypes.EOF, "")
			];

			expect(astParser.bind(undefined, tokens)).toThrowWithMessage(ASTParserError, "Expected at least an name for variable declaration!");
		});
	});

	// Disabled because of https://github.com/facebook/jest/issues/7547
	it.skip("should error with EOF, if unexpected", () => {
		const tokens = [
			new Token(TokenTypes.Enclosure, "[")
		];

		expect(astParser.bind(undefined, tokens)).toThrowWithMessage(ASTParserError, "Unexpect EOF! (EndOfFile)");
	});
});
