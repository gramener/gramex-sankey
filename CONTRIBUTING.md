# Setup

To run this project locally:

- Clone this repo, and run `npm install` to install dependencies
- Run `npm run watch` to start auto-compiling [`sankey.js`](sankey.js)
- Open [`index.html`](index.html) using a HTTP server (e.g. `python -m http.server`)
- Edit [`sankey.js`](sankey.js) to make changes

# Release

```shell
npm version minor
npm publish
git push --follow-tags
```
