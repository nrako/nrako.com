module.exports=__NEXT_REGISTER_PAGE("/",function(){return{page:webpackJsonp([0],{113:function(e,t,n){e.exports=n(203)},115:function(e,t,n){"use strict";t.__esModule=!0;var r=o(n(217)),s=o(n(218)),i="function"==typeof s.default&&"symbol"==typeof r.default?function(e){return typeof e}:function(e){return e&&"function"==typeof s.default&&e.constructor===s.default&&e!==s.default.prototype?"symbol":typeof e};function o(e){return e&&e.__esModule?e:{default:e}}t.default="function"==typeof s.default&&"symbol"===i(r.default)?function(e){return void 0===e?"undefined":i(e)}:function(e){return e&&"function"==typeof s.default&&e.constructor===s.default&&e!==s.default.prototype?"symbol":void 0===e?"undefined":i(e)}},201:function(e,t,n){e.exports=n(202)},202:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(113),s=n.n(r),i=n(5),o=n.n(i),u=n(226),l=n.n(u),a=function(){return o.a.createElement("div",{className:"jsx-3132726977"},o.a.createElement(l.a,null,o.a.createElement("title",{className:"jsx-3132726977"},"nrako"),o.a.createElement("meta",{name:"viewport",content:"width=device-width, initial-scale=1",className:"jsx-3132726977"})),o.a.createElement(s.a,{styleId:"3132726977",css:["*{margin:0;box-sizing:border-box;}","body{color:#101;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica, Arial,sans-serif;}","a{color:#f00;-webkit-tap-highlight-color:rgba(0,0,0,0);}","a:hover,a:active,a:focus{color:#fff;background:#f00;-webkit-text-decoration:none;text-decoration:none;outline:0;}"]}))},c=function(e){var t=e.children;return[o.a.createElement(a,{key:"meta"}),t]};t.default=function(){return o.a.createElement(c,null,o.a.createElement("div",{className:"jsx-779958953 home"},o.a.createElement("div",{className:"jsx-779958953 bullsEye"},o.a.createElement("h1",{className:"jsx-779958953"},"Nicholas Rakotomihamina"),o.a.createElement("nav",{className:"jsx-779958953"},o.a.createElement("a",{href:"https://twitter.com/nrako",className:"jsx-779958953"},"Twitter"),o.a.createElement("a",{href:"https://github.com/nrako",className:"jsx-779958953"},"Github"),o.a.createElement("a",{href:"/static/GPG.asc",className:"jsx-779958953"},"GPG")))),o.a.createElement(s.a,{styleId:"779958953",css:[".home.jsx-779958953{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-align-items:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;z-index:-1;}",".bullsEye.jsx-779958953{-webkit-flex:none;-ms-flex:none;flex:none;text-align:center;max-width:100%;}","h1.jsx-779958953{font-size:1.2em;font-weight:normal;text-overflow:ellipsis;overflow:hidden;}","nav.jsx-779958953,h1.jsx-779958953{margin:0.5em;}","a.jsx-779958953{display:inline-block;-webkit-text-decoration:none;text-decoration:none;margin:0 1em;padding:0.2em;}"]}))}},203:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=d(n(204)),s=d(n(210)),i=d(n(214)),o=d(n(72)),u=d(n(73)),l=d(n(216)),a=d(n(219));t.flush=function(){var e=f.cssRules();return f.flush(),new r.default(e)};var c=n(5);function d(e){return e&&e.__esModule?e:{default:e}}var f=new(d(n(222)).default),h=function(e){function t(){return(0,o.default)(this,t),(0,l.default)(this,(t.__proto__||(0,i.default)(t)).apply(this,arguments))}return(0,a.default)(t,e),(0,u.default)(t,[{key:"componentWillMount",value:function(){f.add(this.props)}},{key:"shouldComponentUpdate",value:function(e){return this.props.css!==e.css}},{key:"componentWillUpdate",value:function(e){f.update(this.props,e)}},{key:"componentWillUnmount",value:function(){f.remove(this.props)}},{key:"render",value:function(){return null}}],[{key:"dynamic",value:function(e){return e.map(function(e){var t=(0,s.default)(e,2),n=t[0],r=t[1];return f.computeId(n,r)}).join(" ")}}]),t}(c.Component);t.default=h},204:function(e,t,n){e.exports={default:n(205),__esModule:!0}},205:function(e,t,n){n(43),n(17),n(20),n(206),n(207),n(208),n(209),e.exports=n(0).Map},206:function(e,t,n){"use strict";var r=n(101),s=n(69);e.exports=n(102)("Map",function(e){return function(){return e(this,arguments.length>0?arguments[0]:void 0)}},{get:function(e){var t=r.getEntry(s(this,"Map"),e);return t&&t.v},set:function(e,t){return r.def(s(this,"Map"),0===e?0:e,t)}},r,!0)},207:function(e,t,n){var r=n(1);r(r.P+r.R,"Map",{toJSON:n(103)("Map")})},208:function(e,t,n){n(104)("Map")},209:function(e,t,n){n(105)("Map")},210:function(e,t,n){"use strict";t.__esModule=!0;var r=i(n(211)),s=i(n(213));function i(e){return e&&e.__esModule?e:{default:e}}t.default=function(){return function(e,t){if(Array.isArray(e))return e;if((0,r.default)(Object(e)))return function(e,t){var n=[],r=!0,i=!1,o=void 0;try{for(var u,l=(0,s.default)(e);!(r=(u=l.next()).done)&&(n.push(u.value),!t||n.length!==t);r=!0);}catch(e){i=!0,o=e}finally{try{!r&&l.return&&l.return()}finally{if(i)throw o}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}()},211:function(e,t,n){e.exports={default:n(114),__esModule:!0}},213:function(e,t,n){e.exports={default:n(85),__esModule:!0}},214:function(e,t,n){e.exports={default:n(109),__esModule:!0}},215:function(e,t,n){e.exports={default:n(76),__esModule:!0}},216:function(e,t,n){"use strict";t.__esModule=!0;var r,s=n(115),i=(r=s)&&r.__esModule?r:{default:r};t.default=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==(void 0===t?"undefined":(0,i.default)(t))&&"function"!=typeof t?e:t}},217:function(e,t,n){e.exports={default:n(98),__esModule:!0}},218:function(e,t,n){e.exports={default:n(99),__esModule:!0}},219:function(e,t,n){"use strict";t.__esModule=!0;var r=o(n(220)),s=o(n(221)),i=o(n(115));function o(e){return e&&e.__esModule?e:{default:e}}t.default=function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+(void 0===t?"undefined":(0,i.default)(t)));e.prototype=(0,s.default)(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(r.default?(0,r.default)(e,t):e.__proto__=t)}},220:function(e,t,n){e.exports={default:n(111),__esModule:!0}},221:function(e,t,n){e.exports={default:n(112),__esModule:!0}},222:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=l(n(223)),s=l(n(72)),i=l(n(73)),o=l(n(224)),u=l(n(225));function l(e){return e&&e.__esModule?e:{default:e}}var a=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=t.styleSheet,r=void 0===n?null:n,i=t.optimizeForSpeed,o=void 0!==i&&i,l=t.isBrowser,a=void 0===l?"undefined"!=typeof window:l;(0,s.default)(this,e),this._sheet=r||new u.default({name:"styled-jsx",optimizeForSpeed:o}),this._sheet.inject(),r&&"boolean"==typeof o&&(this._sheet.setOptimizeForSpeed(o),this._optimizeForSpeed=this._sheet.isOptimizeForSpeed()),this._isBrowser=a,this._fromServer=void 0,this._indices={},this._instancesCounts={},this.computeId=this.createComputeId(),this.computeSelector=this.createComputeSelector()}return(0,i.default)(e,[{key:"add",value:function(e){var t=this;void 0===this._optimizeForSpeed&&(this._optimizeForSpeed=Array.isArray(e.css),this._sheet.setOptimizeForSpeed(this._optimizeForSpeed),this._optimizeForSpeed=this._sheet.isOptimizeForSpeed()),this._isBrowser&&!this._fromServer&&(this._fromServer=this.selectFromServer(),this._instancesCounts=(0,r.default)(this._fromServer).reduce(function(e,t){return e[t]=0,e},{}));var n=this.getIdAndRules(e),s=n.styleId,i=n.rules;if(s in this._instancesCounts)this._instancesCounts[s]+=1;else{var o=i.map(function(e){return t._sheet.insertRule(e)}).filter(function(e){return-1!==e});o.length>0&&(this._indices[s]=o,this._instancesCounts[s]=1)}}},{key:"remove",value:function(e){var t=this,n=this.getIdAndRules(e).styleId;if(function(e,t){if(!e)throw new Error("StyleSheetRegistry: "+t+".")}(n in this._instancesCounts,"styleId: `"+n+"` not found"),this._instancesCounts[n]-=1,this._instancesCounts[n]<1){var r=this._fromServer&&this._fromServer[n];r?(r.parentNode.removeChild(r),delete this._fromServer[n]):(this._indices[n].forEach(function(e){return t._sheet.deleteRule(e)}),delete this._indices[n]),delete this._instancesCounts[n]}}},{key:"update",value:function(e,t){this.add(t),this.remove(e)}},{key:"flush",value:function(){this._sheet.flush(),this._sheet.inject(),this._fromServer=void 0,this._indices={},this._instancesCounts={},this.computeId=this.createComputeId(),this.computeSelector=this.createComputeSelector()}},{key:"cssRules",value:function(){var e=this,t=this._fromServer?(0,r.default)(this._fromServer).map(function(t){return[t,e._fromServer[t]]}):[],n=this._sheet.cssRules();return t.concat((0,r.default)(this._indices).map(function(t){return[t,e._indices[t].map(function(e){return n[e].cssText}).join("\n")]}))}},{key:"createComputeId",value:function(){var e={};return function(t,n){if(!n)return"jsx-"+t;var r=String(n),s=t+r;return e[s]||(e[s]="jsx-"+(0,o.default)(t+"-"+r)),e[s]}}},{key:"createComputeSelector",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:/__jsx-style-dynamic-selector/g,t={};return function(n,r){this._isBrowser||(r=r.replace(/\/style/gi,"\\/style"));var s=n+r;return t[s]||(t[s]=r.replace(e,n)),t[s]}}},{key:"getIdAndRules",value:function(e){var t=this;if(e.dynamic){var n=this.computeId(e.styleId,e.dynamic);return{styleId:n,rules:Array.isArray(e.css)?e.css.map(function(e){return t.computeSelector(n,e)}):[this.computeSelector(n,e.css)]}}return{styleId:this.computeId(e.styleId),rules:Array.isArray(e.css)?e.css:[e.css]}}},{key:"selectFromServer",value:function(){return Array.prototype.slice.call(document.querySelectorAll('[id^="__jsx-"]')).reduce(function(e,t){return e[t.id.slice(2)]=t,e},{})}}]),e}();t.default=a},223:function(e,t,n){e.exports={default:n(83),__esModule:!0}},224:function(e,t,n){"use strict";e.exports=function(e){for(var t=5381,n=e.length;n;)t=33*t^e.charCodeAt(--n);return t>>>0}},225:function(e,t,n){"use strict";(function(e){Object.defineProperty(t,"__esModule",{value:!0});var r=i(n(72)),s=i(n(73));function i(e){return e&&e.__esModule?e:{default:e}}var o=e.env&&!0,u=function(e){return"[object String]"===Object.prototype.toString.call(e)},l=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=t.name,s=void 0===n?"stylesheet":n,i=t.optimizeForSpeed,l=void 0===i?o:i,c=t.isBrowser,d=void 0===c?"undefined"!=typeof window:c;(0,r.default)(this,e),a(u(s),"`name` must be a string"),this._name=s,this._deletedRulePlaceholder="#"+s+"-deleted-rule____{}",a("boolean"==typeof l,"`optimizeForSpeed` must be a boolean"),this._optimizeForSpeed=l,this._isBrowser=d,this._serverSheet=void 0,this._tags=[],this._injected=!1,this._rulesCount=0}return(0,s.default)(e,[{key:"setOptimizeForSpeed",value:function(e){a("boolean"==typeof e,"`setOptimizeForSpeed` accepts a boolean"),a(0===this._rulesCount,"optimizeForSpeed cannot be when rules have already been inserted"),this.flush(),this._optimizeForSpeed=e,this.inject()}},{key:"isOptimizeForSpeed",value:function(){return this._optimizeForSpeed}},{key:"inject",value:function(){var e=this;if(a(!this._injected,"sheet already injected"),this._injected=!0,this._isBrowser&&this._optimizeForSpeed)return this._tags[0]=this.makeStyleTag(this._name),this._optimizeForSpeed="insertRule"in this.getSheet(),void(this._optimizeForSpeed||(o||console.warn("StyleSheet: optimizeForSpeed mode not supported falling back to standard mode."),this.flush(),this._injected=!0));this._serverSheet={cssRules:[],insertRule:function(t,n){return"number"==typeof n?e._serverSheet.cssRules[n]={cssText:t}:e._serverSheet.cssRules.push({cssText:t}),n},deleteRule:function(t){e._serverSheet.cssRules[t]=null}}}},{key:"getSheetForTag",value:function(e){if(e.sheet)return e.sheet;for(var t=0;t<document.styleSheets.length;t++)if(document.styleSheets[t].ownerNode===e)return document.styleSheets[t]}},{key:"getSheet",value:function(){return this.getSheetForTag(this._tags[this._tags.length-1])}},{key:"insertRule",value:function(e,t){if(a(u(e),"`insertRule` accepts only strings"),!this._isBrowser)return"number"!=typeof t&&(t=this._serverSheet.cssRules.length),this._serverSheet.insertRule(e,t),this._rulesCount++;if(this._optimizeForSpeed){var n=this.getSheet();"number"!=typeof t&&(t=n.cssRules.length);try{n.insertRule(e,t)}catch(t){return o||console.warn("StyleSheet: illegal rule: \n\n"+e+"\n\nSee https://stackoverflow.com/q/20007992 for more info"),-1}}else{var r=this._tags[t];this._tags.push(this.makeStyleTag(this._name,e,r))}return this._rulesCount++}},{key:"replaceRule",value:function(e,t){if(this._optimizeForSpeed||!this._isBrowser){var n=this._isBrowser?this.getSheet():this._serverSheet;if(t.trim()||(t=this._deletedRulePlaceholder),!n.cssRules[e])return e;n.deleteRule(e);try{n.insertRule(t,e)}catch(r){o||console.warn("StyleSheet: illegal rule: \n\n"+t+"\n\nSee https://stackoverflow.com/q/20007992 for more info"),n.insertRule(this._deletedRulePlaceholder,e)}}else{var r=this._tags[e];a(r,"old rule at index `"+e+"` not found"),r.textContent=t}return e}},{key:"deleteRule",value:function(e){if(this._isBrowser)if(this._optimizeForSpeed)this.replaceRule(e,"");else{var t=this._tags[e];a(t,"rule at index `"+e+"` not found"),t.parentNode.removeChild(t),this._tags[e]=null}else this._serverSheet.deleteRule(e)}},{key:"flush",value:function(){this._injected=!1,this._rulesCount=0,this._isBrowser?(this._tags.forEach(function(e){return e&&e.parentNode.removeChild(e)}),this._tags=[]):this._serverSheet.cssRules=[]}},{key:"cssRules",value:function(){var e=this;return this._isBrowser?this._tags.reduce(function(t,n){return n?t=t.concat(e.getSheetForTag(n).cssRules.map(function(t){return t.cssText===e._deletedRulePlaceholder?null:t})):t.push(null),t},[]):this._serverSheet.cssRules}},{key:"makeStyleTag",value:function(e,t,n){t&&a(u(t),"makeStyleTag acceps only strings as second parameter");var r=document.createElement("style");r.type="text/css",r.setAttribute("data-"+e,""),t&&r.appendChild(document.createTextNode(t));var s=document.head||document.getElementsByTagName("head")[0];return n?s.insertBefore(r,n):s.appendChild(r),r}},{key:"length",get:function(){return this._rulesCount}}]),e}();function a(e,t){if(!e)throw new Error("StyleSheet: "+t+".")}t.default=l}).call(t,n(108))},226:function(e,t,n){e.exports=n(116)},72:function(e,t,n){"use strict";t.__esModule=!0,t.default=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}},73:function(e,t,n){"use strict";t.__esModule=!0;var r,s=n(215),i=(r=s)&&r.__esModule?r:{default:r};t.default=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),(0,i.default)(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}()}},[201]).default}});