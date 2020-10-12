(function(){
  if (document.querySelector('alt-swab')) {
    return;
  }
  class altSwab extends HTMLElement {
    constructor () {
      super();
    }
    static get observedAttributes() {
      return ['error','alttext','hidden'];
    }
    get error() {
      return this.hasAttribute('error');
    }
    get alttext() {
      return this.hasAttribute('alttext');
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
          this.shadowRoot.querySelector('p').innerHTML = this.getAttribute('alttext');
        } else {
          this.shadowRoot.querySelector('p').innerHTML = ''
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
          max-width: 500px;
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
        div button:hover {
          color: yellow;
          background: black;
        }
        </style>
        <div>
          <h1>Drag here</h1>
          <button title="close">ⅹ</button>
          <p></p>
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
  };

  const checkimg = (src => {
    let i = new Image();
    i.src = src;
    i.onload = function() {
      let url = i.src;
      out = `<img src="${url}">`;
      altDisplay.setAttribute('alttext', out);
    }
    i.onerror = function() {
      let url = i.src.replace('.png','.gif');
      out = `<img src="${url}">`;
      altDisplay.setAttribute('alttext', out);
    }
  });

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
    checkimg(url);

    // https://csdb.dk/release/?id=182085
    // https://csdb.dk/gfx/releases/182000/182085.png

  };

  let allimgs = document.querySelectorAll('a');
  allimgs = [...allimgs].filter(a => {return a.href.indexOf('release/?')!==-1})
  allimgs.forEach(i => {
    i.addEventListener('mouseover', overimg);
    i.addEventListener('mouseout', outimg);
  });
})();