(window.webpackJsonp=window.webpackJsonp||[]).push([["00ff"],{"/tz4":function(e,t,n){"use strict";t.__esModule=!0;var a=r(n("q1tI")),o=r(n("acCH"));function r(e){return e&&e.__esModule?e:{default:e}}t.default=a.default.createContext||o.default,e.exports=t.default},"2mcs":function(e,t,n){"use strict";var a=n("ohE5");e.exports=a},"2mql":function(e,t,n){"use strict";var a={childContextTypes:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},o={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},r=Object.defineProperty,s=Object.getOwnPropertyNames,m=Object.getOwnPropertySymbols,c=Object.getOwnPropertyDescriptor,p=Object.getPrototypeOf,l=p&&p(Object);e.exports=function e(t,n,i){if("string"!=typeof n){if(l){var u=p(n);u&&u!==l&&e(t,u,i)}var d=s(n);m&&(d=d.concat(m(n)));for(var f=0;f<d.length;++f){var g=d[f];if(!(a[g]||o[g]||i&&i[g])){var h=c(n,g);try{r(t,g,h)}catch(E){}}}return t}return t}},"4mXO":function(e,t,n){e.exports=n("7TPF")},"6qfE":function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var a=n("RSLW");Object.defineProperty(t,"MDXTag",{enumerable:!0,get:function(){return r(a).default}});var o=n("Fobl");function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"MDXProvider",{enumerable:!0,get:function(){return r(o).default}})},"7TPF":function(e,t,n){n("AUvm"),e.exports=n("WEpk").Object.getOwnPropertySymbols},Fobl:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.withMDXComponents=void 0;var a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},o=m(n("q1tI")),r=m(n("/tz4")),s=m(n("17x9"));function m(e){return e&&e.__esModule?e:{default:e}}var c=(0,r.default)({}),p=c.Provider,l=c.Consumer;t.withMDXComponents=function(e){return function(t){var n=t.components,r=function(e,t){var n={};for(var a in e)t.indexOf(a)>=0||Object.prototype.hasOwnProperty.call(e,a)&&(n[a]=e[a]);return n}(t,["components"]);return o.default.createElement(l,null,function(t){return o.default.createElement(e,a({components:n||t},r))})}};var i=function(e){var t=e.components,n=e.children;return o.default.createElement(p,{value:t},n)};i.propTypes={components:s.default.object.isRequired,children:s.default.element.isRequired},t.default=i},L765:function(e,t,n){"use strict";n.r(t);var a=n("q1tI"),o=n.n(a),r=n("4mXO"),s=n.n(r),m=n("pLtp"),c=n.n(m);function p(e,t){if(null==e)return{};var n,a,o=function(e,t){if(null==e)return{};var n,a,o={},r=c()(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(s.a){var r=s()(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=n("6qfE"),i={title:"Post Style Guide",description:"A complete style guide of post",date:"2018-06-29T20:01:43+0200"},u=function(e){var t=e.components;p(e,["components"]);return o.a.createElement(l.MDXTag,{name:"wrapper",components:t},o.a.createElement(l.MDXTag,{name:"p",components:t},'This is the introduction. If the first child of a post is a paragraph it\'s\nstyle will slightly "elevated", bigger font size etc.'),o.a.createElement(l.MDXTag,{name:"h2",components:t},"Subheader"),o.a.createElement(l.MDXTag,{name:"p",components:t},"Simple Subheader.  Facilisis lectus. Praesent sed mi. Phasellus ipsum. Donec\nquis tellus id lectus faucibus molestie. Praesent vel ligula. Nam venenatis\nneque quis mauris. Proin felis. Cum sociis natoque penatibus et magnis dis\nparturient montes, nascetur ridiculus mus. Aliquam quam. Nam felis velit,\nsemper nec, aliquam nec, iaculis vel, mi. Nullam et augue vitae nunc tristique\nvehicula. Suspendisse eget elit. Duis adipiscing dui non quam."),o.a.createElement(l.MDXTag,{name:"ul",components:t},o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ul"},"First item"),o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ul"},"Second item"),o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ul"},"Third item...")),o.a.createElement(l.MDXTag,{name:"h3",components:t},"Sub-subheader"),o.a.createElement(l.MDXTag,{name:"p",components:t},"Tortor porta mollis. Praesent orci. Cras dignissim vulputate metus."),o.a.createElement(l.MDXTag,{name:"ol",components:t},o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ol"},"One"),o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ol"},"Two"),o.a.createElement(l.MDXTag,{name:"li",components:t,parentName:"ol"},"Tree, It's kind of dangerous to be a emcee")),o.a.createElement(l.MDXTag,{name:"p",components:t},"Phasellus eu quam. Quisque interdum cursus purus. In orci. Maecenas vehicula.\nSed et mauris. Praesent feugiat viverra lacus. Suspendisse pulvinar lacus ut\nnunc. Quisque nisi. Suspendisse id risus nec nisi ultrices ornare. Donec eget\ntellus. Nullam molestie placerat felis. Aenean facilisis. Nunc erat. Integer in\ntellus."),o.a.createElement(l.MDXTag,{name:"h4",components:t},"Sub-sub-subheader"),o.a.createElement(l.MDXTag,{name:"p",components:t},"MDX is a super helpful markdown parser supporting JSX"),o.a.createElement(l.MDXTag,{name:"p",components:t},'Contrary to popular belief, Lorem Ipsum is not simply random text. It has\nroots in a piece of classical Latin literature from 45 BC, making it over\n2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney\nCollege in Virginia, looked up one of the more obscure Latin words,\nconsectetur, from a Lorem Ipsum passage, and going through the cites of the\nword in classical literature, discovered the undoubtable source. Lorem Ipsum\ncomes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum"\n(The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a\ntreatise on the theory of ethics, very popular during the Renaissance. The\nfirst line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line\nin section 1.10.32.'),o.a.createElement(l.MDXTag,{name:"blockquote",components:t},o.a.createElement(l.MDXTag,{name:"p",components:t,parentName:"blockquote"},"de Finibus Bonorum et Malorum")),o.a.createElement(l.MDXTag,{name:"p",components:t},'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below\nfor those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum\net Malorum" by Cicero are also reproduced in their exact original form,\naccompanied by English versions from the 1914 translation by H. Rackham.'),o.a.createElement(l.MDXTag,{name:"pre",components:t},o.a.createElement(l.MDXTag,{name:"code",components:t,parentName:"pre",props:{className:"hljs language-jsx",metaString:""}},o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"import")," Markdown, { meta } ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"from")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},"'./hello.mdx'"),"\n",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"import")," Post, { components } ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"from")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},"'../../components/post'"),"\n\n",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-comment"}},"// Test comment with a line of 80 characters length to see how this fit in here?"),"\n",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"export")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"default")," () => (\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"xml"}},o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-tag"}},"<",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-name"}},"Post")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-attr"}},"meta"),"=",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-string"}},"{meta}"),">"),"\n    "),"<Markdown components={components} />\n  </Post>",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"xml"}},"\n)"))),o.a.createElement(l.MDXTag,{name:"pre",components:t},o.a.createElement(l.MDXTag,{name:"code",components:t,parentName:"pre",props:{className:"hljs language-css",metaString:""}},o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-selector-tag"}},"h1")," {\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-attribute"}},"color"),": red;\n}")),o.a.createElement(l.MDXTag,{name:"p",components:t},"It is a long established fact that a reader will be distracted by the readable\ncontent of a page when looking at its layout. The point of using Lorem Ipsum is\nthat it has a more-or-less normal distribution of letters, as opposed to using\n'Content here, content here', making it look like readable English. Many\ndesktop publishing packages and ",o.a.createElement(l.MDXTag,{name:"a",components:t,parentName:"p",props:{href:"https://localhost/"}},"web page")," editors now use\nLorem Ipsum as their default model text, and a search for 'lorem ipsum' will\nuncover many web sites still in their infancy. Various versions have evolved\nover the years, sometimes by accident, sometimes on purpose (injected humour\nand the like)."),o.a.createElement(l.MDXTag,{name:"pre",components:t},o.a.createElement(l.MDXTag,{name:"code",components:t,parentName:"pre",props:{className:"hljs language-reasonml",metaString:""}},o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-keyword"}},"type")," schoolPerson = Teacher ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-pattern-match"}},"| ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Director")," | ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Student(",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-params"}},"string"),")"),";\n\n",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-keyword"}},"let")," greeting = stranger =>"),"\n  switch (stranger) {\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-pattern-match"}},"| ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Teacher")," =>")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},'"Hey professor!"'),"\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-pattern-match"}},"| ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Director")," =>")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},'"Hello director."'),"\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-pattern-match"}},"| ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Student(",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-string"}},'"Richard"'),")")," =>")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},'"Still here Ricky?"'),"\n  ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-pattern-match"}},"| ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-constructor"}},"Student(",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"span",props:{className:"hljs-params"}},"anyOtherName"),")")," =>")," ",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},'"Hey, "'),o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-operator"}}," ++ "),"anyOtherName",o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-operator"}}," ++ "),o.a.createElement(l.MDXTag,{name:"span",components:t,parentName:"code",props:{className:"hljs-string"}},'"."'),"\n  };")),o.a.createElement(l.MDXTag,{name:"p",components:t},"Run:"),o.a.createElement(l.MDXTag,{name:"blockquote",components:t},o.a.createElement(l.MDXTag,{name:"p",components:t,parentName:"blockquote"},"$ npm run dev")),o.a.createElement(l.MDXTag,{name:"p",components:t},"Some inline ",o.a.createElement(l.MDXTag,{name:"inlineCode",components:t,parentName:"p"},"code .")," in the middle of some text."),o.a.createElement(l.MDXTag,{name:"blockquote",components:t},o.a.createElement(l.MDXTag,{name:"p",components:t,parentName:"blockquote"},o.a.createElement(l.MDXTag,{name:"inlineCode",components:t,parentName:"p"},"Test"))),o.a.createElement(l.MDXTag,{name:"h2",components:t},"Section Divider"),o.a.createElement(l.MDXTag,{name:"p",components:t},"The dominoes bellow are section dividers ",o.a.createElement(l.MDXTag,{name:"inlineCode",components:t,parentName:"p"},"<hr/>")," and ",o.a.createElement(l.MDXTag,{name:"inlineCode",components:t,parentName:"p"},"* * *")," in markdown."),o.a.createElement(l.MDXTag,{name:"hr",components:t}),o.a.createElement(l.MDXTag,{name:"p",components:t},"Every second divier"),o.a.createElement(l.MDXTag,{name:"hr",components:t}),o.a.createElement(l.MDXTag,{name:"p",components:t},"Every third divider"),o.a.createElement(l.MDXTag,{name:"hr",components:t}),o.a.createElement(l.MDXTag,{name:"p",components:t},"Why dominoes? Why not, let's make up some use for these characters."),o.a.createElement(l.MDXTag,{name:"p",components:t},"Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor\nincididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis\nnostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu\nfugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in\nculpa qui officia deserunt mollit anim id est laborum."),o.a.createElement(l.MDXTag,{name:"h4",components:t},"A table which fills the width"),o.a.createElement(l.MDXTag,{name:"table",components:t},o.a.createElement(l.MDXTag,{name:"thead",components:t,parentName:"table"},o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"thead"},o.a.createElement(l.MDXTag,{name:"th",components:t,parentName:"tr",props:{align:null}},"Command"),o.a.createElement(l.MDXTag,{name:"th",components:t,parentName:"tr",props:{align:null}},"Description"),o.a.createElement(l.MDXTag,{name:"th",components:t,parentName:"tr",props:{align:null}},"Description"))),o.a.createElement(l.MDXTag,{name:"tbody",components:t,parentName:"table"},o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git status"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"List all new or modified files"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"List all new or modified files")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git diff"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged kajdlfdsjaldjf"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git commit"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"askldfjl adslkfj asdkljf lkasdfj klasdjf klajsdlfj a adkfjalsjdflak"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git diff"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")))),o.a.createElement(l.MDXTag,{name:"p",components:t},"Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor\nincididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis\nnostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."),o.a.createElement(l.MDXTag,{name:"h4",components:t},"A table which doesn't fill the width"),o.a.createElement(l.MDXTag,{name:"p",components:t},"A table that doesn't fill the width is centered."),o.a.createElement(l.MDXTag,{name:"table",components:t},o.a.createElement(l.MDXTag,{name:"thead",components:t,parentName:"table"},o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"thead"},o.a.createElement(l.MDXTag,{name:"th",components:t,parentName:"tr",props:{align:null}},"Command"),o.a.createElement(l.MDXTag,{name:"th",components:t,parentName:"tr",props:{align:null}},"Description"))),o.a.createElement(l.MDXTag,{name:"tbody",components:t,parentName:"table"},o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git status"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"List all new or modified files")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git diff"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git diff"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")),o.a.createElement(l.MDXTag,{name:"tr",components:t,parentName:"tbody"},o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"git diff"),o.a.createElement(l.MDXTag,{name:"td",components:t,parentName:"tr",props:{align:null}},"Show file differences that haven't been staged")))),o.a.createElement(l.MDXTag,{name:"p",components:t},"The standard chunk of ",o.a.createElement(l.MDXTag,{name:"strong",components:t,parentName:"p"},"Lorem Ipsum"),' used since the 1500s is reproduced below\nfor those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum\net Malorum" by Cicero are also reproduced in their exact original form,\naccompanied by English versions from the 1914 translation by H. Rackham.'),o.a.createElement(l.MDXTag,{name:"p",components:t},'Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum\net Malorum" by Cicero are also reproduced in their exact original form,\naccompanied by English versions from the 1914 translation by H. Rackham.'))},d=n("MX0m"),f=n.n(d),g=n("m/Pd"),h=n.n(g),E=n("CafY"),T=function(e){var t=e.meta,n=e.children;return o.a.createElement(E.a,null,o.a.createElement(h.a,null,o.a.createElement("title",{className:"jsx-450296712"},t.title)),o.a.createElement("article",{className:"jsx-450296712 post"},o.a.createElement("header",{className:"jsx-450296712 post-header"},o.a.createElement("h1",{className:"jsx-450296712"},t.title,o.a.createElement("small",{className:"jsx-450296712"},t.description)),o.a.createElement("time",{dateTime:t.date,className:"jsx-450296712 time"},t.date)),n),o.a.createElement(f.a,{id:"3661228582"},[".post-header.jsx-450296712{border-bottom:1px solid #ddd;text-align:center;padding-bottom:1em;margin-bottom:3em;}",".post-header.jsx-450296712 h1.jsx-450296712{margin-top:1em;margin-bottom:0.25em;font-weight:300;font:2.2em -apple-system-body,georgia,serif;}",".post-header.jsx-450296712 small.jsx-450296712{display:block;font:italic 400 0.5em georgia;}",".time.jsx-450296712{color:#999;font-weight:200;font-size:0.8em;}"]),o.a.createElement(f.a,{id:"1059585383"},[".post>div>p:first-child{font-size:1.25em;}",".post table{margin:2em auto;border-spacing:0.5em 0;font-size:0.75em;}",".post table th,.post table tr:not(:last-child) td{border-bottom:1px solid #ddd;}",".post table th{border-bottom:1px solid #101;}",".post th,.post td{padding:0.5em;}",".post hr{margin:2em auto;border:0;text-align:center;}",".post hr::before{display:inline-block;-webkit-letter-spacing:0.2em;-moz-letter-spacing:0.2em;-ms-letter-spacing:0.2em;letter-spacing:0.2em;font-size:1.8em;}",".post hr:nth-of-type(3n + 1)::before{content:'🁅🁛🀵';}",".post hr:nth-of-type(3n + 2)::before{content:'🁐🁻🁇';-webkit-letter-spacing:0.1em;-moz-letter-spacing:0.1em;-ms-letter-spacing:0.1em;letter-spacing:0.1em;}",".post hr:nth-of-type(3n + 0)::before{content:'🁄🁗🁈';}"]))},b={};t.default=function(){return o.a.createElement(T,{meta:i},o.a.createElement(u,{components:b}))}},RSLW:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},o=function(){function e(e,t){for(var n=0;n<t.length;n++){var a=t[n];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(e,a.key,a)}}return function(t,n,a){return n&&e(t.prototype,n),a&&e(t,a),t}}(),r=n("q1tI"),s=p(r),m=p(n("2mql")),c=n("Fobl");function p(e){return e&&e.__esModule?e:{default:e}}var l={inlineCode:"code",wrapper:"div"},i=function(e){function t(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,r.Component),o(t,[{key:"render",value:function(){var e=this.props,t=e.name,n=e.parentName,o=e.props,r=void 0===o?{}:o,c=e.children,p=e.components,i=void 0===p?{}:p,u=e.Layout,d=e.layoutProps,f=i[n+"."+t]||i[t]||l[t]||t;return u?((0,m.default)(this,u),s.default.createElement(u,a({components:i},d),s.default.createElement(f,r,c))):s.default.createElement(f,r,c)}}]),t}();t.default=(0,c.withMDXComponents)(i)},acCH:function(e,t,n){"use strict";t.__esModule=!0;var a=n("q1tI"),o=(s(a),s(n("17x9"))),r=s(n("fZtv"));s(n("2mcs"));function s(e){return e&&e.__esModule?e:{default:e}}function m(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function c(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function p(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var l=1073741823;t.default=function(e,t){var n,s,i="__create-react-context-"+(0,r.default)()+"__",u=function(e){function n(){var t,a,o,r;m(this,n);for(var s=arguments.length,p=Array(s),l=0;l<s;l++)p[l]=arguments[l];return t=a=c(this,e.call.apply(e,[this].concat(p))),a.emitter=(o=a.props.value,r=[],{on:function(e){r.push(e)},off:function(e){r=r.filter(function(t){return t!==e})},get:function(){return o},set:function(e,t){o=e,r.forEach(function(e){return e(o,t)})}}),c(a,t)}return p(n,e),n.prototype.getChildContext=function(){var e;return(e={})[i]=this.emitter,e},n.prototype.componentWillReceiveProps=function(e){if(this.props.value!==e.value){var n=this.props.value,a=e.value,o=void 0;((r=n)===(s=a)?0!==r||1/r==1/s:r!=r&&s!=s)?o=0:(o="function"==typeof t?t(n,a):l,0!=(o|=0)&&this.emitter.set(e.value,o))}var r,s},n.prototype.render=function(){return this.props.children},n}(a.Component);u.childContextTypes=((n={})[i]=o.default.object.isRequired,n);var d=function(t){function n(){var e,a;m(this,n);for(var o=arguments.length,r=Array(o),s=0;s<o;s++)r[s]=arguments[s];return e=a=c(this,t.call.apply(t,[this].concat(r))),a.state={value:a.getValue()},a.onUpdate=function(e,t){0!=((0|a.observedBits)&t)&&a.setState({value:a.getValue()})},c(a,e)}return p(n,t),n.prototype.componentWillReceiveProps=function(e){var t=e.observedBits;this.observedBits=null==t?l:t},n.prototype.componentDidMount=function(){this.context[i]&&this.context[i].on(this.onUpdate);var e=this.props.observedBits;this.observedBits=null==e?l:e},n.prototype.componentWillUnmount=function(){this.context[i]&&this.context[i].off(this.onUpdate)},n.prototype.getValue=function(){return this.context[i]?this.context[i].get():e},n.prototype.render=function(){return(e=this.props.children,Array.isArray(e)?e[0]:e)(this.state.value);var e},n}(a.Component);return d.contextTypes=((s={})[i]=o.default.object,s),{Provider:u,Consumer:d}},e.exports=t.default},fZtv:function(e,t,n){"use strict";(function(t){var n="__global_unique_id__";e.exports=function(){return t[n]=(t[n]||0)+1}}).call(this,n("yLpj"))},ohE5:function(e,t,n){"use strict";function a(e){return function(){return e}}var o=function(){};o.thatReturns=a,o.thatReturnsFalse=a(!1),o.thatReturnsTrue=a(!0),o.thatReturnsNull=a(null),o.thatReturnsThis=function(){return this},o.thatReturnsArgument=function(e){return e},e.exports=o},vRme:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/posts/_post_style_guide",function(){var e=n("L765");return{page:e.default||e}}])}},[["vRme","5d41","9da1"]]]);