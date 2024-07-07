import { clearMap, drawMap, drawResults } from './render_points.js';
import { renderIcons } from './render_menu.js';
import { renderComprendre } from './render_tooltip.js';
import { droms, villes } from './data.js';
import { nest, unique } from './helpers.js';
import { partis } from './partis.js';
import { d3 } from './d3.prototype.extensions.js';

const filtrerElus = false;
const spectrePol = partis.map(d => d.abbv);
// const score = 'RapportInscrits';
const score = 'RapportExprimes'

function onLoad () {
	// RENDER THE MENY
	const menu = d3.select('#menu');	
	renderIcons(menu, 2);
	renderIcons(menu, 3);
	renderIcons(menu, 4);

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
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/f04605b8-4c02-4496-8a26-2bc02b17f739').then(res => res.text()))
	requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/386fd5ac-e7f1-4e0f-8929-12d2c5391081').then(res => res.text()))
	// requests.push(fetch('https://www.data.gouv.fr/fr/datasets/r/6813fb28-7ec0-42ff-a528-2bc3d82d7dcd').then(res => res.text()))
	
	Promise.all(requests)
	.then(data => {
		let [ geo, votes, candidatsT2, resNat, bureaux ] = data;

		votes = d3.csvParse(votes)
			.filter(d => {
				if (filtrerElus) return d.Elu !== 'NON';
				else return true;
			});

		candidatsT2 = d3.dsvFormat(';').parse(candidatsT2);

		// console.log(d3.dsvFormat(';').parse(bureaux))

		resNat = d3.dsvFormat(';').parse(resNat);
		resNat.forEach(d => {
			d.clean = []
			Object.keys(d).map(c => {
				const keyarr = c.split(' ');
				const key = +keyarr[keyarr.length - 1];
				if (!isNaN(key)) {
					if (!d.clean.some(b => b.key === key)) {
						const obj = { key };
						if (score === 'RapportInscrits') obj.score = parseFloat(d[`% Voix/inscrits ${key}`].replace('%', '').replace(',', '.'));
						else if (score === 'RapportExprimes') obj.score = parseFloat(d[`% Voix/exprimés ${key}`].replace('%', '').replace(',', '.'));
						obj.CodNuaCand = d[`Nuance candidat ${key}`];
						obj.CodCirElec = d['Code localisation'];
						d.clean.push(obj);
					}
					const entry = d.clean.find(b => b.key === key);
					entry[c] = d[c];
				}
			});
		});
		console.log(resNat)

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
		
		candidatsT2.forEach(d => {
			d.CodCirElec = `${d['Code circonscription'].length === 3 ? '0' : ''}${d['Code circonscription']}`;
		})

		// VERIFIER SI TOUS LES CANDIDATS DU DEUXIEME TOUR SONT DANS LE LOT DU PREMIER TOUR
		/*
		console.log(candidatsT2.filter(d => {
			return !votes.some(c => {
				return c.CodCirElec === d.CodCirElec
					&& (c.CodNuaCand === d['Code nuance'] || c.NomPsn === d['Nom du candidat'])
					&& c.Elu !== 'NON';
			});
		}));*/

		votes.forEach(d => {
			d.NbVoix = +d.NbVoix;
			d.Inscrits = +d.Inscrits;
			d.score = parseFloat(d[score].replace(',', '.'));
			d.Abstentions = +d.Abstentions;
			d.maintenu = d.Elu !== 'NON' && candidatsT2.some(c => {
				return c.CodCirElec === d.CodCirElec
					&& (d.CodNuaCand === c['Code nuance'] || d.NomPsn === c['Nom du candidat']);
			})
		});

		console.log(votes.filter(d => d.Elu !== 'NON' && d.maintenu === false))

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
					return { geodata, circos, id: `drom-${id}`, title: c.nom };
				});
				sel.datum(data);
			} else if (sel.classed('villes')) {
				const data = villes.map((c, id) => {
					const { geodata, circos } = processData({ features: geo.features.filter(b => c.dpts.includes(b.properties.code_dpt)), votes })
					return { geodata, circos, id: `drom-${id}`, title: c.nom };
				});
				sel.datum(data);
			}
		}).select('button')
		.each(function () {
			const sel = d3.select(this);

			if (sel.classed('active')) {
				const data = d3.select(this.parentNode).datum();
				data.forEach(d => {
					const { geodata, circos, id, title } = d;
					const svgw = data.length === 1 ? w : w/3;
					const svgh = data.length === 1 ? h : h/3;
					drawMap({ w: svgw, h: svgh, geodata, circos, id, title });
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
				const { geodata, circos, id, title } = d;
				const svgw = data.length === 1 ? w : w/3;
				const svgh = data.length === 1 ? h : h/3;
				drawMap({ w: svgw, h: svgh, geodata, circos, id, title });
				drawResults();
			});
		});

		const comprendre = menu.select('section.comprendre');
		console.log(resNat)
		const resNatClean = resNat.map(d => { return { key: d['Code localisation'], values: d.clean } });
		resNatClean.forEach(d => {
			d.values.sort((a, b) => spectrePol.indexOf(a.CodNuaCand) - spectrePol.indexOf(b.CodNuaCand));
		});
		comprendre.select('svg').data(resNatClean);

		renderComprendre();

		// AJOUTER LES CIRCOS AU MENU "COMPRENDRE"
		// menu.select('section.comprendre select')
		// .addElems('option', null, geo.features)
		// .attr('value', d => d.properties.code_dpt)
		// .html(d => d.properties.code_dpt)

	}).catch(err => console.log(err));
}

export function processData (kwargs) {
	const { features, votes } = kwargs;

	const geodata = { type: 'FeatureCollection', features };
	const geocodes = features.map(d => d.properties.join_code);

	let circos = nest.call(votes ?? [], { key: 'CodCirElec', keep: [ 'Inscrits', 'Abstentions' ] });
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