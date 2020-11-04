/* 
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://localhost:8000/csdb-preview.js';})();

javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://codepo8.github.io/csdb-preview-bookmarklet/csdb-preview.js';})();

*/
(function(){
  if (document.querySelector('csdb-preview')) {
    return;
  }
  
  class CSDBOverlay extends HTMLElement {
    constructor () {
      super();
    }
    static get observedAttributes() {
      return ['alttext','reviews','hidden'];
    }

    get alttext() {return this.hasAttribute('alttext');}
    get reviews() {return this.hasAttribute('reviews');}
    get hidden() {return this.hasAttribute('hidden');}

    attributeChangedCallback(name, oldValue, newValue) {

      if(this.shadowRoot){
        
        let div = this.shadowRoot.querySelector('div');
        let img = this.shadowRoot.querySelector('.image');
        let reviews = this.shadowRoot.querySelector('.reviews');

        if (this.hidden) {
          div.classList.add('hidden');
        } else {
          div.classList.remove('hidden');
        }

        if (this.alttext) {
          img.innerHTML = this.getAttribute('alttext');
        } else {
          img.innerHTML = ''
        }

        if (this.reviews) {
          reviews.innerHTML = this.getAttribute('reviews');
        } else {
          reviews.innerHTML = ''
        }
      }
    }

    connectedCallback () {
      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = `
        <style>
        div {
          position: fixed;
          right: 250px;
          background: #3d6ab7;
          font-family: Sans-serif;
          max-width: 400px;
          min-height: 250px;
          min-width: 350px;
          overflow: scroll ;
          top: 90px;
          font-size: 16px;
          color:black;
          box-shadow:3px 3px 20px #333;
          border: 5px solid #3d6ab7;
          opacity: 0.95;
        }
        div.error {
          border: 5px solid firebrick;
        }
        div h1 {
          cursor: move;
          font-size: 1em;
          padding: .2em .5em;
          background: powderblue;
          margin: 0;
          font-weight: normal;
          position: relative;
        }
        div:hover {
          opacity: 1;
        }
        .hidden {
          display: none;
        }
        div button {
          border: none;
          font-size: 18px;
          background: transparent;
          font-family: inherit;
          font-style: inherit;
          position: absolute;
          top: 0;
          right: 2px;
          margin: 0 5px 0 0;
          padding: 0;
        }
        div img {
          display: block;
          margin: 0 auto;
          max-width: 380px;
        }
        div button:hover {
          color: yellow;
          background: black;
        }
        .reviews a {
          color: black;
        }
        .reviews {
          padding: 5px;
        }
        </style>
        <div>
          <h1>Drag here</h1>
          <button title="close">ⅹ</button>
          <p class="image"></p>
          <p class="reviews"></p>
        </div>
      `;

      shadowRoot.querySelector('button').addEventListener('click', e => {
        this.setAttribute('hidden',true);
      });

      let swatchx = 0;
      let swatchy = 0;
      let mousex = 0;
      let mousey = 0;

      const initiatedrag = ev => {
        ev = ev || window.event;
        ev.preventDefault();
        mousex = ev.clientX;
        mousey = ev.clientY;
        document.addEventListener('mouseup', enddrag);
        document.addEventListener('mousemove', startdrag);
      }

      const startdrag = (ev) => {
        ev = ev || window.event;
        ev.preventDefault();
        swatchx = mousex - ev.clientX;
        swatchy = mousey - ev.clientY;
        mousex = ev.clientX;
        mousey = ev.clientY;
        shadowRoot.querySelector('div').style.top = 
          (shadowRoot.querySelector('div').offsetTop - swatchy) + "px";
        shadowRoot.querySelector('div').style.left = 
          (shadowRoot.querySelector('div').offsetLeft - swatchx) + "px";
      }
      const enddrag = _ => {
        let x = shadowRoot.querySelector('div').style.left.replace('px','');
        let y = shadowRoot.querySelector('div').style.top.replace('px','');
        window.localStorage.setItem('CSDBpreview',x+'|'+y);
        document.removeEventListener('mouseup', enddrag);
        document.removeEventListener('mousemove', startdrag);
      }
      shadowRoot.querySelector('h1').addEventListener('mousedown', initiatedrag);
      if(localStorage.getItem('CSDBpreview')){
        let pos = localStorage.getItem('CSDBpreview').split('|');
        shadowRoot.querySelector('div').style.left = Math.max(+pos[0],0)+'px';
        shadowRoot.querySelector('div').style.top = Math.max(+pos[1],0)+'px';
      }
    }
  }

  window.customElements.define('csdb-preview', CSDBOverlay);
  let csdbPreview = document.createElement('csdb-preview');
  document.body.appendChild(csdbPreview);

  csdbPreview.setAttribute(
    'alttext',
    'Roll over any release link<br>Drag to where you want me'
  );

  csdbPreview.removeAttribute('hidden');

  const outlink = e => {
    csdbPreview.setAttribute('alttext', '');
    csdbPreview.setAttribute('reviews', '');
  };

  const overlink = e => {
    let href = e.target.href.replace(/&.*/,'');
    let id = +href.replace(/.*\?id=/,'');
    let folderid = '1';
    let chunk = 0;
    if (id >= 1000 && id < 10000) { chunk = 1 }
    if (id >= 10000 && id < 100000) { chunk = 2 }
    if (id >= 100000) { chunk = 3 }
    folderid = ('' + id).slice(0,chunk) + '000';
    
    let url = `https://csdb.dk/gfx/releases/${folderid}/${id}.png`;
    fetch(url, { method: 'HEAD' })
    .then(res => {
        if (res.ok) {
          out = `<img src="${url}">`;
          csdbPreview.setAttribute('alttext', out);
        } else {
          url = url.replace('.png','.gif');
          out = `<img src="${url}">`;
          csdbPreview.setAttribute('alttext', out);
        }
    }).catch(err => console.log('Error:', err));

    fetch(e.target.href)
      .then(response => response.text())
      .then(data => {
        csdbPreview.setAttribute(
        'reviews',
        ''
    );
    if (data.indexOf('<a name="review">') === -1) {
        csdbPreview.setAttribute('reviews','No comments');
    } else {
      data = data.replace(/\n/g,'');
      let html = data.replace(/.*<b>User Comment/,'');
      html = html.replace(/Add a <a href="\/release\/addcomment.*/,'');

      // invoke new DOM Parser
      let parser = new DOMParser();
      // parse as HTML, this allows you to use querySelector
      let parsed = parser.parseFromString(html, 'text/html');
      // casting to arrays [... ] makes it easier as you get 
      // slice, filter, map and so on, but might be slow (!)
      let authors = [...parsed.querySelectorAll('a[href*=scener]')];
      let comments = [...parsed.querySelectorAll('table')];
      if (authors.length > 3) {authors = authors.slice(0,3)};

      let out = '';
      authors.forEach((a,i) => {
          out += `
          <b>${a.innerHTML}</b><br>
          ${comments[i].querySelector('font').innerHTML}<br><br>
        `
      })
      csdbPreview.setAttribute('reviews', out);
    }
  });
  };
if (self.location.href.indexOf('group')!==-1) {
let releasetable = [...document.querySelectorAll('b')].filter(b => {return b.innerHTML.indexOf('Releases')!==-1})[0].nextSibling.nextSibling.nextSibling

const getid = s => {
  return s.match(/\d+/)[0];
}
const clean = s => {
    s = s.replace(/<font[^>]+>/,'');
    s = s.replace(/<\/font>/,'');
    s = s.replace(/&nbsp;/,'');
    
  return s;
}
let table = releasetable.querySelectorAll('tr');
let data = {
  release: [],
  page: [],
  dl: [],
  year: [],
  type: [],
  accolade: []
};
table.forEach(tr => {
  let tds = tr.querySelectorAll('td');
  let as = tr.querySelectorAll('a');
  let link = [...as].filter(a => {return a.href.indexOf('/release/?')!==-1});
  data.page.push(getid(link[0].href));
  data.release.push(clean(link[0].innerHTML));
  data.year.push(clean(tds[2].innerHTML));
  data.type.push(clean(tds[3].innerHTML));
  data.accolade.push(clean(tds[4].innerHTML));
});
let years = [...new Set(data.year)].sort();
if(years[years.length-1]==='???') {years.pop()};
let f = document.createElement('form');
let out = 'Show: <button id="us">unselect all</button><br>';
let i = 0;
new Set(data.type).forEach((s) => {
  out += `<input type="checkbox" checked id="cb${i}" value="${s}">
          <label for="cb${i}">${s}</label>`;
  i++;
});
let t = releasetable;
t.style.display = 'none';
t.parentNode.insertBefore(f,t);
f.innerHTML = out;
f.innerHTML += `<br><label>Year: ${years[0]}
 <input type="range" id="years" min=${+years[0]} 
 value=${+years[years.length-1]} 
 max=${+years[years.length-1]}>${years[years.length-1]}</label>`;
let container = document.createElement('table');
container.id = 'sortrelease';
t.parentNode.insertBefore(container,t);
f.addEventListener('change', e => {
  rendertable();
});
const rendertable = _ => {
  let maxyear = +document.querySelector('#years').value;
  let showitems = [];
  let cbs = document.querySelectorAll('form input[type=checkbox]');
  cbs.forEach(c => {
    if (c.checked) {showitems.push(c.value)}
  });
  let out = `
    <tr>
      <th>Name</th>
      <th>Year</th>
      <th>Type</th>
      <th>Compo</th>
    </tr>`;
  data.release.forEach((name,i) => {
    if (+data.year[i]<=maxyear||data.year[i]==="???"){
      if (showitems.includes(data.type[i])){
          out += `<tr>
          <td><a href="/release/?id=${data.page[i]}">${name}</a></td>
          <td>${data.year[i]}</td>
          <td>${data.type[i]}</td>
          <td>${data.accolade[i]}</td>
          </tr>`
      }
    }
  })
  container.innerHTML = out;
  let alllinks = container.querySelectorAll('a');
  alllinks = [...alllinks].filter(
    a => { return a.href.indexOf('release/?')!==-1 }
  );
  alllinks.forEach(a => {
    a.addEventListener('mouseover', overlink);
    // a.addEventListener('mouseout', outlink);
  });
}
rendertable();
document.querySelector('#us').addEventListener('click',e => {
  f.querySelectorAll('input[type=checkbox]').forEach(cb => {cb.checked = false});
  rendertable();
  e.preventDefault();
})
let st = document.createElement('style');
document.head.appendChild(st);
st.innerHTML = `
   #sortrelease td, #sortrelease th {
    padding: 5px 3px 0 3px;
  }
  #sortrelease {
   width: 100%;
  }
  #sortrelease th {
    background: #7474fc;
  }
  @media (min-width:600px) {
    html body td {
      font-size: 1.1em;
    }
  }
`;
} else {
  let alllinks = document.querySelectorAll('a');
  alllinks = [...alllinks].filter(
    a => { return a.href.indexOf('release/?')!==-1 }
  );
  alllinks.forEach(a => {
    a.addEventListener('mouseover', overlink);
    // a.addEventListener('mouseout', outlink);
  });
}
})();
