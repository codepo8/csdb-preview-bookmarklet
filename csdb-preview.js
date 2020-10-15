/* 
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://localhost:8000/csdb-preview.js';})();

javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://codepo8.github.io/csdb-preview-bookmarklet/csdb-preview.js';})();

*/

(function(){
  if (document.querySelector('alt-swab')) {
    return;
  }
  class altSwab extends HTMLElement {
    constructor () {
      super();
    }
    static get observedAttributes() {
      return ['error','alttext','reviews','hidden'];
    }
    get error() {
      return this.hasAttribute('error');
    }
    get alttext() {
      return this.hasAttribute('alttext');
    }
    get reviews() {
      return this.hasAttribute('reviews');
    }
    get hidden() {
      return this.hasAttribute('hidden');
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if(this.shadowRoot){
        if (this.error) {
          this.shadowRoot.querySelector('div').classList.add('error');
        } else {
          this.shadowRoot.querySelector('div').classList.remove('error');
        }
        if (this.hidden) {
          this.shadowRoot.querySelector('div').classList.add('hidden');
        } else {
          this.shadowRoot.querySelector('div').classList.remove('hidden');
        }

        if (this.alttext) {
          this.shadowRoot.querySelector('.image').innerHTML = this.getAttribute('alttext');
        } else {
          this.shadowRoot.querySelector('.image').innerHTML = ''
        }
        if (this.reviews) {
          this.shadowRoot.querySelector('.reviews').innerHTML = this.getAttribute('reviews');
        } else {
          this.shadowRoot.querySelector('.reviews').innerHTML = ''
        }
      }
    }
    connectedCallback () {
      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = `
        <style>
        div {
          position: fixed;
          background: #3d6ab7;
          font-family: Sans-serif;
          max-width: 400px;
          min-height: 250px;
          min-width: 350px;
          overflow: scroll ;
          top: 10px;
          left: 10px;
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
        div.error {
          border: 5px solid firebrick;
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
        shadowRoot.querySelector('div').style.top = (shadowRoot.querySelector('div').offsetTop - swatchy) + "px";
        shadowRoot.querySelector('div').style.left = (shadowRoot.querySelector('div').offsetLeft - swatchx) + "px";
      }
      const enddrag = _ => {
        document.removeEventListener('mouseup', enddrag);
        document.removeEventListener('mousemove', startdrag);
      }
      shadowRoot.querySelector('h1').addEventListener('mousedown', initiatedrag);
    }
  }
  window.customElements.define('alt-swab', altSwab);


  let altDisplay = document.createElement('alt-swab');
  document.body.appendChild(altDisplay);
  altDisplay.setAttribute(
    'alttext',
    'Roll over any release link<br>Drag to where you want me'
  );
  altDisplay.removeAttribute('hidden');

  const outimg = e => {
    altDisplay.setAttribute(
      'alttext',
      ''
    );
    altDisplay.setAttribute(
      'reviews',
      ''
    );
};

  const overimg = e => {
    let id = +e.target.href.replace(/.*\?id=/,'');
    let folderid = '1';
    if (id >= 1000 && id < 10000) {
      folderid = ('' + id).slice(0,1) + '000';
    }
    if (id >= 10000 && id < 100000) {
      folderid = ('' + id).slice(0,2) + '000';
    }
    if (id >= 100000) {
      folderid = ('' + id).slice(0,3) + '000';
    }
    let url = `https://csdb.dk/gfx/releases/${folderid}/${id}.png`;

    fetch(url, { method: 'HEAD' })
    .then(res => {
        if (res.ok) {
          out = `<img src="${url}">`;
          altDisplay.setAttribute('alttext', out);
        } else {
          url = url.replace('.png','.gif');
          out = `<img src="${url}">`;
          altDisplay.setAttribute('alttext', out);
        }
    }).catch(err => console.log('Error:', err));

    // https://csdb.dk/release/?id=182085
    // https://csdb.dk/gfx/releases/182000/182085.png

    fetch(e.target.href)
      .then(response => response.text())
      .then(data => {
        altDisplay.setAttribute(
        'reviews',
        ''
    );
    if (data.indexOf('<a name="review">') === -1) {
        altDisplay.setAttribute('reviews','No comments');
    } else {
      data = data.replace(/\n/g,'');
      let html = data.replace(/.*<b>User Comment/,'');
      html = html.replace(/Add a <a href="\/release\/addcomment.*/,'');
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(html, 'text/html');
      let authors = [...htmlDoc.querySelectorAll('a[href*=scener]')];
      let comments = [...htmlDoc.querySelectorAll('table')];
      if (authors.length > 3) {authors = authors.slice(0,3)};
      let out = '';
      authors.forEach((a,i) => {
          out += `
          <b>${a.innerHTML}</b><br>
          ${comments[i].querySelector('font').innerHTML}<br><br>
        `
      })
      altDisplay.setAttribute(
        'reviews',
        out
      );
    }
  });
  };

  let alllinks = document.querySelectorAll('a');
  alllinks = [...alllinks].filter(a => {return a.href.indexOf('release/?')!==-1})
  alllinks.forEach(i => {
    i.addEventListener('mouseover', overimg);
    i.addEventListener('mouseout', outimg);
  });
})();
