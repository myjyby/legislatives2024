import { d3 } from './d3.prototype.extensions.js';
import { nest, unique } from './helpers.js';
import { spectrePol, mapSections, droms } from './data.js';
import { centroid } from 'https://cdn.jsdelivr.net/npm/@turf/turf@7/+esm';

function onLoad () {
	const requests = []
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/efa8c2e6-b8f7-4594-ad01-10b46b06b56a').then(res => res.json()))
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/a04f8cae-c94d-4ade-804d-ec024ee554ac').then(res => res.text()))
	
	Promise.all(requests)
	.then(data => {
		let [ geo, votes ] = data;

		votes = d3.csvParse(votes)
			.filter(d => d.Elu !== 'NON');

		// console.log(nest.call(geo.features.filter(d => isNaN(+d.properties.code_dpt)), { key: d => d.properties.nom_dpt }))

		geo.features.forEach(d => {
			if (!isNaN(+d.properties.code_dpt)) d.properties.code_dpt = +d.properties.code_dpt;
			d.properties.num_circ = +d.properties.num_circ;

			const { code_dpt, nom_dpt, num_circ } = d.properties;
			if (!isNaN(d.properties.code_dpt)) d.properties.join_code = `${code_dpt < 10 ? '0' : ''}${code_dpt}${num_circ < 10 ? '0' : ''}${num_circ}`;
			else {
				const code = droms.find(c => c.nom.toLowerCase() === nom_dpt.toLowerCase())?.dpt;
				if (!code) console.log(nom_dpt)
				d.properties.join_code = `${code}${num_circ < 10 ? '0' : ''}${num_circ}`;
				// console.log(d.properties.join_code)
				// MANQUE LA CORSE
			}
		});
		
		const score = 'RapportInscrits'
		// const score = 'RapportExprimes'

		votes.forEach(d => {
			d.NbVoix = +d.NbVoix;
			d.Inscrits = +d.Inscrits;
			d.score = parseFloat(d[score].replace(',', '.'));
			d.Abstentions = +d.Abstentions;
		});

		mapSections.forEach(d => {
			if (d === 'Metropole') {
				const { geodata, circos } = processData({ features: geo.features.filter(b => (!isNaN(b.properties.code_dpt) && ![75, 77, 78, 91, 92, 93, 94, 95].includes(b.properties.code_dpt))), votes })
				drawMap({ w: 800, h: 900, geodata, circos, id: d.toLowerCase() });
			} else if (d === 'IDF') {
				const { geodata, circos } = processData({ features: geo.features.filter(b => [77, 78, 91, 95].includes(b.properties.code_dpt)), votes })
				drawMap({ w: 400, h: 600, geodata, circos, id: d.toLowerCase() });
			} else if (d === 'Paris') {
				const { geodata, circos } = processData({ features: geo.features.filter(b => [75, 92, 93, 94].includes(b.properties.code_dpt)), votes })
				drawMap({ w: 400, h: 600, geodata, circos, id: d.toLowerCase() });
			} else if (d === 'DROMS') {
				droms.forEach((c, id) => {
					const { geodata, circos } = processData({ features: geo.features.filter(b => b.properties.nom_dpt.toLowerCase() === c.nom.toLowerCase()), votes })
					drawMap({ w: 100, h: 100, geodata, circos, id: `${d.toLowerCase()}-${id}` });
					// drawMap({ w: 1200, h: 900, geodata, circos });
				})
			}
		})	
	}).catch(err => console.log(err));
}

function processData (kwargs) {
	const { features, votes, nom_dpt } = kwargs;

	const geodata = { type: 'FeatureCollection', features };
	const geocodes = features.map(d => d.properties.join_code);

	let circos = nest.call(votes, { key: 'CodCirElec', keep: [ 'Inscrits', 'Abstentions' ] });
	circos.forEach(d => {
		d.values.sort((a, b) => spectrePol.indexOf(a.CodNuaCand) - spectrePol.indexOf(b.CodNuaCand));
		// if (d.count > 1) d.angle = computeAngle(d.values[0].NbVoix, d.values[d.count - 1].NbVoix, d.Inscrits)[1];
		if (d.count > 1) d.angle = computeAngle(d.values[0].score, d.values[d.count - 1].score)[1];
		else d.angle = -90;
		d.geoCirco = features.find(c => c.properties.join_code === d.key);
	})
	circos = circos.filter(d => geocodes.includes(d.key))

	return { geodata, circos }
}

