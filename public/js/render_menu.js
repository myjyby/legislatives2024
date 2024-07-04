import { d3 } from './d3.prototype.extensions.js';

export function renderIcons (menu, numPoints = 2) {
	const iconSize = [20, 10];
	const pointSize = 2;
	let points = new Array(numPoints).fill(0).map((d, i) => Math.random());

	const x = d3.scaleLinear([0, numPoints - 1], [pointSize, iconSize[0] - pointSize])
	const y = d3.scaleLinear(d3.extent(points), [iconSize[1] - pointSize, pointSize])

	menu.selectAll(`ul.c-${numPoints} li:not(.title)`)
	.each(function () {
		const sel = d3.select(this);
		const svg = sel.insertElem('input', 'svg')
			.attr('width', iconSize[0])
			.attr('height', iconSize[1]);
		let g = svg.addElems('g', null, d => {
			if (sel.classed('gauche')) points.sort((a, b) => b - a);
			if (sel.classed('centre')) {
				const max = Math.max(...points);
				const i = points.indexOf(max);
				points.splice(i, 1);
				points.splice(1, 0, max);
			}
			if (sel.classed('droite')) points.sort((a, b) => a - b);
			return [ points.map((c, j) => { return { x: x(j), y: y(c) } }) ];
		});

		g.addElems('path')
		.attr('d', d => `M${d.map(c => [ c.x, c.y ]).join(' L')}`)
		.style('stroke', '#000')
		.style('fill', 'none');

		g.addElems('circle', null, d => d)
		.attr('cx', d => d.x)
		.attr('cy', d => d.y)
		.attr('r', 2)
	});
}

export function getFilters () {
	const form = d3.select('#filter-menu section.active form').node();
	const data = new FormData(form)
	const apply = [];

	for (const [key, val] of data.entries()) {
		apply.push(val);
	}

	return apply;
}