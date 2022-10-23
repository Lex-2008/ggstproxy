display_url=decodeURI(location.href.substr(location.origin.length+1).replace('/','://'));
display_proto=display_url.split(':')[0];
display_host=display_url.split('/')[2];
if(!display_host) location.href=location.origin+'/gemini/alexey.shpakovsky.ru/startpage.gmi';
// home.href=url2proxyURL('/');
home.href=url2proxyURL(`${display_proto}://${display_host}/`);
// up.href=(url2proxyURL('.')==url2proxyURL(display_url))?url2proxyURL('..'):url2proxyURL('.');
up.href=url2proxyURL('.');
if(up.href==location.href) up.href=url2proxyURL('..');
if(up.href==home.href) up.parentNode.style.display='none';
if(display_proto=='gopher') up.href=up.href.replace(/\/[0-9a-zA-Z]\//,'/1/')
url.value=display_url;
contentType='';
parts={};
loadStart=window.performance.now();


function url2proxyURL(url){
	const abs_url=new URL(url, display_url).href;
	const proto=abs_url.substr(0,abs_url.indexOf(':'));
	if(proto=='gemini' || proto=='spartan' || proto=='gopher' || proto=='titan') {
		return location.origin+'/'+abs_url.replace('://','/');
	} else {
		return abs_url;
	}
}

function go(){
	location=url2proxyURL(url.value);
}

function url2proxyAPIURL(url){
	const abs_url=new URL(url, display_url).href;
	return location.origin+'/cgi-bin/'+abs_url.replace('://','/');
}

if(display_proto == 'titan'){
	xhr={
		getResponseHeader:function(h){
			if(h=="Date") return Date.now();
			if(h=="Response-Code") return '20';
			if(h=="Content-Type") return 'text/gemini';
		},
		responseText:'',
		send:function(){ xhr_onload(); edit_show(); },
	}
} else {
	xhr = new XMLHttpRequest();
	xhr.open('GET', url2proxyAPIURL(display_url));
}

function gmititle(tokens){
	var title='';
	var minlevel=9;
	for (var i=0; i<Math.min(5, tokens.length); i++){
		if(tokens[i].type!='header') continue;
		if(tokens[i].level>=minlevel) continue;
		minlevel=tokens[i].level;
		title=tokens[i].content;
		if(minlevel==1) break;
	}
	return title;
}

function taglink(token){
	token.href=url2proxyURL(token.href);
	if(token.href.startsWith(home.href)){
		token.className='local';
	} else if(token.href.startsWith(location.origin+'/'+display_proto+'/')){
		token.className='external';
	} else if(token.href.startsWith(location.origin+'/')){
		token.className='proxy';
	} else if(token.href.startsWith('http')){
		token.className='http';
	} else if(token.href.startsWith('mail')){
		token.className='mail';
	} else
		token.className='proto';
}

function gmi2html(text){
	const tokens = parse(text);
	console.log(tokens);
	document.title=gmititle(tokens)+' - GGST Proxy';
	// TODO: link styles: internal/external/http/other-protos
	tokens.forEach(t=>{if(t.type=="link")taglink(t)});
	const html = render(tokens);
	return html;
}

function gophermap2html(text){
	// based on https://gitlab.com/fosslinux/g2h/-/blob/master/g2h.py
	const lines = text.split(/\r?\n/)
	const tokens = lines.map(line=>{
		if(line[0]=='i') return { type: 'text', content: line.substr(1).split('\t')[0] };
		if(line.indexOf('\t')<0) return { type: 'text', content: line };
		const ls=line.split('\t');
		// [type]title url host port
		// hFlask-Gopher Github page	URL:https://github.com/michael-lazar/flask-gopher	mozz.us	7005
		if(ls[3]=='70'){ls[3]=''}else{ls[3]=':'+ls[3]}
		if(ls[0][0]=='h' && ls[1].substr(0,4)=='URL:') {
			href=ls[1].substr(4);
		} else {
			href=url2proxyURL(`gopher://${ls[2]}${ls[3]}/${ls[0][0]}${ls[1]}`);
		}
		if(ls[0][0]=='7') {
			return { type: 'prompt', content: ls[0].substr(1), href };
		}
		return { type: 'link', content: ls[0].substr(1), href };
	});
	tokens.forEach(t=>{if(t.type=="link")taglink(t)});
	console.log(tokens);
	const html = render(tokens);
	return html;
}

function txt2html(text){
	text=htmlEscape(text);
	text=text.replace(/([a-z]+:\/\/\S*)/g,function(url){
		return `<a href="${url2proxyURL(url)}">${url}</a>`
		})
	return `<input type="checkbox" id="wrap"><label for="wrap">wrap long lines</label><hr><pre>${text}</pre>`;
}

function showParts(){
	footer.innerHTML=htmlEscape`${contentType}; ${Object.entries(parts).map(x=>x.join('=')).join('; ')}`;
	document.body.parentNode.lang=parts.lang || 'en';
	if(contentType=='text/gophermap') {main.className='gopher'}
	if(display_proto=='gemini' && contentType.startsWith('text/')) {editshow.style.display=''}
	showAgo();
	setInterval(showAgo,1000);
}

function showAgo(){
	ago.innerText=secToText(((new Date())-(new Date(xhr.getResponseHeader("Date"))))/1000);
	if(ago.innerText) ago.innerText+=' ago';
	}

// c https://gist.github.com/joni/3760795?permalink_comment_id=1299119#gistcomment-1299119
function fromUTF8Array(data) { // array of bytes
	var str = '';
	for (var i = 0; i < data.length; i++) {
		var value = data[i];
		if (value < 0x80) {
			str += String.fromCharCode(value);
		} else if (value > 0xBF && value < 0xE0) {
			str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F);
			i += 1;
		} else if (value > 0xDF && value < 0xF0) {
			str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F);
			i += 2;
		} else {
			// surrogate pair
			var charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000;
			str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
			i += 3;
		}
	}
	return str;
}