function drawMap (kwargs) {
	const { w, h, geodata, circos, id } = kwargs;
	const cellsize = 50;
	const useColor = true;
	// REF: https://observablehq.com/@ericmauviere/le-fond-de-carte-simplifie-des-communes-2021-avec-droms-rapp
	const proj = d3.geoConicConformal()
		.parallels([33, 45])
		.rotate([0, 0])
		.fitExtent([[0, 0],[w, h]], geodata);

	const path = d3.geoPath(proj);

	const svg = d3.select('#canvas')
		.style('background-color', '#DEDEDE')
	.addElems('svg', `map-${id}`)
		.attr('viewBox', [0, 0, w, h])
		.attr('width', w)
		.attr('height', h);

	svg.addElems('g', 'fond-de-carte')
	.addElems('path', 'circo', geodata.features)
		.attr('d', path)
		.style('stroke', '#CACACA')
		.style('fill', 'none');
	
	const colors = d3.scaleSequential(d3.interpolateSpectral);
	
	const l = d3.scaleLinear()
		.domain([0, 100])
		.range([0, cellsize])

	const lines = svg.addElems('g', 'votes-circo', circos)
		.attr('transform', d => {
			if (d.geoCirco) {
				const c = centroid(d.geoCirco);
				return `translate(${[ proj(c.geometry.coordinates) ]})`
			}
			else return `translate(${[ cellsize / 2, cellsize / 2 ]})`;
		})
	const baseline = lines.addElems('line', 'base')
		.attr('x1', d => -l(50))
		.attr('x2', d => l(50))
		.attr('y1', 0)
		.attr('y2', 0)
		.style('stroke', '#FFF')
		.style('stroke-width', 1);
	const c1 = lines.addElems('line', 'c1')
		.attr('x1', 0)
		.attr('x2', d => l(-d.values[0].score))
		.attr('y1', 0)
		.attr('y2', 0)
		.style('stroke', d => {
			if (useColor) return colors(spectrePol.indexOf(d.values[0].CodNuaCand) / spectrePol.length);
			else return '#000';
		})
		.style('stroke-linecap', 'round')
		.style('stroke-width', 3)
	.on('mouseover', (evt, d) => {
		console.log(d.values.map(c => c.CodNuaCand))
	})
	const c2 = lines.addElems('line', 'c2', d => d.count > 1 ? [d] : [])
		.attr('x1', 0)
		.attr('x2', d => (l(d.values[d.count - 1]?.score) ?? 0))
		.attr('y1', 0)
		.attr('y2', 0)
		.style('stroke', d => {
			if (useColor) {
				if (d.values[d.count - 1]) return colors(spectrePol.indexOf(d.values[d.count - 1].CodNuaCand) / spectrePol.length);
				else return null;
			} else {
				return '#000';
			}
		})
		.style('stroke-linecap', 'round')
		.style('stroke-width', 3)
	.on('mouseover', (evt, d) => {
		console.log(d.values.map(c => c.CodNuaCand))
	})
	const c3 = lines.addElems('line', 'c3', d => d.count === 3 ? [d] : [])
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', d => (l(d.values[1]?.score) ?? 0))
		.style('stroke', d => {
			if (useColor) {
				if (d.values[1]) return colors(spectrePol.indexOf(d.values[1].CodNuaCand) / spectrePol.length);
				else return null;
			} else {
				return '#000';
			}
		})
		.style('stroke-linecap', 'round')
		.style('stroke-width', 3)
	.on('mouseover', (evt, d) => {
		console.log(d.values.map(c => c.CodNuaCand))
	})
	lines.transition()
	.duration(1000)
	// .delay((d, i) => i * 10)
	.attr('transform', d => {
		if (d.geoCirco) {
			const c = centroid(d.geoCirco);
			return `translate(${[ proj(c.geometry.coordinates) ]})rotate(${ d.angle })`
		}
		else return `translate(${[ cellsize / 2, cellsize / 2 ]})rotate(${ d.angle })`;
	})
}

function computeAngle (a, b, t) {
	// let pa = a * 100 / t
	// let pb = b * 100 / t
	// let diff = pb - pa;
	// if (a && pa >= 50) diff = 50;
	// else if (b && pb >= 50) diff = -50;

	let diff = b - a;
	// if (a >= 50) diff = 50

	const s = d3.scaleLinear()
	.domain([-50, 50])
	.range([-90, 90]);

	return [ diff, s(diff) ];
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', onLoad);
} else {
	await onLoad();
}