import { d3 } from './d3.prototype.extensions.js';
import { partis } from './partis.js';
import { getFilters } from './render_menu.js';
import { processData } from './load.js';
import { chunk } from './helpers.js';
import { renderTooltip, renderComprendre } from './render_tooltip.js';
import { centroid, envelope } from 'https://cdn.jsdelivr.net/npm/@turf/turf@7/+esm';

export const useColor = false;
export const spectrePol = partis.map(d => d.abbv);
const gauche = partis.filter(d => {
	return ['Gauche radicale et extrême gauche', 'Gauche'].includes(d.orientation)
}).map(d => d.abbv);
const centre = partis.filter(d => {
	return ['Centre', 'Divers'].includes(d.orientation)
}).map(d => d.abbv);
const droite = partis.filter(d => {
	return ['Droite', 'Droite radicale et extrême droite'].includes(d.orientation)
}).map(d => d.abbv);
console.log(spectrePol)

export function clearMap () {
	d3.selectAll('#canvas section svg').remove();
}

export function drawMap (kwargs) {
	const { w, h, geodata, circos, id, title } = kwargs;
	const padding = 25;
	// REF: https://observablehq.com/@ericmauviere/le-fond-de-carte-simplifie-des-communes-2021-avec-droms-rapp
	const proj = d3.geoConicConformal()
		.parallels([33, 45])
		.rotate([0, 0])
		.fitExtent([[padding, padding],[w - padding, h - padding * 2]], geodata);

	const path = d3.geoPath(proj);

	const canvas = d3.select('#canvas section');
	const svg = canvas.addElems('svg', `map-${id}`)
		.attr('viewBox', [0, 0, w, h])
		.style('max-width', w)
		.style('max-height', h)
	.addElems('g', 'container')
		.datum({ zoom: 1 });

	if (title) {
		svg.addElem('text', 'title')
			.attr('x', w / 2)
			.attr('y', h - padding)
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.text(title);
	}

	svg.addElems('g', 'fond-de-carte')
	.addElems('path', 'circo', geodata.features)
		.each(function (d) {
			d3.select(this).classed(`c-${d.properties.join_code}`, true);
		}).attr('d', path)
		.style('stroke', '#CACACA')
		.style('fill', 'transparent')
	.on('mouseover', function (evt, d) {
		const sel = d3.select(this);
		const { join_code } = d.properties;
		const circo = circos.find(c => c.key === join_code);
		
		if (filterData(circo).length) {

			const k = d3.select('.container').datum()?.zoom;

			d3.selectAll('path.circo')
				.style('stroke', '#CACACA')
				.style('stroke-width', 1 / (k ?? 1));

			sel.moveToFront()
				.style('stroke', '#636363')
				.style('stroke-width', 2 / (k ?? 1));

			// renderTooltip.call(this, { circo, w, h });
			renderComprendre(circo);
		}
	}).on('mouseout', _ => {
		const k = d3.select('.container').datum()?.zoom;

		d3.selectAll('path.circo')
			.style('stroke', '#CACACA')
			.style('stroke-width', 1 / (k ?? 1));
		renderComprendre();
	})
	.on('click', function (evt, d) {
		const sel = d3.select(this);
		const menu = d3.select('#menu');
		menu.selectAll('.active').classed('active', false);
		menu.selectAll('.comprendre').classed('active', true);
		const { join_code } = d.properties;
		const circo = circos.find(c => c.key === join_code);
		// renderTooltip.call(this, { circo, w, h });
		if (filterData(circo).length) renderComprendre(circo);
		// ZOOM
		const { code_dpt } = circo.geoCirco.properties;
		const container = sel.findAncestor('container');
		let { zoomID } = container.datum();

		let c = [ w / 2, h / 2 ];
		let k = 1;
			
		const circo_unique = circos.filter(c => c.geoCirco.properties.code_dpt === code_dpt).length === circos.length;

		if (zoomID !== code_dpt && !circo_unique) {
			
			const { geodata: geoZoom } = processData({ features: geodata.features.filter(b => b.properties.code_dpt === code_dpt) });
			c = proj(centroid(geoZoom).geometry.coordinates);
			const e = chunk.call(envelope(geoZoom).bbox, 2).map(c => proj(c));
			const zw = Math.abs(e[1][0] - e[0][0]);
			const zh = Math.abs(e[1][1] - e[0][1]);
			k = Math.max(1, Math.floor(Math.min(w / zw, h / zh)) * 2/3);
			
			/*
			const circos_dpt = []
			d3.selectAll('.circo')
			.each(function (c) {
				if (c.properties.code_dpt === code_dpt) {
					const { x, y, width, height } = this.getBBox();
					circos_dpt.push({ minx: x, miny: y, maxx: x + width, maxy: y + height });
					// const bboxCentroid = [ x + width / 2, y + height / 2 ];
					// const k = Math.floor(Math.min(w / width, h / height));
				}
			})
			const minx = Math.min(...circos_dpt.map(c => c.minx));
			const maxx = Math.min(...circos_dpt.map(c => c.maxx));
			const miny = Math.min(...circos_dpt.map(c => c.miny));
			const maxy = Math.min(...circos_dpt.map(c => c.maxy));
			const zw = maxx - minx;
			const zh = maxy - miny;
			c = [ minx + zw / 2, miny + zh / 2 ];
			k = Math.floor(Math.min(w / zw, h / zh)) * 2/3;
			*/

			zoomID = code_dpt;
		} else zoomID = null;

		container.each(c => {
			c.zoom = k;
			c.zoomID = zoomID;
		}).transition()
			.attr('transform', `translate(${c.map(c => (1 - k) * c)})scale(${k})`)
		// container.selectAll('circle')
			// .attr('r', 2 / k);

		container.selectAll('.circo')
			.style('stroke-width', 1 / 	k)
			.style('fill', 'transparent')
			.filter(c => c.properties.code_dpt !== code_dpt && zoomID !== null)
			.style('fill', '#ECECEC');
		

		container.selectAll('.circo-votes, .circo-elus')
			.style('display', 'block')
			.filter(c => c.geoCirco.properties.code_dpt !== code_dpt && zoomID !== null)
			.style('display', 'none')

		container.selectAll('.circo-votes, .circo-elus')
			.attr('transform', b => {
				if (b.geoCirco) {
					const c = centroid(b.geoCirco);
					return `translate(${[ proj(c.geometry.coordinates) ]})scale(${(k > 1 ? 2 : 1) / k})`
				}
				else return `translate(${[ cellsize / 2, cellsize / 2 ]})scale(${(k > 1 ? 2 : 1) / k})`;
			})
	});

	svg.addElems('g', 'circo-votes', circos)
		.attr('transform', d => {
			if (d.geoCirco) {
				const c = centroid(d.geoCirco);
				return `translate(${[ proj(c.geometry.coordinates) ]})`
			}
			else return `translate(${[ cellsize / 2, cellsize / 2 ]})`;
		});

	svg.addElems('g', 'circo-elus', circos.map(d => {
		let { values, ...data } = d;
		data.values = values.filter(c => c.Elu !== 'NON');
		return data;
	})).attr('transform', d => {
		if (d.geoCirco) {
			const c = centroid(d.geoCirco);
			return `translate(${[ proj(c.geometry.coordinates) ]})`
		}
		else return `translate(${[ cellsize / 2, cellsize / 2 ]})`;
	});
}

