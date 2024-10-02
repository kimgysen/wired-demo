import * as esbuild from "esbuild";


export async function transpileToEsModule(code): Promise<string> {
	const result = await esbuild.transform(code, {
		loader: 'js',
		format: 'esm',
	});

	return result.code;
}
