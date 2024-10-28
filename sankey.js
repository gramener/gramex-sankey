import { layer, getSVG } from "@gramex/chartbase";

/**
 * Creates a network visualization.
 *
 * @param {string|HTMLElement} el - The selector or HTML element for the SVG.
 * @param {Object} params - Parameters for the visualization.
 * @param {Array} params.data - array of objects.
 * @param {number} [params.width] - width of the SVG.
 * @param {number} [params.height] - height of the SVG.
 * @param {Object} [params.categories] - object of accessors for each category
 * @param {string|Function} [params.size] - size accessor
 * @param {string|Function} [params.text] - text accessor (defaults to "key")
 * @param {number} [params.labelWidth] - width of the label area
 * @param {number} [params.gap] - total gap between categories as a percentage of the height
 * @param {Object} [params.d3=window.d3] - D3 instance to use.
 * @returns {Graph} Object containing D3.js selections for nodes and links.
 */
export function sankey(
  el,
  { data, width, height, categories, size, text = "key", labelWidth, gap, d3 = globalThis.d3 }
) {
  // If el is already a D3 element, use it (with it's version of D3). Else use the provided D3
  ({ el, width, height } = getSVG(el._groups ? el.node() : el, width, height));
  const svg = d3.select(el);

  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const innerWidth = width - labelWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const sizeAccessor = typeof size === "function" ? size : (d) => d[size];
  const categoryList = Object.entries(categories);

  // Set categoryHeight based on gap
  const categoryHeight = (innerHeight * (1 - (gap ?? 0.5))) / categoryList.length;

  // Create layers
  const labelGroup = layer(svg, "g", "labels").attr("transform", `translate(${margin.left},${margin.top})`);
  const linkGroup = layer(svg, "g", "links");
  const nodeGroup = layer(svg, "g", "nodes").attr("transform", `translate(${margin.left + labelWidth},${margin.top})`);

  // Process nodes data
  const totalSize = d3.sum(data, sizeAccessor);
  const nodeData = categoryList
    .map(([categoryName, category]) => {
      const accessor = typeof category === "function" ? category : (d) => d[category];
      const group = d3.group(data, accessor);
      let cumulative = 0;
      return Array.from(group, ([key, group]) => {
        const size = d3.sum(group, sizeAccessor);
        const range = [cumulative / totalSize, (cumulative + size) / totalSize];
        cumulative += size;
        return { cat: categoryName, key, size, range, group };
      });
    })
    .flat();

  // Create lookup map for quick node reference
  const nodeMap = new Map(nodeData.map((node) => [`${node.cat}-${node.key}`, node]));

  const linkData = [];
  // Iterate through all categories except the last one
  for (let i = 0; i < categoryList.length - 1; i++) {
    const [sourceCategoryName, sourceCategory] = categoryList[i];
    const [targetCategoryName, targetCategory] = categoryList[i + 1];
    const getSource = typeof sourceCategory === "function" ? sourceCategory : (d) => d[sourceCategory];
    const getTarget = typeof targetCategory === "function" ? targetCategory : (d) => d[targetCategory];
    // Group by source
    const sourceGroups = d3.group(data, getSource, getTarget);
    const sourceCumulative = {};
    const targetCumulative = {};
    for (const [sourceKey, targets] of sourceGroups) {
      const source = nodeMap.get(`${sourceCategoryName}-${sourceKey}`);
      for (const [targetKey, group] of targets) {
        const size = d3.sum(group, sizeAccessor);
        const target = nodeMap.get(`${targetCategoryName}-${targetKey}`);
        sourceCumulative[sourceKey] = sourceCumulative[sourceKey] ?? 0;
        const sourceRange = [
          sourceCumulative[sourceKey] / source.size,
          (sourceCumulative[sourceKey] + size) / source.size,
        ];
        sourceCumulative[sourceKey] += size;
        targetCumulative[targetKey] = targetCumulative[targetKey] ?? 0;
        const targetRange = [
          targetCumulative[targetKey] / target.size,
          (targetCumulative[targetKey] + size) / target.size,
        ];
        targetCumulative[targetKey] += size;
        linkData.push({
          source,
          target,
          size,
          sourceRange,
          targetRange,
          group,
        });
      }
    }
  }

  // Set up scales
  const yScale = d3
    .scalePoint()
    .domain(categoryList.map(([cat]) => cat))
    .range([0, innerHeight])
    .padding(0.5);

  const xScale = d3.scaleLinear().range([0, innerWidth]);

  // Add .width to nodeData. Helps determine whether to write text or not
  nodeData.forEach((d) => (d.width = xScale(d.range[1] - d.range[0])));

  // Draw nodes
  const nodesLayer = layer(nodeGroup, "rect", "node", nodeData)
    .attr("x", (d) => xScale(d.range[0]))
    .attr("y", (d) => yScale(d.cat) - categoryHeight / 2)
    .attr("width", (d) => d.width)
    .attr("height", categoryHeight)
    .on("click.sankey", (_, d) => {
      const links = linkData.filter((link) => link.source === d || link.target === d);
      const show = !links.some((link) => linksLayer.filter((x) => x === link).classed("show"));
      linksLayer.filter((link) => links.includes(link)).classed("show", show);
    });

  // Draw text
  const textAccessor = typeof text === "function" ? text : (d) => d[text];
  const textLayer = layer(nodeGroup, "text", "text", nodeData)
    .attr("x", (d) => xScale((d.range[0] + d.range[1]) / 2))
    .attr("y", (d) => yScale(d.cat))
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .text(textAccessor);

  // Draw labels
  const labelsLayer = layer(labelGroup, "text", "label", categoryList)
    .attr("x", 0)
    .attr("y", ([categoryName]) => yScale(categoryName))
    .attr("dy", "0.35em")
    .text(([categoryName]) => categoryName);

  // Draw links
  const linksLayer = layer(linkGroup, "path", "link", linkData)
    .attr("fill", "none")
    .attr("transform", `translate(${labelWidth}, 0)`)
    .attr("d", (d) => {
      const sourceX0 = xScale(d.source.range[0] + (d.source.range[1] - d.source.range[0]) * d.sourceRange[0]);
      const sourceX1 = xScale(d.source.range[0] + (d.source.range[1] - d.source.range[0]) * d.sourceRange[1]);
      const targetX0 = xScale(d.target.range[0] + (d.target.range[1] - d.target.range[0]) * d.targetRange[0]);
      const targetX1 = xScale(d.target.range[0] + (d.target.range[1] - d.target.range[0]) * d.targetRange[1]);
      const sourceY = yScale(d.source.cat) + categoryHeight / 2;
      const targetY = yScale(d.target.cat) - categoryHeight / 2;
      const gapY = (targetY - sourceY) * 0.5;
      return `
        M ${sourceX0} ${sourceY}
        L ${sourceX1} ${sourceY}
        C ${sourceX1} ${sourceY + gapY},
          ${targetX1} ${targetY - gapY},
          ${targetX1} ${targetY}
        L ${targetX0} ${targetY}
        C ${targetX0} ${targetY - gapY},
          ${sourceX0} ${sourceY + gapY},
          ${sourceX0} ${sourceY}
        Z
      `.trim();
    });

  /**
   * Define the returned graph
   * @typedef {Object} Graph
   * @property {Object} nodes - D3.js selection for nodes, allowing manipulation of node elements.
   * @property {Object} links - D3.js selection for links, enabling styling and interaction with link elements.
   * @property {Object} texts - D3.js selection for texts, used for updating or styling text labels on nodes.
   * @property {Object} labels - D3.js selection for labels, representing category names, useful for positioning and styling.
   * @property {Array} nodeData - Array of node data, each object contains:
   * @property {string} nodeData.cat - Row name. From keys of `categories`
   * @property {string} nodeData.key - Box label. The value in the category
   * @property {Object} nodeData.group - Data rows for this box
   * @property {number} nodeData.size - Box size. Sum of the `size` accessor on `nodeData.group`
   * @property {Array} nodeData.range - Box X position as [start, end] with values between 0 and 1
   * @property {number} nodeData.width - Box width in pixels when rendered
   * @property {Array} linkData - Array of link data, each object contains:
   * @property {Object} linkData.source - Source node object.
   * @property {Object} linkData.target - Target node object.
   * @property {Array} linkData.group - Data rows for this link, for this source AND target combination
   * @property {number} linkData.size - Link size. Sum of the `size` accessor on `linkData.group`
   * @property {Array} linkData.sourceRange - Link top position as [start, end] with values between 0 and 1
   * @property {Array} linkData.targetRange - Link bottom position as [start, end] with values between 0 and 1
   */
  return { nodes: nodesLayer, links: linksLayer, texts: textLayer, labels: labelsLayer, nodeData, linkData };
}
