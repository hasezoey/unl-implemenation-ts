import * as logger from "loglevel";
import "source-map-support/register";
import { generate } from "./generate";
import { parser } from "./parser";
import { tokenizer } from "./tokenizer";
import { transform } from "./transformer";

export { logger };
export { tokenizer, transform, generate, parser };

export async function compile(filename: string): Promise<string> {
	const rawInput = await parser(filename);
	const tokens = await tokenizer(rawInput);
	console.log("Final Tokens:", tokens);
	const transformed = await transform(tokens);
	const output = await generate(transformed);

	return output;

	// return await generate(
	// 	await transform(
	// 		await tokenizer(
	// 			await parser(filename)
	// 		)
	// 	)
	// );
}