function xhr_onload() {
	editdiv.style.display='none';
	main.style.display='';
	  // console.log(`loaded: ${xhr.status} type: ${xhr.responseType}`);
	  switch(xhr.getResponseHeader("Response-Code")){
		  case '1':
		  case '10':
			  contentType='text/gemini';
			  var meta=fromUTF8Array(xhr.getResponseHeader("Meta").split('').map(x=>x.charCodeAt(0)));
			  main.innerHTML=gmi2html(`=: ${display_url} ${meta}`);
			  break;
		  case '2':
		  case '20':
		  case 'go-ok':
			  contentType=xhr.getResponseHeader("Content-Type");
			  var _parts=contentType.split(';');
			  contentType=_parts.shift().trim();
			  parts={};
			  _parts.forEach(p=>{
					  const l=p.split('=').map(x=>x.trim());
					  if(l.length==2){
						  parts[l[0]]=l[1];
					  }
					  });
			  // if(!parts.lang){parts.lang='en'};
			  parts.size=formatBytes(xhr.responseText.length);
			  parts.time=(window.performance.now()-loadStart)/1000+' sec';
			  showParts();
			  switch(contentType){
				  case 'text/gemini':
					  src.innerHTML=htmlEscape(xhr.responseText);
					  main.innerHTML=gmi2html(xhr.responseText);
					  break;
				  case 'text/gophermap':
					  src.innerHTML=htmlEscape(xhr.responseText);
					  main.innerHTML=gophermap2html(xhr.responseText);
					  break;
				  case contentType.match(/^text\//)?.input:
					  src.innerHTML=htmlEscape(xhr.responseText);
					  main.innerHTML=txt2html(xhr.responseText);
					  break;
				  case contentType.match(/^image\//)?.input:
					  main.innerHTML=`<a href="${url2proxyAPIURL(display_url)}"><img src="${url2proxyAPIURL(display_url)}"><br><center>open fullscreen</a></center>`;
					  break;
				  default:
					  main.innerHTML=htmlEscape`unknown content-type: [${contentType}]. <a href="${url2proxyAPIURL(display_url)}">Download</a>`;
			  }
			  break;
		  case '3':
		  case '30':
		  case '31':
		  case '32':
			  const dest=xhr.getResponseHeader("Meta");
			  if(display_url[-1]!='/' && dest==display_url+'/'){
				  location.replace(url2proxyURL(dest));
			  }
			  main.innerHTML=`Page redirects you to: <a href="${url2proxyURL(dest)}">${dest}</a>`;
			  break;
		  default:
			  main.innerHTML=htmlEscape`unknown response code: [${xhr.getResponseHeader("Response-Code")} ${xhr.getResponseHeader("Meta")}]`;
	  }
};

xhr.onload = xhr_onload;

// c https://www.codegrepper.com/code-examples/javascript/javascript+bytes+to+human+readable+size
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

xhr.onprogress = function(event) {
	  // if(xhr.readyState>=4) return;
	  console.log(`onprogress: ${xhr.readyState}`);
	  footer.innerText=`state ${xhr.readyState}, loading: ${formatBytes(event.loaded)}`;
};

xhr.onreadystatechange = function() {
	  console.log(`onreadystatechange: ${xhr.readyState}`);
};

xhr.send();

let fav = new XMLHttpRequest();
fav.open('GET', url2proxyAPIURL('/favicon.txt'));
fav.onload = function() {
	  if(['20','2'].indexOf(fav.getResponseHeader("Response-Code"))<0) return;
	  // console.log('favicon length:', fav.responseText.length);
	  // console.log('favicon is ['+fav.responseText+']');
	  // console.log('escaped ['+htmlEscape(fav.responseText)+']');
	  if(fav.responseText.length<1) return;
	  if(fav.responseText.length>10) return;
	  favicon.href=encodeURI(decodeURI(favicon.href).replace('♊',
		  htmlEscape(fav.responseText)));
	  home.innerHTML=htmlEscape(fav.responseText);
	  }
fav.send();

function show_src(){
	if(src.style.display=='none'){
		main.style.display='none';
		editdiv.style.display='none';
		src.style.display='';
	} else {
		main.style.display='';
		src.style.display='none';
	}
}

document.onkeydown = function(e) {
	if (e.ctrlKey && e.keyCode === 69 ) {
		edit_show();
		return false;
	}
	if (e.ctrlKey && e.keyCode === 85 ) {
		show_src();
		return false;
	}
};

function xround(n,d){
	return Math.round(n*Math.pow(10,d))/Math.pow(10,d);
}

function secToText(sec){
	if(sec<=60) return '';
	return `${Math.floor(sec/60/60)}:${('0'+Math.round(sec/60)%60).slice(-2)}`;
	// sec=Math.round(sec);
	// if(sec<59.5*60) return `${Math.round(sec/60)}m`;
	// if(sec<3*60*60){
	// 	var m=Math.round(sec/60)%60;
	// 	// if(m==0) return `${Math.round(sec/60/60)}h`;
	// 	// return `${Math.floor(sec/60/60)}h ${m}m`;
	// 	return `${Math.floor(sec/60/60)}:${('0'+m).slice(-2)}`;
	// }
	// return `${Math.round(sec/60/60)}h`;
}
function secToText2(sec){
	if(sec<=2) return `${xround(sec,3)} s`;
	if(sec<=10) return `${xround(sec,2)} s`;
	if(sec<=60) return `${xround(sec,1)} s`;
	sec=Math.round(sec);
	if(sec<120) return `1m ${sec-60}s`;
	if(sec<59.5*60) return `${Math.round(sec/60)}m`;
	if(sec<3*60*60){
		var m=Math.round(sec/60)%60;
		if(m==0) return `${Math.round(sec/60/60)}h`;
		return `${Math.floor(sec/60/60)}h ${m}m`;
	}
	if(sec<25.5*60*60) return `${Math.round(sec/60/60)}h`;
	if(sec<47.5*60*60) return `1d ${Math.round((sec-24*60*60)/60/60)}h`;
	return `${Math.round(sec/24/60/60)}d`;
}

// https://github.com/MasterQ32/kristall/blob/master/src/documentstyle.cpp#L515
function autoTheme(host){
	const hash=md5(host);
	const hue=(parseInt(hash.substr(0,2),16)+parseInt(hash.substr(2,2),16))/510; // 0..1, float
	const sat=Math.round(parseInt(hash.substr(4,2),16)/255*100); // 0..100, int
	auto.innerHTML=
        // themed.background_color = QColor::fromHslF(hue, saturation, 0.25f);
	`body{background: hsl(${hue}turn, ${sat}%, 25%)}`+
        // themed.standard_color = QColor{0xFF, 0xFF, 0xFF};
	'main{color: white}'+
        // themed.h1_color = QColor::fromHslF(std::modf(hue + 0.5, &tmp), 1.0 - saturation, 0.75);
        // themed.h2_color = QColor::fromHslF(std::modf(hue + 0.5, &tmp), 1.0 - saturation, 0.75);
        // themed.h3_color = QColor::fromHslF(std::modf(hue + 0.5, &tmp), 1.0 - saturation, 0.75);
	`h1,h2,h3 {color: hsl(${hue+0.5}turn, ${100-sat}%, 75%)}`+
        // themed.external_link_color = QColor::fromHslF(std::modf(hue + 0.25, &tmp), 1.0, 0.75);
	// Links are a bit different
	`main a:visited {color: hsl(${hue+0.25}turn, 100%, 70%)}`+
	`main a {color: hsl(${hue+0.25}turn, 100%, 85%)}`+
	`a.mail, a.proto {color: hsl(${hue+0.25}turn, 100%, 65%)}`+
        // themed.blockquote_bgcolor = themed.background_color.lighter(130);
	`blockquote {background: hsl(${hue}turn, ${sat}%, 33%)}`+
        // themed.blockquote_fgcolor = QColor{0xEE, 0xEE, 0xEE};
	'blockquote {color:#EEE}';
};
autoTheme(display_host);

function edit_show(){
	if(editdiv.style.display='none'){
		edittext.value=xhr.responseText;
		edittype.value=contentType;
		editdiv.style.display='';
		main.style.display='none';
		src.style.display='none';
	} else {
		editdiv.style.display='none';
		main.style.display='';
	}
}

function editSubmit(){
	if(edittext.value.substr(-1)!='\n') edittext.value+='\n';
	xhr = new XMLHttpRequest();
	xhr.open('POST', url2proxyAPIURL(display_url.replace('gemini','titan'))+
		`;token=${edittoken.value};mime=${edittype.value}`);
	xhr.onload = xhr_onload;
	xhr.send(edittext.value);
}

function submitPrompt(el) {
	location.href=url2proxyURL(el.dataset.url+'?'+el.value);
}
