import { clearMap, drawMap, drawResults } from './render_points.js';
import { renderIcons } from './render_menu.js';
import { droms, villes } from './data.js';
import { nest, unique } from './helpers.js';
import { partis } from './partis.js';
import { d3 } from './d3.prototype.extensions.js';

const filtrerElus = false;
const spectrePol = partis.map(d => d.abbv);

function onLoad () {
	// RENDER THE MENY
	const menu = d3.select('#menu');	
	renderIcons(menu, 2);
	renderIcons(menu, 3);

	menu.selectAll('nav ul li')
	.on('click', function () {
		const { name } = this.dataset;
		menu.selectAll('.active').classed('active', false);
		menu.selectAll(`.${name}`).classed('active', true);
	});

	menu.selectAll('input')
	.on('change', drawResults);

	// LOAD THE DATA
	const requests = []
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/efa8c2e6-b8f7-4594-ad01-10b46b06b56a').then(res => res.json()))
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/a04f8cae-c94d-4ade-804d-ec024ee554ac').then(res => res.text()))
	
	Promise.all(requests)
	.then(data => {
		let [ geo, votes ] = data;

		votes = d3.csvParse(votes)
			.filter(d => {
				if (filtrerElus) return d.Elu !== 'NON';
				else return true;
			});

		// POUR VOIR LA LISTE DE PARTIS, SELON LES DONNEES DE VOTES
		// console.log(unique.call(votes.map(d => { return { abbv: d.CodNuaCand, nom: d.LibNuaCand } }), { key: 'abbv' }));

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

		const { clientWidth, offsetWidth, clientHeight, offsetHeight } = d3.select('#canvas').node()
		const w = clientWidth || offsetWidth;
		const h = (clientHeight || offsetHeight) - 60;

		d3.selectAll('#canvas nav ul.territoires li')
		.each(function () {
			const sel = d3.select(this);

			if (sel.classed('metropole')) {
				// const { geodata, circos } = processData({ features: geo.features.filter(b => (!isNaN(b.properties.code_dpt) && ![75, 77, 78, 91, 92, 93, 94, 95].includes(b.properties.code_dpt))), votes })
				const { geodata, circos } = processData({ features: geo.features.filter(b => (!isNaN(b.properties.code_dpt))), votes })
				sel.datum([{ geodata, circos, id: 'metropole' }]);
				// drawMap({ w, h, geodata, circos, id: d.toLowerCase() });
			} 
			// else if (d === 'IDF') {
			// 	const { geodata, circos } = processData({ features: geo.features.filter(b => [77, 78, 91, 95].includes(b.properties.code_dpt)), votes })
			// 	drawMap({ w: 400, h: 600, geodata, circos, id: d.toLowerCase() });
			// } else if (d === 'Paris') {
			// 	const { geodata, circos } = processData({ features: geo.features.filter(b => [75, 92, 93, 94].includes(b.properties.code_dpt)), votes })
			// 	drawMap({ w: 400, h: 600, geodata, circos, id: d.toLowerCase() });
			// } 
			else if (sel.classed('droms')) {
				const data = droms.map((c, id) => {
					const { geodata, circos } = processData({ features: geo.features.filter(b => b.properties.nom_dpt.toLowerCase() === c.nom.toLowerCase()), votes })
					return { geodata, circos, id: `dorm-${id}` };
				});
				sel.datum(data);
			} else if (sel.classed('villes')) {
				const data = villes.map((c, id) => {
					const { geodata, circos } = processData({ features: geo.features.filter(b => c.dpts.includes(b.properties.code_dpt)), votes })
					return { geodata, circos, id: `dorm-${id}` };
				});
				sel.datum(data);
			}
		}).select('button')
		.each(function () {
			const sel = d3.select(this);

			if (sel.classed('active')) {
				const data = d3.select(this.parentNode).datum();
				data.forEach(d => {
					const { geodata, circos, id } = d;
					const svgw = data.length === 1 ? w : w/3;
					const svgh = data.length === 1 ? h : h/3;
					drawMap({ w: svgw, h: svgh, geodata, circos, id });
					drawResults();
				});
			}
		}).on('click', function () {
			clearMap();
			const buttons = d3.select(this).findAncestor('ul').selectAll('button').classed('active', false);
			const sel = d3.select(this);
			sel.classed('active', true);
			const data = d3.select(this.parentNode).datum();
			data.forEach(d => {
				const { geodata, circos, id } = d;
				const svgw = data.length === 1 ? w : w/3;
				const svgh = data.length === 1 ? h : h/3;
				drawMap({ w: svgw, h: svgh, geodata, circos, id });
				drawResults();
			});
		});

		// AJOUTER LES CIRCOS AU MENU "COMPRENDRE"
		// menu.select('section.comprendre select')
		// .addElems('option', null, geo.features)
		// .attr('value', d => d.properties.code_dpt)
		// .html(d => d.properties.code_dpt)

	}).catch(err => console.log(err));
}

function processData (kwargs) {
	const { features, votes, nom_dpt } = kwargs;

	const geodata = { type: 'FeatureCollection', features };
	const geocodes = features.map(d => d.properties.join_code);

	let circos = nest.call(votes, { key: 'CodCirElec', keep: [ 'Inscrits', 'Abstentions' ] });
	circos.forEach(d => {
		d.values.sort((a, b) => spectrePol.indexOf(a.CodNuaCand) - spectrePol.indexOf(b.CodNuaCand));
		d.geoCirco = features.find(c => c.properties.join_code === d.key);
	})
	circos = circos.filter(d => geocodes.includes(d.key))

	return { geodata, circos }
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', onLoad);
} else {
	onLoad();
}