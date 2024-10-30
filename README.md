# @gramex/sankey

A Sankey (or flow) diagram for graph visualization.

## Example

Given this [table of sales](docs/sales.json ":ignore"):

[![Sales dataset screenshot](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/sales-data.webp)](docs/sales.json ":ignore")

... we can render the following clickable Sankey diagram:

[![Sales Sankey diagram](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/sales.webp)](docs/sales.html ":include height=320px")

[Here is the source code for the diagram above](docs/sales.html ":include :type=code")

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

## Use a DataFrame

The `sankey()` function accepts an array of objects, like this:

```json
[
  { "channel": "Online", "city": "Tokyo", "product": "Biscuit", "sales": 866.1, "prev": 1186.4 },
  { "channel": "Online", "city": "Tokyo", "product": "Cake", "sales": 26.4, "prev": 34.8 },
  { "channel": "Online", "city": "Tokyo", "product": "Cream", "sales": 38.3, "prev": 54.0 }
  // ...
]
```

Pick any _categorical_ columns and use them as categories, like this:

```js
const graph = sankey("#sankey", { data, categories: ["channel", "city", "product"], d3 });
```

You can modify the labels with a `categories` object, as `{ "label": "key" }`:

```js
const graph = sankey("#sankey", { data, categories: { Channel: "channel", City: "city", Product: "product" }, d3 });
```

The `categories` object can also have values as functions that return each box's label:

```js
const graph = sankey("#sankey", {
  data,
  categories: { Channel: (d) => d.channel, City: "city", Product: (d) => `${d.product} (${d.subProduct})` },
  d3,
});
```

[![Example](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/simple.webp)](docs/simple.html ":include height=320px")

[See how to use sankey()](docs/simple.html ":include :type=code")

## Style the graph

Sankey accepts the following inputs options:

- `labelWidth`: Width of the category labels on the left
- `gap`: Vertical gap between boxes as a % of the box height. 0.5 (default) means half the space is used by the gaps.
- `size`: Box width key or function. Defaults to `d => 1`, i.e. each row counts as 1. Use `"sales"` or `d => d.sales` to use a `sales` column as the box size.
- `text`: Box label key or function. Defaults to `"key"`. Use `d => d.key.toUpperCase()` to display the category key in uppercase.

The returned `graph` object has these D3 joins:

- `nodes`: The `<rect>` boxes across all rows. The joined data object has these keys:
  - `cat`: The category name. From keys of `categories`
  - `key`: The box label. The value in the category
  - `group`: Data rows for this box
  - `size`: Box size. Sum of the `size` accessor on `group`
  - `range`: Box X position as [start, end] with values between 0 and 1
  - `width`: Box width in pixels when rendered
- `links`: The `<path>` links connecting the boxes. The joined data object has these keys:
  - `source`: Source node object.
  - `target`: Target node object.
  - `group`: Data rows for this link, for this source AND target combination
  - `size`: Link size. Sum of the `size` accessor on `group`
  - `sourceRange`: Link top X position as [start, end] with values between 0 and 1
  - `targetRange`: Link bottom Xposition as [start, end] with values between 0 and 1
- `texts`: The `<text>` labels on top of the boxes
  - `text`: The text label
- `labels`: The `<text>` category names on the left
  - `label`: The category name
- `nodeData`: Array of node data (entries have the same values as the `nodes` join)
- `linkData`: Array of link data (entries have the same values as the `links` join)

You can apply the D3 [`.attr`](https://github.com/d3/d3-selection#selection_attr),
[`.classed`](https://github.com/d3/d3-selection#selection_classed),
[`.style`](https://github.com/d3/d3-selection#selection_style),
[`.text`](https://github.com/d3/d3-selection#selection_text),
and any other [selection methods](https://github.com/d3/d3-selection) to style the elements.

You can use any node/link keys in the styles. For example:

```js
const graph = sankey("#sankey", data, { categories: ["channel", "city", "product"] });
graph.nodes.attr("fill", d3.scaleOrdinal(d3.schemeCategory10));
graph.links.attr("fill", "rgba(0,0,0,0.2)");
```

The generated SVG has the following structure:

```html
<svg>
  <g class="labels">
    <text class="label"></text>
  </g>
  <g class="links">
    <path class="link"></path>
    <path class="link"></path>
  </g>
  <g class="nodes">
    <rect class="node"></rect>
    <rect class="node"></rect>
    <text class="text"></text>
    <text class="text"></text>
  </g>
</svg>
```

[![Example](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/style.webp)](docs/style.html ":include height=320px")

[See how to style nodes and links](docs/style.html ":include :type=code")

## Add tooltips

You can use [Bootstrap tooltips](https://getbootstrap.com/docs/5.3/components/tooltips/).

1. Add a `data-bs-toggle="tooltip" title="..."` attribute to each feature using `update`
2. Call `new bootstrap.Tooltip(element, {selector: '[data-bs-toggle="tooltip"]'})` to initialize tooltips

[![Example](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/tooltip.webp)](docs/tooltip.html ":include height=320px")

[See how to add tooltips](docs/tooltip.html ":include :type=code")

## Interactions

- Clicking on a node highlights all links connected to it by adding the `.show` class to the links.
- If a node _already_ has all links highlighted, clicking on it hides them by removing the `.show` class from the links.

You can style the `.show` class to make the links more or less visible. For example:

```css
.link {
  opacity: 0.05;
}
.link.show {
  opacity: 1;
}
```

[![Sales Sankey diagram](https://raw.githubusercontent.com/gramener/gramex-sankey/main/docs/sales.webp)](docs/sales.html ":include height=320px")

[Here is the source code for the diagram above](docs/sales.html ":include :type=code")

## API

[See API documentation](docs/api.md ":include :type=markdown")

## Release notes

- 1.1.0: 28 Oct 2024.
  - Clicking a node first shows all nodes if any are missing. (Earlier it would HIDE if any were present.)
  - Allow categories to be an array of keys or functions
  - Refactor to remove margins
- 1.0.0: 28 Oct 2024. Initial release

## Authors

- Anand S <s.anand@gramener.com>

## License

[MIT](https://spdx.org/licenses/MIT.html)
