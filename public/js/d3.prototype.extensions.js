import * as d3_source from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const staticElement = function (_sel, _method, _element, _class) {
	return _sel[typeof _method === 'object' ? _method[0] : _method](_element, typeof _method === 'object' ? _method[1] : null)
		.attr('class', _class)
}
const dynamicElement = function (_sel, _method, _element, _class, _data, _key) { // THIS REPLACES DOMnode
	const node = _sel.selectAll(_class ? `${_element.replace(/xhtml:/g, '')}.${_class.replace(/\s/g, '.')}` : `${_element.replace(/xhtml:/g, '')}`)
		.data(_data ? (typeof _data === 'function' ? d => _data(d) : _data) : d => [d],
		(d, i) => _key ? (typeof _key === 'function' ? _key(d) : d[_key]) : i)
	node.exit().remove()
	return node.enter()
		[typeof _method === 'object' ? _method[0] : _method](_element, typeof _method === 'object' ? _method[1] : null)
		.attr('class', _class ? _class : null)
	.merge(node)
}

d3_source.selection.prototype.insertElem = function (_before, _element, _class) {
	return new staticElement(this, ['insert', _before], _element, _class ? _class : null)
}
d3_source.selection.prototype.insertElems = function (_before, _element, _class, _data, _key) {
	return new dynamicElement(this, ['insert', _before], _element, _class ? _class : null, _data, _key)
}
d3_source.selection.prototype.addElem = function (_element, _class) {
	return new staticElement(this, 'append', _element, _class ? _class : null)
}
d3_source.selection.prototype.addElems = function (_element, _class, _data, _key) {
	return new dynamicElement(this, 'append', _element.trim(), _class ? _class.trim() : null, _data, _key)
}
d3_source.selection.prototype.findAncestor = function (_target) {
	if (!this.node().classList || this.node().nodeName === 'BODY') return null
	if (this.classed(_target) || (this.node().nodeName === _target || this.node().nodeName === _target?.toUpperCase())) return this
	return d3_source.select(this.node().parentNode)?.findAncestor(_target);
}
d3_source.selection.prototype.hasAncestor = function (_target) {
	if (this.node().nodeName === 'BODY') return false
	if (typeof _target === 'string') {
		if (this.classed(_target) || this.node().nodeName === _target?.toUpperCase()) return true
	} else {
		if (this.node() === _target) return true
	}
	return d3_source.select(this.node().parentNode)?.hasAncestor(_target);
}
d3_source.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this)
	})
}
d3_source.selection.prototype.moveToBack = function() { 
	// CREDIT: https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
	return this.each(function() {
		const firstChild = this.parentNode.firstChild
		if (firstChild) {
			this.parentNode.insertBefore(this, firstChild)
		}
	})
}
d3_source.selection.prototype.toggleClass = function (_class) {
	return this.classed(_class, !this.classed(_class))
}
// https://stackoverflow.com/questions/25405359/how-can-i-select-last-child-in-d3-js
d3_source.selection.prototype.last = function() {
	return d3_source.select(this.nodes()[this.size() - 1])
}

export const d3 = d3_source;