module.exports=__NEXT_REGISTER_PAGE("/",function(){var e=webpackJsonp([0],{111:function(e,t,r){e.exports=r(198)},113:function(e,t,r){"use strict";t.__esModule=true;var n=r(212);var s=a(n);var i=r(213);var o=a(i);var u="function"===typeof o.default&&"symbol"===typeof s.default?function(e){return typeof e}:function(e){return e&&"function"===typeof o.default&&e.constructor===o.default&&e!==o.default.prototype?"symbol":typeof e};function a(e){return e&&e.__esModule?e:{default:e}}t.default="function"===typeof o.default&&"symbol"===u(s.default)?function(e){return"undefined"===typeof e?"undefined":u(e)}:function(e){return e&&"function"===typeof o.default&&e.constructor===o.default&&e!==o.default.prototype?"symbol":"undefined"===typeof e?"undefined":u(e)}},196:function(e,t,r){e.exports=r(197)},197:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:true});var n=r(111);var s=r.n(n);var i=r(7);var o=r.n(i);var u=r(221);var a=r.n(u);var l=function(){return o.a.createElement("div",{className:"jsx-3132726977"},o.a.createElement(a.a,null,o.a.createElement("title",{className:"jsx-3132726977"},"nrako"),o.a.createElement("meta",{name:"viewport",content:"width=device-width, initial-scale=1",className:"jsx-3132726977"})),o.a.createElement(s.a,{styleId:"3132726977",css:["*{margin:0;box-sizing:border-box;}","body{color:#101;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica, Arial,sans-serif;}","a{color:#f00;-webkit-tap-highlight-color:rgba(0,0,0,0);}","a:hover,a:active,a:focus{color:#fff;background:#f00;-webkit-text-decoration:none;text-decoration:none;outline:0;}"]}))};var c=function(e){var t=e.children;return[o.a.createElement(l,{key:"meta"}),t]};var f=t["default"]=function(){return o.a.createElement(c,null,o.a.createElement("div",{className:"jsx-779958953 home"},o.a.createElement("div",{className:"jsx-779958953 bullsEye"},o.a.createElement("h1",{className:"jsx-779958953"},"Nicholas Rakotomihamina"),o.a.createElement("nav",{className:"jsx-779958953"},o.a.createElement("a",{href:"https://twitter.com/nrako",className:"jsx-779958953"},"Twitter"),o.a.createElement("a",{href:"https://github.com/nrako",className:"jsx-779958953"},"Github"),o.a.createElement("a",{href:"/static/GPG.asc",className:"jsx-779958953"},"GPG")))),o.a.createElement(s.a,{styleId:"779958953",css:[".home.jsx-779958953{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-align-items:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;z-index:-1;}",".bullsEye.jsx-779958953{-webkit-flex:none;-ms-flex:none;flex:none;text-align:center;max-width:100%;}","h1.jsx-779958953{font-size:1.2em;font-weight:normal;text-overflow:ellipsis;overflow:hidden;}","nav.jsx-779958953,h1.jsx-779958953{margin:0.5em;}","a.jsx-779958953{display:inline-block;-webkit-text-decoration:none;text-decoration:none;margin:0 1em;padding:0.2em;}"]}))}},198:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:true});var n=r(199);var s=g(n);var i=r(205);var o=g(i);var u=r(209);var a=g(u);var l=r(70);var c=g(l);var f=r(71);var d=g(f);var h=r(211);var p=g(h);var v=r(214);var _=g(v);t.flush=w;var m=r(7);var y=r(217);var S=g(y);function g(e){return e&&e.__esModule?e:{default:e}}var x=new S.default;var b=function(e){(0,_.default)(t,e);function t(){(0,c.default)(this,t);return(0,p.default)(this,(t.__proto__||(0,a.default)(t)).apply(this,arguments))}(0,d.default)(t,[{key:"componentWillMount",value:function e(){x.add(this.props)}},{key:"shouldComponentUpdate",value:function e(t){return this.props.css!==t.css}},{key:"componentWillUpdate",value:function e(t){x.update(this.props,t)}},{key:"componentWillUnmount",value:function e(){x.remove(this.props)}},{key:"render",value:function e(){return null}}],[{key:"dynamic",value:function e(t){return t.map(function(e){var t=(0,o.default)(e,2),r=t[0],n=t[1];return x.computeId(r,n)}).join(" ")}}]);return t}(m.Component);t.default=b;function w(){var e=x.cssRules();x.flush();return new s.default(e)}},199:function(e,t,r){e.exports={default:r(200),__esModule:true}},200:function(e,t,r){r(43);r(17);r(19);r(201);r(202);r(203);r(204);e.exports=r(0).Map},201:function(e,t,r){"use strict";var n=r(100);var s=r(67);var i="Map";e.exports=r(101)(i,function(e){return function t(){return e(this,arguments.length>0?arguments[0]:void 0)}},{get:function e(t){var r=n.getEntry(s(this,i),t);return r&&r.v},set:function e(t,r){return n.def(s(this,i),0===t?0:t,r)}},n,true)},202:function(e,t,r){var n=r(1);n(n.P+n.R,"Map",{toJSON:r(102)("Map")})},203:function(e,t,r){r(103)("Map")},204:function(e,t,r){r(104)("Map")},205:function(e,t,r){"use strict";t.__esModule=true;var n=r(206);var s=u(n);var i=r(208);var o=u(i);function u(e){return e&&e.__esModule?e:{default:e}}t.default=function(){function e(e,t){var r=[];var n=true;var s=false;var i=void 0;try{for(var u=(0,o.default)(e),a;!(n=(a=u.next()).done);n=true){r.push(a.value);if(t&&r.length===t)break}}catch(e){s=true;i=e}finally{try{!n&&u["return"]&&u["return"]()}finally{if(s)throw i}}return r}return function(t,r){if(Array.isArray(t))return t;if((0,s.default)(Object(t)))return e(t,r);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}()},206:function(e,t,r){e.exports={default:r(112),__esModule:true}},208:function(e,t,r){e.exports={default:r(83),__esModule:true}},209:function(e,t,r){e.exports={default:r(108),__esModule:true}},210:function(e,t,r){e.exports={default:r(74),__esModule:true}},211:function(e,t,r){"use strict";t.__esModule=true;var n=r(113);var s=i(n);function i(e){return e&&e.__esModule?e:{default:e}}t.default=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==("undefined"===typeof t?"undefined":(0,s.default)(t))&&"function"!==typeof t?e:t}},212:function(e,t,r){e.exports={default:r(98),__esModule:true}},213:function(e,t,r){e.exports={default:r(99),__esModule:true}},214:function(e,t,r){"use strict";t.__esModule=true;var n=r(215);var s=l(n);var i=r(216);var o=l(i);var u=r(113);var a=l(u);function l(e){return e&&e.__esModule?e:{default:e}}t.default=function(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+("undefined"===typeof t?"undefined":(0,a.default)(t)));e.prototype=(0,o.default)(t&&t.prototype,{constructor:{value:e,enumerable:false,writable:true,configurable:true}});t&&(s.default?(0,s.default)(e,t):e.__proto__=t)}},215:function(e,t,r){e.exports={default:r(109),__esModule:true}},216:function(e,t,r){e.exports={default:r(110),__esModule:true}},217:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:true});var n=r(218);var s=h(n);var i=r(70);var o=h(i);var u=r(71);var a=h(u);var l=r(219);var c=h(l);var f=r(220);var d=h(f);function h(e){return e&&e.__esModule?e:{default:e}}var p=function e(t){return t.replace(/\/style/gi,"\\/style")};var v=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=t.styleSheet,n=void 0===r?null:r,s=t.optimizeForSpeed,i=void 0!==s&&s,u=t.isBrowser,a=void 0===u?"undefined"!==typeof window:u;(0,o.default)(this,e);this._sheet=n||new d.default({name:"styled-jsx",optimizeForSpeed:i});this._sheet.inject();if(n&&"boolean"===typeof i){this._sheet.setOptimizeForSpeed(i);this._optimizeForSpeed=this._sheet.isOptimizeForSpeed()}this._isBrowser=a;this._fromServer=void 0;this._indices={};this._instancesCounts={};this.computeId=this.createComputeId();this.computeSelector=this.createComputeSelector()}(0,a.default)(e,[{key:"add",value:function e(t){var r=this;if(void 0===this._optimizeForSpeed){this._optimizeForSpeed=Array.isArray(t.css);this._sheet.setOptimizeForSpeed(this._optimizeForSpeed);this._optimizeForSpeed=this._sheet.isOptimizeForSpeed()}if(this._isBrowser&&!this._fromServer){this._fromServer=this.selectFromServer();this._instancesCounts=(0,s.default)(this._fromServer).reduce(function(e,t){e[t]=0;return e},{})}var n=this.getIdAndRules(t),i=n.styleId,o=n.rules;if(i in this._instancesCounts){this._instancesCounts[i]+=1;return}var u=o.map(function(e){return r._sheet.insertRule(e)}).filter(function(e){return-1!==e});if(u.length>0){this._indices[i]=u;this._instancesCounts[i]=1}}},{key:"remove",value:function e(t){var r=this;var n=this.getIdAndRules(t),s=n.styleId;_(s in this._instancesCounts,"styleId: `"+s+"` not found");this._instancesCounts[s]-=1;if(this._instancesCounts[s]<1){var i=this._fromServer&&this._fromServer[s];if(i){i.parentNode.removeChild(i);delete this._fromServer[s]}else{this._indices[s].forEach(function(e){return r._sheet.deleteRule(e)});delete this._indices[s]}delete this._instancesCounts[s]}}},{key:"update",value:function e(t,r){this.add(r);this.remove(t)}},{key:"flush",value:function e(){this._sheet.flush();this._sheet.inject();this._fromServer=void 0;this._indices={};this._instancesCounts={};this.computeId=this.createComputeId();this.computeSelector=this.createComputeSelector()}},{key:"cssRules",value:function e(){var t=this;var r=this._fromServer?(0,s.default)(this._fromServer).map(function(e){return[e,t._fromServer[e]]}):[];var e=this._sheet.cssRules();return r.concat((0,s.default)(this._indices).map(function(r){return[r,t._indices[r].map(function(t){return e[t].cssText}).join("\n")]}))}},{key:"createComputeId",value:function e(){var t={};return function(e,r){if(!r)return"jsx-"+e;var n=String(r);var s=e+n;t[s]||(t[s]="jsx-"+(0,c.default)(e+"-"+n));return t[s]}}},{key:"createComputeSelector",value:function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:/__jsx-style-dynamic-selector/g;var r={};return function(e,n){this._isBrowser||(n=p(n));var s=e+n;r[s]||(r[s]=n.replace(t,e));return r[s]}}},{key:"getIdAndRules",value:function e(t){var r=this;if(t.dynamic){var n=this.computeId(t.styleId,t.dynamic);return{styleId:n,rules:Array.isArray(t.css)?t.css.map(function(e){return r.computeSelector(n,e)}):[this.computeSelector(n,t.css)]}}return{styleId:this.computeId(t.styleId),rules:Array.isArray(t.css)?t.css:[t.css]}}},{key:"selectFromServer",value:function e(){var t=Array.prototype.slice.call(document.querySelectorAll('[id^="__jsx-"]'));return t.reduce(function(e,t){var r=t.id.slice(2);e[r]=t;return e},{})}}]);return e}();t.default=v;function _(e,t){if(!e)throw new Error("StyleSheetRegistry: "+t+".")}},218:function(e,t,r){e.exports={default:r(81),__esModule:true}},219:function(e,t,r){"use strict";function n(e){var t=5381,r=e.length;while(r)t=33*t^e.charCodeAt(--r);return t>>>0}e.exports=n},220:function(e,t,r){"use strict";(function(e){Object.defineProperty(t,"__esModule",{value:true});var n=r(70);var s=u(n);var i=r(71);var o=u(i);function u(e){return e&&e.__esModule?e:{default:e}}var a=e.env&&true;var l=function e(t){return"[object String]"===Object.prototype.toString.call(t)};var c=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=t.name,n=void 0===r?"stylesheet":r,i=t.optimizeForSpeed,o=void 0===i?a:i,u=t.isBrowser,c=void 0===u?"undefined"!==typeof window:u;(0,s.default)(this,e);f(l(n),"`name` must be a string");this._name=n;this._deletedRulePlaceholder="#"+n+"-deleted-rule____{}";f("boolean"===typeof o,"`optimizeForSpeed` must be a boolean");this._optimizeForSpeed=o;this._isBrowser=c;this._serverSheet=void 0;this._tags=[];this._injected=false;this._rulesCount=0}(0,o.default)(e,[{key:"setOptimizeForSpeed",value:function e(t){f("boolean"===typeof t,"`setOptimizeForSpeed` accepts a boolean");f(0===this._rulesCount,"optimizeForSpeed cannot be when rules have already been inserted");this.flush();this._optimizeForSpeed=t;this.inject()}},{key:"isOptimizeForSpeed",value:function e(){return this._optimizeForSpeed}},{key:"inject",value:function e(){var t=this;f(!this._injected,"sheet already injected");this._injected=true;if(this._isBrowser&&this._optimizeForSpeed){this._tags[0]=this.makeStyleTag(this._name);this._optimizeForSpeed="insertRule"in this.getSheet();if(!this._optimizeForSpeed){a||console.warn("StyleSheet: optimizeForSpeed mode not supported falling back to standard mode.");this.flush();this._injected=true}return}this._serverSheet={cssRules:[],insertRule:function e(r,n){"number"===typeof n?t._serverSheet.cssRules[n]={cssText:r}:t._serverSheet.cssRules.push({cssText:r});return n},deleteRule:function e(r){t._serverSheet.cssRules[r]=null}}}},{key:"getSheetForTag",value:function e(t){if(t.sheet)return t.sheet;for(var r=0;r<document.styleSheets.length;r++)if(document.styleSheets[r].ownerNode===t)return document.styleSheets[r]}},{key:"getSheet",value:function e(){return this.getSheetForTag(this._tags[this._tags.length-1])}},{key:"insertRule",value:function e(t,r){f(l(t),"`insertRule` accepts only strings");if(!this._isBrowser){"number"!==typeof r&&(r=this._serverSheet.cssRules.length);this._serverSheet.insertRule(t,r);return this._rulesCount++}if(this._optimizeForSpeed){var n=this.getSheet();"number"!==typeof r&&(r=n.cssRules.length);try{n.insertRule(t,r)}catch(e){a||console.warn("StyleSheet: illegal rule: \n\n"+t+"\n\nSee https://stackoverflow.com/q/20007992 for more info");return-1}}else{var s=this._tags[r];this._tags.push(this.makeStyleTag(this._name,t,s))}return this._rulesCount++}},{key:"replaceRule",value:function e(t,r){if(this._optimizeForSpeed||!this._isBrowser){var n=this._isBrowser?this.getSheet():this._serverSheet;r.trim()||(r=this._deletedRulePlaceholder);if(!n.cssRules[t])return t;n.deleteRule(t);try{n.insertRule(r,t)}catch(e){a||console.warn("StyleSheet: illegal rule: \n\n"+r+"\n\nSee https://stackoverflow.com/q/20007992 for more info");n.insertRule(this._deletedRulePlaceholder,t)}}else{var s=this._tags[t];f(s,"old rule at index `"+t+"` not found");s.textContent=r}return t}},{key:"deleteRule",value:function e(t){if(!this._isBrowser){this._serverSheet.deleteRule(t);return}if(this._optimizeForSpeed)this.replaceRule(t,"");else{var r=this._tags[t];f(r,"rule at index `"+t+"` not found");r.parentNode.removeChild(r);this._tags[t]=null}}},{key:"flush",value:function e(){this._injected=false;this._rulesCount=0;if(this._isBrowser){this._tags.forEach(function(e){return e&&e.parentNode.removeChild(e)});this._tags=[]}else this._serverSheet.cssRules=[]}},{key:"cssRules",value:function e(){var t=this;if(!this._isBrowser)return this._serverSheet.cssRules;return this._tags.reduce(function(e,r){r?e=e.concat(t.getSheetForTag(r).cssRules.map(function(e){return e.cssText===t._deletedRulePlaceholder?null:e})):e.push(null);return e},[])}},{key:"makeStyleTag",value:function e(t,r,n){r&&f(l(r),"makeStyleTag acceps only strings as second parameter");var s=document.createElement("style");s.type="text/css";s.setAttribute("data-"+t,"");r&&s.appendChild(document.createTextNode(r));var i=document.head||document.getElementsByTagName("head")[0];n?i.insertBefore(s,n):i.appendChild(s);return s}},{key:"length",get:function e(){return this._rulesCount}}]);return e}();t.default=c;function f(e,t){if(!e)throw new Error("StyleSheet: "+t+".")}}).call(t,r(107))},221:function(e,t,r){e.exports=r(114)},70:function(e,t,r){"use strict";t.__esModule=true;t.default=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}},71:function(e,t,r){"use strict";t.__esModule=true;var n=r(210);var s=i(n);function i(e){return e&&e.__esModule?e:{default:e}}t.default=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||false;n.configurable=true;"value"in n&&(n.writable=true);(0,s.default)(e,n.key,n)}}return function(t,r,n){r&&e(t.prototype,r);n&&e(t,n);return t}}()}},[196]);return{page:e.default}});