export function drawResults () {
	const cellsize = 25;
	const colors = d3.scaleSequential(d3.interpolateSpectral);
	
	const x = d3.scalePoint(spectrePol, [-cellsize / 2, cellsize / 2]);
	const y = d3.scaleLinear([0, 50], [cellsize / 2, -cellsize / 2]);
	
	const svg = d3.selectAll('#canvas svg g.container');
	const circo_votes = svg.selectAll('g.circo-votes')
	const circo_elus = svg.selectAll('g.circo-elus');

	circo_votes.addElems('path', 'balance', d => filterData(d))
		.attr('d', d => {
			return `M${d.values.map(c => `${x(c.CodNuaCand)},${y(c.score)}`).join(' L')}`;
		}).style('stroke', '#ACACAC')
		.style('fill', 'none');

	circo_votes.addElems('circle', 'parti', d => filterData(d)[0]?.values || [])
		.attr('r', 2)
		.attr('cx', d => x(d.CodNuaCand))
		.attr('cy', d => y(d.score))
		.style('fill', '#ACACAC');

	circo_elus.addElems('path', 'balance', d => filterData(d))
	.attr('d', d => {
			return `M${d.values.map(c => `${x(c.CodNuaCand)},${y(c.score)}`).join(' L')}`;
		}).style('stroke', '#000')
		.style('stroke-dasharray', '1, 3')
		.style('fill', 'none');

	circo_elus.addElems('path', 'balance-maintenu', d => filterData(d))
	.attr('d', d => {
			const values = d.values.filter(c => c.maintenu == true).map(c => `${x(c.CodNuaCand)},${y(c.score)}`);
			if (values.length) return `M${values.join(' L')}`;
			else return null;
		}).style('stroke', '#000')
		.style('fill', 'none');

	circo_elus.addElems('circle', 'parti', d => filterData(d)[0]?.values.filter(c => c.maintenu === true || ['OUI', 'NON'].includes(c.Elu)) || [])
		.attr('r', 2)
		.attr('cx', d => x(d.CodNuaCand))
		.attr('cy', d => y(d.score))
		.style('fill', d => {
			if (useColor) {
				return colors(spectrePol.indexOf(d.CodNuaCand) / spectrePol.length);
			} else {
				return '#000';
			}
		})

	circo_elus.addElems('g', 'parti-desiste', d => filterData(d)[0]?.values.filter(c => c.maintenu === false && !['OUI', 'NON'].includes(c.Elu)) || [])
		.attr('transform', d => `translate(${[ x(d.CodNuaCand), y(d.score) ]})`)
	.addElems('line', null, [ { x1: -2.5, y1: -2.5, x2: 2.5, y2: 2.5 }, { x1: -2.5, y1: 2.5, x2: 2.5, y2: -2.5 } ])
		.attr('x1', d => d.x1)
		.attr('x2', d => d.x2)
		.attr('y1', d => d.y1)
		.attr('y2', d => d.y2)
		.style('stroke', d => {
			if (useColor) {
				return colors(spectrePol.indexOf(d.CodNuaCand) / spectrePol.length);
			} else {
				return '#000';
			}
		});
}

