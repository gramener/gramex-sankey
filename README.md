# @gramex/sankey

A Sankey (or flow) diagram for graph visualization.

## Example

Given this [table of sales](docs/sales.json ":ignore"):

[![Sales dataset screenshot](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/sales-data.webp)](docs/sales.json ":ignore")

... we can render the following Sankey diagram:

[![Sales Sankey diagram](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/sales.webp)](docs/sales.html ":include")

[Here is the source code for the network above](docs/sales.html ":include :type=code")

## Installation

Install via `npm`:

```bash
npm install @gramex/sankey@1
```

Use locally as an ES module:

```html
<script type="module">
  import { sankey } from "./node_modules/@gramex/sankey/dist/sankey.js";
</script>
```

Use locally as a script:

```html
<script src="./node_modules/@gramex/sankey/dist/sankey.min.js"></script>
<script>
  gramex.sankey(...)
</script>
```

Use via CDN as an ES Module:

```html
<script type="module">
  import { sankey } from "https://cdn.jsdelivr.net/npm/@gramex/sankey@1";
</script>
```

Use via CDN as a script:

```html
<script src="https://cdn.jsdelivr.net/npm/@gramex/sankey@1/dist/sankey.min.js"></script>
<script>
  gramex.sankey(...)
</script>
```


## API

[See API documentation](docs/api.md ":include :type=markdown")

## Release notes

- 1.1.0: 28 Oct 2024.
  - Clicking a node first shows all nodes if any are missing. (Earlier it would HIDE if any were present.)
- 1.0.0: 28 Oct 2024. Initial release

## Authors

- Anand S <s.anand@gramener.com>

## License

[MIT](https://spdx.org/licenses/MIT.html)
