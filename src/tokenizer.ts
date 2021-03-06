import { isNullOrUndefined } from "util";
import { logger } from ".";
import { TokenError } from "./constants/errors";
import { dot, hexNumber, namesUntilEnd, newLine } from "./constants/regex";
import { Blocks, Comments, MathOperators, Misc, Operators, Token, TokenTypes } from "./constants/tokens";
import { ICurrentToken } from "./types";
import { assert, incrementCurr } from "./utils";

/**
 * Convert input string to a Token Array
 * @param input Input of a file or REPL
 */
export function tokenizer(input: string): Token[] {
	assert(typeof input === "string", "Input must be a string!");
	assert(input.length > 0, "Input length must be higher than 0!");

	logger.info("Input string:", JSON.stringify(input));

	const curr: ICurrentToken = { // this is needed, because otherwise the functions would just take a copy of the primitive
		pos: 0,
		tokens: [],
		input
	};

	while (curr.pos <= input.length) {
		logger.debug("Loop Start, Current Position %d", curr.pos);
		const pre = curr.pos;

		const newToken = getNextToken(curr);
		if (!isNullOrUndefined(newToken)) {
			logger.info("Got Token \"%s\" with value \"%s\"", TokenTypes[newToken.type], newToken.value);
			curr.tokens.push(newToken);
		}
		logger.debug("Loop End, Current Position %d, Loop Start Position %d \n", curr.pos, pre);

		if (curr.pos === pre) {
			throw new TokenError("Previous Position is the same as Current Position!");
		}
	}

	return curr.tokens;
}

/**
 * The Function that gets executes in each loop
 * @param curr The Object with the ICurrent Context
 */
function getNextToken(curr: ICurrentToken): Token | undefined {
	const char = curr.input[curr.pos];
	logger.debug("getNextToken Current Character:", JSON.stringify(char));
	if (isNullOrUndefined(char)) {
		curr.pos++;

		return new Token(TokenTypes.EOF, "");
	}
	if (Misc.EndOfLine.identifier.test(char)) {
		curr.pos++;

		return new Token(TokenTypes.EOL, "");
	}
	if (Misc.Semicolon.identifier === char) {
		curr.pos++;

		return new Token(TokenTypes.Seperator, char);
	}

	switch (char) {
		case Blocks.OpenBrace.identifier:
		case Blocks.OpenBracket.identifier:
		case Blocks.OpenParentheses.identifier:
		case Blocks.CloseBrace.identifier:
		case Blocks.CloseBracket.identifier:
		case Blocks.CloseParentheses.identifier:
			curr.pos++;

			return new Token(TokenTypes.Enclosure, char);
	}

	// characters, names & numbers
	if (Misc.WhiteSpace.identifier.test(char)) {
		curr.pos++;

		return undefined;
	}
	if (Misc.String.identifier.test(char)) {
		return new Token(TokenTypes.String, getStringUntilEnd(curr));
	}
	if (Misc.Name.identifier.test(char)) {
		return new Token(TokenTypes.Name, getNameUntilEnd(curr));
	}
	if (Misc.Number.identifier.test(char)) {
		return new Token(TokenTypes.Number, getNumberUntilEnd(curr));
	}

	// Comments
	{
		const commentChar = char + curr.input[curr.pos + 1];
		logger.debug("Checking for Comments", JSON.stringify(commentChar));
		if (Comments.FullLineComment.identifier.test(commentChar)) {
			return new Token(TokenTypes.Comment, getFullLineComment(curr));
		}

		if (Comments.InLineCommentOpen.identifier.test(commentChar)) {
			return new Token(TokenTypes.Comment, getInlineComment(curr));
		}
	}

	// Operators
	switch (char) {
		case Operators.Equals.identifier:
		case Operators.ExclamationMark.identifier:
		case Operators.GreaterThan.identifier:
		case Operators.LowerThan.identifier:
		case Operators.VerticalLine.identifier:
		case Operators.Ampersand.identifier:
			curr.pos++;

			return new Token(TokenTypes.Operator, char);
	}

	// Math Operators
	switch (char) {
		case MathOperators.Plus.identifier:
		case MathOperators.Minus.identifier:
		case MathOperators.Multiply.identifier:
		case MathOperators.Devide.identifier:
		case MathOperators.Percent.identifier:
			curr.pos++;

			return new Token(TokenTypes.Operator, char);
	}

	if (Misc.Comma.identifier === char) {
		curr.pos++;

		return new Token(TokenTypes.Seperator, char);
	}

	throw new TokenError("Unkown Token Encountered:", JSON.stringify(char));
}

/**
 * Get the current Number until end
 * @param curr The Object with the ICurrent Context
 */
function getNumberUntilEnd(curr: ICurrentToken): string {
	/** The String that will get returned */
	let out = "";
	/** Current Char to work on */
	let char = curr.input[curr.pos];

	// test if the number is a hex number ("0xF")
	if (char === "0" && curr.input[curr.pos + 1] === "x") {
		out += "0x";
		curr.pos += 2;
		char = curr.input[curr.pos];

		// execute while "char" is a string AND while "char" matches a hex number
		while (typeof char === "string" && hexNumber.test(char)) {
			out += char;
			char = incrementCurr(curr);
		}

		return out;
	}

	/** Store if already in the decimal mode */
	let isDecimal = false;

	// execute while "char" is a string AND while "char" is a number
	while (typeof char === "string" && (Misc.Number.identifier.test(char) || dot.test(char))) {
		if (dot.test(char)) {
			if (isDecimal) throw new TokenError("\".\" was unexpected to be seen again!");
			isDecimal = true;
		}
		out += char; // append current char to out
		char = incrementCurr(curr);
	}

	return out;
}

