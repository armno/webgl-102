# webgl-102

Learning WebGL with [WebGL Tutorials by Indigo Code](https://www.youtube.com/watch?v=kB0ZVUrI4Aw&list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt) on Youtube.

Here are my notes during learning.

## Step 0: Set up Project

Unlike in the tutorial, I prefer using TypeScript over JavaScript.
I'm using webpack with `awesome-typescript-loader` to transpile TypeScript
and using `webpack-dev-server` as a local dev server.

I will keep TS source files in `./src` folder, and use `./dist` folder for output files.

Start by install dev-dependencies.

```sh
$ npm install --save-dev \
		typescript \
		awesome-typescript-loader \
		source-map-loader \
		webpack \
		webpack-cli \
		webpack-dev-server
```

Then create `webpack.config.js` file.

```js
const path = require('path');

module.exports = {
	mode: 'development',
	entry: './src/main.ts',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist')
	},
	devServer: {
		contentBase: './src'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader'
			}
		]
	}
};
```

- `devServer.contentBase` - tell webpack-dev-server to serve files from this directory
- `resolve.extensions` - add `.js`, `.jsx` extensions as they are required to load 3rd party modules
- `loader` - use `awesome-typescript-loader` for `.ts` files

Next is to create `tsconfig.json`

```json
{
	"compilerOptions": {
		"allowJs": true,
		"target": "es5",
		"noImplicitAny": true
	}
}
```

Finally, prepare `./src/index.html` with a reference to `main.js` file which does not exist yet,
but webpack-dev-server will take care of it.

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>WebGL 102</title>
</head>
<body>
	<script src="main.js"></script>
</body>
</html>
```

Run dev server via `npx`

```
$ npx webpack-dev-server --open
```

The dev URL is at `http://localhost:8080/`.

---
