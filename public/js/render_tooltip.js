import { useColor, spectrePol } from './render_points.js';
import { partis } from './partis.js';
import { nest } from './helpers.js';
import { d3 } from './d3.prototype.extensions.js';

export function renderTooltip (kwargs) {
	const { circo, w, h } = kwargs;
	const sel = d3.select(this);
	// const { x: posx, y: posy, width, height } = this.getBBox();
	// const centroid = [ posx + width / 2, posy + height / 2 ];
	
	// let anchorX = 'c'
	// if (centroid[0] > w * 3/4) anchorX = 'r';
	// else if (centroid[0] < w * 1/4) anchorX = 'l';
	// let anchorY = 't'
	// if (centroid[1] < h / 2) anchorY = 'b'
	// const anchor = `${anchorY}-${anchorX}`;

	

	// const twidth = 400;
	// const theight = 300;

	// const svg = sel.findAncestor('svg');
	// renderComprendre(circo);

}

export function renderComprendre (circo) {
	const padding = 25;
	const colors = d3.scaleSequential(d3.interpolateSpectral);

	const menu = d3.select('#menu');
	
	if (!menu.select('nav ul li.comprendre').classed('active')) return null

	// menu.selectAll('.active').classed('active', false);
	// menu.selectAll('.comprendre').classed('active', true);
	const section = menu.select('section.active');

	const svg = section.select('svg');
	const { clientWidth, offsetWidth, clientHeight, offsetHeight } = svg.node();
	const twidth = clientWidth || offsetWidth;
	const theight = clientHeight || offsetHeight;

	if (!circo) circo = svg.datum();

	const toolitp = svg.addElems('g', 'tooltip')
		/*.attr('transform', _ => {
			if (anchor === 't-c') return `translate(${[centroid[0] - twidth / 2, posy - theight - padding]})`;
			else if (anchor === 't-l') return `translate(${[Math.max(posx, padding), posy - theight - padding]})`;
			else if (anchor === 't-r') return `translate(${[Math.min(posx + width - twidth, w - padding), posy - theight - padding]})`;

			else if (anchor === 'b-c') return `translate(${[centroid[0] - twidth / 2, posy + height + padding]})`;
			else if (anchor === 'b-l') return `translate(${[Math.max(posx, padding), posy + height + padding]})`;
			else if (anchor === 'b-r') return `translate(${[Math.min(posx + width - twidth, w - padding), posy + height + padding]})`;
		});*/

	toolitp.addElems('rect', 'bg')
		.attr('width', twidth)
		.attr('height', theight)
		.style('fill', 'rgba(255,255,255,1)')
		.style('stroke', '#636363');

	toolitp.addElems('text', 'nom-circo', [circo])
		.attr('x', padding)
		.attr('y', padding)
		// .attr('dy', '1em')
		.style('font-weight', 'bold')
		.style('font-size', '12px')
		.html(d => {
			if (d.key === 'FE') return 'RÉSULTATS NATIONAUX';
			else {
				const { nom_dpt, code_dpt, num_circ } = d.geoCirco?.properties || {};
				if (nom_dpt) return `${nom_dpt} (${code_dpt}) <tspan style='font-weight: normal'>- ${num_circ}${num_circ === 1 ? 'ère' : 'e'} circonscription</tspan>`
				else return null;
			}
		})
	
	const x = d3.scalePoint(spectrePol, [padding, twidth - padding]);
	const y = d3.scaleLinear([0, 50], [theight * 2/3, padding]);
	// const y = d3.scaleLinear([0, Math.max(...circo.values.map(d => d.score))], [theight * 2/3 - padding, padding]);
	
	const orientations = nest.call(partis, { key: 'orientation' })
	orientations.forEach(d => {
		d.values.forEach(c => {
			c.count = d.count;
		});
	});
	// const circo_partis = toolitp.addElems('g', 'circo-partis', [spectrePol])
	const circo_partis = toolitp.addElems('g', 'circo-partis', orientations)
	const circo_votes = toolitp.addElems('g', 'circo-votes', [circo])
	const circo_elus = toolitp.addElems('g', 'circo-elus',  _ => {
		let { values, ...data } = circo;
		data.values = values.filter(c => c.Elu !== 'NON');
		return [data];
	})

	circo_partis.addElems('circle', 'parti', d => d.values)
		.attr('cx', d => x(d.abbv))
		.attr('cy', theight * 2/3)
		.attr('r', 2)
		.style('fill', d => {
			if (circo.values.some(c => c.CodNuaCand === d.abbv)) return '#000';
			else return '#ACACAC';
		});
	circo_partis.addElems('text', 'nom', d => d.values)
		.attr('x', (d, i) => {
			if (i === 0) return x(d.abbv) - 2;
			else if (i === d.count - 1) return x(d.abbv) + 2;
			else return x(d.abbv);
		})
		.attr('y', theight * 2/3)
		.attr('dy', (d, i) => {
			return i % 2 === 0 ? '1.5em' : '3em'
		})
		.style('text-anchor', (d, i) => {
			if (i === 0) return 'start';
			else if (i === d.count - 1) return 'end';
			else return 'middle';
		})
		.style('fill', d => {
			if (circo.values.some(c => c.CodNuaCand === d.abbv)) return '#000';
			else return '#ACACAC';
		})
		.style('font-size', '9px')
		.style('font-weight', d => {
			if (circo.values.some(c => c.CodNuaCand === d.abbv && c.Elu !== 'NON')) return 'bold';
			else return 'normal';
		}).text(d => d.abbv);

	circo_partis.addElems('line', 'separateur', d => {
		if (d.key !== orientations[orientations.length - 1].key) return [d]
		else return []
	}).attr('x1', d => {
			const px = x(d.values[d.values.length - 1].abbv);
			const dx = x(d.values[d.values.length - 1].abbv) - x(d.values[d.values.length - 2].abbv);
			return px + dx / 2;
		})
		.attr('x2', d => {
			const px = x(d.values[d.values.length - 1].abbv);
			const dx = x(d.values[d.values.length - 1].abbv) - x(d.values[d.values.length - 2].abbv);
			return px + dx / 2;
		})
		.attr('y1', theight * 2/3)
		.attr('y2', theight - padding + 9)
		.style('stroke', '#ACACAC')
		.style('stroke-dasharray', '1px 3px');

	circo_partis.addElems('text', 'orientation')
		.attr('x', d => d3.mean(d.values, c => x(c.abbv)))
		.attr('y', theight - padding + 9)
		.style('text-anchor', 'middle')
		.style('font-size', '9px')
		.text(d => {
			if (d.key.length > 10) return `${d.key.slice(0, 10)}…`;
			else return d.key;
		})

	circo_votes.addElems('path', 'balance')
		.attr('d', d => {
			return `M${d.values.map(c => `${x(c.CodNuaCand)},${y(c.score)}`).join(' L')}`;
		}).style('stroke', '#ACACAC')
		.style('fill', 'none');

	circo_votes.addElems('circle', 'parti', d => d.values)
		.attr('r', 2)
		.attr('cx', d => x(d.CodNuaCand))
		.attr('cy', d => y(d.score))
		.style('fill', '#ACACAC');

	circo_votes.addElems('line', 'grid-line', d => d.values)
		.attr('x1', d => x(d.CodNuaCand))
		.attr('x2', d => x(d.CodNuaCand))
		.attr('y1', d => y(d.score))
		.attr('y2', theight * 2/3)
		.style('stroke', '#ACACAC')
		.style('stroke-dasharray', '1px 3px');

	circo_elus.addElems('path', 'balance', d => d.key !== 'FE' ? [d] : [])
	.attr('d', d => {
			return `M${d.values.map(c => `${x(c.CodNuaCand)},${y(c.score)}`).join(' L')}`;
		}).style('stroke', '#000')
		.style('stroke-dasharray', '1, 3')
		.style('fill', 'none');

	circo_elus.addElems('path', 'balance-maintenu', d => d.key !== 'FE' ? [d] : [])
	.attr('d', d => {
			const values = d.values.filter(c => c.maintenu === true).map(c => `${x(c.CodNuaCand)},${y(c.score)}`);
			if (values.length) return `M${values.join(' L')}`;
			else return null;
		}).style('stroke', '#000')
		.style('fill', 'none');

	circo_elus.addElems('circle', 'parti', d => d.values.filter(c => c.maintenu === true || ['OUI', 'NON'].includes(c.Elu)))
		.attr('r', 2)
		.attr('cx', d => x(d.CodNuaCand))
		.attr('cy', d => y(d.score))
		.style('fill', d => {
			if (useColor) {
				return colors(spectrePol.indexOf(d.CodNuaCand) / spectrePol.length);
			} else {
				return '#000';
			}
		});

	circo_elus.addElems('g', 'parti-retire', d => d.values.filter(c => c.maintenu === false && !['OUI', 'NON'].includes(c.Elu)))
		.attr('transform', d => `translate(${[ x(d.CodNuaCand), y(d.score) ]})`)
	.addElems('line', null, [ { x1: -3, y1: -3, x2: 3, y2: 3 }, { x1: -3, y1: 3, x2: 3, y2: -3 } ])
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

	circo_elus.addElems('text', 'score', d => d.key !== 'FE' ? d.values : d.values.filter(c => c.score > 5))
		.attr('x', d => x(d.CodNuaCand))
		.attr('y', d => y(d.score))
		.attr('dy', '-1em')
		.style('fill', d => {
			if (useColor) {
				return colors(spectrePol.indexOf(d.CodNuaCand) / spectrePol.length);
			} else {
				return '#000';
			}
		}).style('text-anchor', 'middle')
		.style('font-size', '9px')
		.text(d => `${d.score}%`);

	const li = section.addElems('ul', 'bullets', orientations)
		.attr('data-label', d => d.key)
	.addElems('li', 'candidat', d => {
		return d.values.map(d => {
			const candidats = circo.values.filter(c => c.CodNuaCand === d.abbv);
			if (candidats.length) return candidats.map(c => {
				const obj = {}
				obj.CodCirElec = c.CodCirElec;
				obj.CodNuaCand = d.abbv;
				obj.candidat = true;
				obj.CivilitePsn = c.CivilitePsn;
				obj.NomPsn = c.NomPsn;
				obj.score = c.score;
				obj.Elu = c.Elu;
				obj.maintenu = c.maintenu
				return obj
			});
			else return [ { CodNuaCand: d.abbv, candidat: false, Elu: 'NON', maintenu: false } ]
		}).flat();

		return circo.values
	}).classed('sans-candidat', d => !d.candidat && d.CodCirElec !== 'FE')
		.classed('elu', d => (d.Elu !== 'NON' && d.CodCirElec !== 'FE') || (d.CodCirElec === 'FE' && d.score > 5))
		
	li.addElems('div', 'bar')
		.style('transform', d => `scaleX(${Math.min((d.score ?? 0) / 50, 1)})`);

	li.addElems('label')
		.html(d => {
			if (d.candidat && d.CodCirElec !== 'FE') {
				if (['OUI', 'NON'].includes(d.Elu) || (d.Elu !== 'NON' && d.maintenu)) return `${d.CodNuaCand} - ${d.CivilitePsn} ${d.NomPsn} - ${d.score}%`;
				else return `<s>${d.CodNuaCand} - ${d.CivilitePsn} ${d.NomPsn} - ${d.score}%</s> (désisté.e)`;
			} else if (d.CodCirElec === 'FE') {
				return `${d.CodNuaCand} - ${d.score}%`;
			} else return `${d.CodNuaCand}`;
		});
}