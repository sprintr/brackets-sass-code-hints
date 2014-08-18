/*
 * Copyright (c) 2014 Amin Ullah Khan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
	"use strict";

	var AppInit			= brackets.getModule('utils/AppInit'),
		CodeHintManager	= brackets.getModule('editor/CodeHintManager'),
		ExtensionUtils	= brackets.getModule('utils/ExtensionUtils'),
		CSSProperties	= JSON.parse(require('text!CSSProperties.json'));

	// Enums
	var _tSASSParam = 1,
		_tSASSValue = 2;

	var _paramRegex = /^[a-z\-]+$/;

	function SASSCodeHints() {}

	SASSCodeHints.prototype.hasHints = function (editor, implicitChar) {
		this.editor = editor;
		this.initPos = editor.getCursorPos();
		return !!this.getContextInfo(this.initPos);
	};

	SASSCodeHints.prototype.getHints = function (implicitChar) {
		this.currentPos = this.editor.getCursorPos();
		var hints = [], i;
		var context = this.getContextInfo(this.initPos);

		if (context.tokenType === _tSASSParam) {
			for (i in CSSProperties) {
				if (i.indexOf(context.query) === 0) {
					hints.push(i);
				}
			}
			hints.sort();
		} else if (context.tokenType === _tSASSValue) {
			if (!CSSProperties[context.param])
				return false;

			CSSProperties[context.param].values.forEach(function(arg) {
				if (arg.indexOf(context.query) === 0) {
					hints.push(arg);
				}
			});
			hints.sort();
		}

		return {
			hints: hints,
			match: context.query,
			selectInitial: true,
			handleWideResults: false
		};
	};

	SASSCodeHints.prototype.insertHint = function (hint) {
		var context = this.getContextInfo(this.initPos);
		if (context.tokenType === _tSASSParam) {
			hint += ': ';
			if (!!context.query)
				hint = hint.substr(context.query.length);
			this.editor.document.replaceRange(hint, this.currentPos);
			return true;
		} else if (context.tokenType === _tSASSValue) {
			if (!!context.query)
				hint = hint.substr(context.query.length);
			this.editor.document.replaceRange(hint, this.currentPos);
		}
		return false;
	};

	SASSCodeHints.prototype.getContextInfo = function(initPos) {
		var context = {
			tokenType: 0,
			param: '',
			query: ''
		};
		var offset = [];
		var line = this.editor.document.getLine(initPos.line);
		if (!/^\s+/.test(line) && line.length >= 1)
			return false;

		line = line.trim();
		offset[0] = line.indexOf(':');

		// Params
		if (offset[0] === -1 && _paramRegex.test(line)) {
			context.tokenType = _tSASSParam;
			context.query = line;
			return context;
		}

		// Values
		if (offset[0] !== -1 && _paramRegex.test(line.substr(0, offset[0]))) {
			context.tokenType = _tSASSValue;
			context.param = line.substr(0, offset[0]);
			context.query = line.substr(offset[0]+1).trim();
			return context;
		}
		return false;
	};

	AppInit.appReady(function () {
		var sassCodeHints = new SASSCodeHints();
		CodeHintManager.registerHintProvider(sassCodeHints, ['sass']);
		ExtensionUtils.loadStyleSheet(module, 'brackets-css-hints.css');
	});
});