/**
 * Get the current Full-Line-Comment
 * @param curr The Object with the ICurrent Context
 */
function getFullLineComment(curr: ICurrentToken): string {
	curr.pos += 2; // increment by 2, to remove the "//"

	/** The String that will get returned */
	let out = "";
	/** Current Char to work on */
	let char = curr.input[curr.pos];

	// execute while "char" is a string AND while "char" is NOT a newline
	while (typeof char === "string" && !newLine.test(char)) {
		out += char; // append current char to out
		char = incrementCurr(curr);
	}
	// Do NOT increment if there is a new line - for the new-line token

	return out;
}

/**
 * Get the current In-Line-Comment
 * @param curr The Object with the ICurrent Context
 */
function getInlineComment(curr: ICurrentToken): string {
	curr.pos += 2; // increment by 2, to remove "/*"

	/** The String that will get returned */
	let out = "";
	/** Current Char to work on */
	let char = curr.input[curr.pos];
	let preChar = "";

	// execute while "char" is a string AND while it is NOT an Inline Comment Close
	while (typeof char === "string" && !Comments.InlineCommentClose.identifier.test(preChar + char)) {
		out += char; // append current char to out
		curr.pos++; // increment current Position

		preChar = char;
		char = curr.input[curr.pos]; // set new char
	}

	// this is protection against EOF
	if (Comments.InlineCommentClose.identifier.test(preChar + char)) {
		curr.pos++; // increment to move past "/" of "*/"
		out = out.replace(/\*$/i, ""); // remove the "*" of "*/" - it is there, because in that run, the regexp didnt fire
	}

	return out;
}

/**
 * Search until next the current name ends (like a whitespace, or operator)
 * @param curr The Object with the ICurrent Context
 */
function getNameUntilEnd(curr: ICurrentToken): string {
	/** The String that will get returned */
	let out = "";
	/** Current Char to work on */
	let char = curr.input[curr.pos];

	// execute while "char" is not a whitespace AND is not a newline / semicolon AND while "char" is a string
	while (typeof char === "string" && namesUntilEnd.test(char)) {
		out += char; // append current char to out
		char = incrementCurr(curr);
	}
	logger.debug("GNUE \"%s\"", out);

	return out;
}

/**
 * Search until the closing of the current string
 * @param curr The Object with the ICurrent Context
 */
function getStringUntilEnd(curr: ICurrentToken): string {
	/** The String that will get returned */
	let out = "";
	/** Current Char to work on */
	let char = curr.input[curr.pos];
	const stringEndTest = Misc.String.variants.find((v) => v.test(char));
	assert(!isNullOrUndefined(stringEndTest), "Expected \"charToTest\" to be defined");

	if ( // Test if it is a multiline string
		stringEndTest.test(char)
		&& stringEndTest.test(curr.input[curr.pos + 1])
		&& stringEndTest.test(curr.input[curr.pos + 2])
	) {
		return getMultiLineStringUntilEnd(curr, stringEndTest);
	}

	curr.pos++; // increment initally to skip the inital quotation mark
	char = curr.input[curr.pos]; // set the current char to the increment above

	// execute while "char" is not a whitespace AND is not a newline / semicolon AND while "char" is a string
	while (typeof char === "string" && !(stringEndTest.test(char) || newLine.test(char))) {
		out += char; // append current char to out
		char = incrementCurr(curr);
	}
	logger.debug("GSUE", out);

	if (!stringEndTest.test(char)) {
		throw new TokenError("Expected String to end before a EOL / EOF!");
	}

	curr.pos++; // increment current position again to skip the end char of the string

	return out;
}

/**
 * Get Full Multiline string
 * @param curr The Object with the ICurrent Context
 * @param testFor The RegExp to know when the string ends
 */
function getMultiLineStringUntilEnd(curr: ICurrentToken, testFor: RegExp): string {
	logger.info("Encountered a Multiline String");
	curr.pos += 3; // skip the inital 3 testFor's (mostly: """)

	/** What to remove */
	const indent = getIndent(curr);

	/** Current Char to work on */
	let char = curr.input[curr.pos];
	/** The String that will get returned */
	let out = "";

	// execute while "char" is a string AND while NOT 3 of testFor is encountered (""")
	while (typeof char === "string" && !(
		testFor.test(char)
		&& testFor.test(curr.input[curr.pos + 1])
		&& testFor.test(curr.input[curr.pos + 2])
	)) {
		out += char; // append current char to out
		char = incrementCurr(curr);
	}

	out = out.replace(new RegExp(indent, "gmi"), ""); // replace all occurences of "indent" in "out"
	curr.pos += 3; // skip the ending 3 testFor's (mostly: """)

	// remove NewLine if there is any before the multiline string
	if (curr.tokens[curr.tokens.length - 1].type === TokenTypes.EOL) {
		curr.tokens.pop();
	}

	return out;
}

/**
 * Get Indentation for multiline String
 * @param curr The Object with the ICurrent Context
 */
function getIndent(curr: ICurrentToken): string {
	let pos = curr.pos - 4; // to remove the intial 3 again, and to move one back from the first String opening
	let indentChar = curr.input[pos]; // set inital current char for indent search

	// execute while "indentChar" is a string AND while "indentChar" is NOT a newline
	while (typeof indentChar === "string" && !newLine.test(indentChar)) {
		pos--; // decrement pos to get next char
		indentChar = curr.input[pos]; // set next char
	}

	const out = curr.input.slice(pos, curr.pos - 3);
	logger.debug("OUT", JSON.stringify(out));

	return out;
}
