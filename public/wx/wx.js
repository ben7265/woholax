const txns = {};
const server = {};
const socket = io();
const xdata = {};
const initElement = {};
const attached = {};
const gvars = {};

const websocket = io(serverURL);

websocket.on('message', (data) => {
    console.debug('Message received from server:', data);
});

const peerConnectionConfig = {
    iceServers: [
        { urls: 'stun:127.0.0.1:3478' },
        {
            urls: 'turn:127.0.0.1:3478',
            username: 'localhost',
            credential: 'localhost'
        }
    ]
};

const clearUser = () => {
    sessionStorage.removeItem('user');
};

const getUser = () => {
    var user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const showHide = () => {
    const list = document.querySelectorAll('[show]');
    const user = getUser();
    const role = user ? user.role : 'public';

    for (var i = 0; i < list.length; i++) {
        const element = list[i];
        var allow = element.getAttribute('role').trim();
        if (allow == 'logged_in') {
            if (role != 'public') {
                element.style.display = 'initial';
            }
            return;
        }
        allow = allow ? allow.split(/\s*\,\s*/) : [];
        if (allow.includes(role)) {
            element.style.display = 'initial';
        }
    }
};

const initialiseXtens = () => {    
    const list = document.querySelectorAll('[xten]');
    list.forEach(element => {
        const id = element.getAttribute('id');
        const xtname = element.getAttribute('xten');
        
        if (xfns[xtname]) {
            for (var prop in xtname) {
                element.attach(xtname[prop]);
            }
        }

        element.refreshAccess();

        // run initElement
        if (!initElement[xtname]) {
            return;
        }

        if (typeof initElement[xtname] !== 'function') {
            const error = 'incorrect initElement function';
            element.setAttribute('error', error);
            return;
        }

        initElement[xtname](element, xtname);
    });
};

const checkOverlap = (element1, element2) => {
    if (!element1 || !element2) {
        return false;
    }
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    return (
        rect1.right > rect2.left &&
        rect1.left < rect2.right &&
        rect1.bottom > rect2.top &&
        rect1.top < rect2.bottom
    );
};

const adjustToolbarPosition = (toolbarElements) => {
    for (let i = 0; i < toolbarElements.length; i++) {
        const toolbar1 = toolbarElements[i];
        for (let j = i + 1; j < toolbarElements.length; j++) {
            const toolbar2 = toolbarElements[j];

            if (checkOverlap(toolbar1, toolbar2)) {
                const rect1 = toolbar1.getBoundingClientRect();
                const rect2 = toolbar2.getBoundingClientRect();
                toolbar1.style.right = (rect2.width + 1) + 'px';
            }
        }
    }
};

window.onload = () => {
    const toolbarElements = document.querySelectorAll('.wx-xten-toolbar');
    adjustToolbarPosition(toolbarElements);

    initialiseXtens();
    showHide();
};

document.addEventListener('changeUser', (event) => {
    initialiseXtens();
    showHide();
});

server.post = async (url, data) => {
    try {
        const response = await fetch(url, {
            method: "POST",
            mode: "same-origin", // no-cors, *cors, same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "include", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: "follow", // manual, *follow, error
            referrerPolicy: "strict-origin", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        });
        return response.json();
    }
    catch (e) {
        console.error(e.message);
    }
};

/*
const stylesList = {
  'color': 'colorPicker',
  'background-color': 'colorPicker'
}

const initialiseCSSVars = () => {
  const list = document.querySelectorAll('[data^="css-"]');

  for (var i = 0; i < list.length; i++) {
    const element = list[i];
    const style = window.getComputedStyle(element) || {};

    for (const prop of element.attributes) {
      if (!prop.startsWith('css-')) {
        continue;
      }

      const property = prop.replace(/^css\-/, '');
      const value = element.attributes[prop];

      if (!stylesList[property]) {
        continue;
      }

      const fn = stylesList[property];
      fn(element, prop, property, value, ())
    }
  }
};
*/

function str2hex(str) {
    return Array.from(str)
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

function hex2str(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

class SessionClass {
    constructor() {
        this.session = {};

        const cookies = document.cookie;

        if (!cookies) {
            return;
        }

        const list = cookies.split(/\s*;\s*/);
        for (let i = 0; i < list.length; i++) {
            const nameValue = list[i].split('=');
            if (nameValue[0] === 'session') {
                const hex = nameValue[1];
                try {
                    const str = hex2str(hex);
                    this.session = JSON.parse(str);
                } catch (e) {
                    console.error("Failed to parse session cookie:", e);
                }
                return;
            }
        }
    }

    get(name) {
        return this.session[name];
    }

    async set(name, value, forceReload) {
        this.session[name] = value;
        this.session['force-reload'] = forceReload || false;
        await this.updateCookie();
    }

    async delete(name) {
        if (this.session[name]) {
            delete this.session[name];
            await this.updateCookie();
        }
    }

    clear() {
        this.session = {};
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    async updateCookie() {
        /*
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        const str = JSON.stringify(this.session);
        const hex = str2hex(str);
        document.cookie = `session=${hex}; path=/; secure=false; samesite=Strict`;
        */
        await server.post('/set-session', this.session);
    }
}

const session = new SessionClass();

socket.on('hello', (message) => {
    console.debug('server sent', message);
});