function filterData (d) {
	const filters = getFilters();
	const max = Math.max(...d.values.map(c => c.score));
	const elus = d.values.filter(c => c.Elu !== 'NON' && (c.maintenu || c.Elu === 'OUI')).length;
	const partis_maintenus = d.values.filter(c => c.Elu !== 'NON' && (c.maintenu || c.Elu === 'OUI')).map(c => c.CodNuaCand);

	if (!filters.includes('e-g') && elus === 1 && gauche.some(c => partis_maintenus.includes(c))) return [];
	if (!filters.includes('e-c') && elus === 1 && centre.some(c => partis_maintenus.includes(c))) return [];
	if (!filters.includes('e-d') && elus === 1 && droite.some(c => partis_maintenus.includes(c))) return [];

	if (!filters.includes('b-g') && elus > 1 && gauche.some(c => partis_maintenus.includes(c))) return [];
	if (!filters.includes('b-c') && elus > 1 && centre.some(c => partis_maintenus.includes(c))) return [];
	if (!filters.includes('b-d') && elus > 1 && droite.some(c => partis_maintenus.includes(c))) return [];

	if (!filters.includes('d-g') 
		&& elus === 2
		&& (
			gauche.includes(d.values.find(c => c.score === max)?.CodNuaCand)
			|| (centre.includes(d.values.find(c => c.score === max)?.CodNuaCand) 
				&& droite.includes(d.values.find(c => c.score < max)?.CodNuaCand))
		)
	) return [];

	if (!filters.includes('d-d') 
		&& elus === 2
		&& (
			droite.includes(d.values.find(c => c.score === max)?.CodNuaCand)
			|| (centre.includes(d.values.find(c => c.score === max)?.CodNuaCand) 
				&& gauche.includes(d.values.find(c => c.score < max)?.CodNuaCand))
		)
	) return [];

	if (!filters.includes('t-g') 
		&& elus === 3
		&& gauche.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];

	if (!filters.includes('t-c') 
		&& elus === 3
		&& centre.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];

	if (!filters.includes('t-d') 
		&& elus === 3
		&& droite.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];

	if (!filters.includes('q-g') 
		&& elus === 4
		&& gauche.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];

	if (!filters.includes('q-c') 
		&& elus === 4
		&& centre.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];

	if (!filters.includes('q-d') 
		&& elus === 4
		&& droite.includes(d.values.find(c => c.score === max)?.CodNuaCand)
	) return [];
	
	return [d];
}