const txns = {};
const server = {};
const socket = io();
const xdata = {};
const initElement = {};

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

        Element.prototype.checkAccess = function () {
            const user = getUser();
            var allow = this.getAttribute('allow');
            allow = allow ? allow.trim().split(/\s*\,\s*/) : [];
            const role = user ? user.role : 'public';
            return allow.includes(role);        
        };

        Element.prototype.refreshAccess = function () {
            if (this.checkAccess()) {
                element.addClass('wx-state-editable');
            }
            else 
            {
                element.removeClass('wx-state-editable');
            }
        };

        Element.prototype.upload = async function (txn, data, file, dontShowError) {
            const attribs = [...this.attributes].reduce((attrs, attribute) => {
                attrs[attribute.name] = attribute.value;
                return attrs;
            }, {});
        
            attribs['_text'] = this.innerText;
        
            const serverData = {
                user: getUser(),
                attribs: attribs,
                txn: txn,
                'calling-url': window.location.href,
                data: data
            };
        
            const formData = new FormData();
            formData.append("file", file);
            formData.append("serverData", JSON.stringify(serverData));
        
            const response = await fetch('/upload', {
                method: "POST",
                credentials: 'include',
                body: formData,
            });
            const result = await response.json();
            if (!result) {
                !dontShowError && wxfns.error('No result', 'Server did not send any data for ' + txn);
                return null;
            }
            if (result && result.rc != 'success') {
                !dontShowError && wxfns.error(wxfns.toCamelCase(result.rc), result.message || result.output || 'Error in txn ' + txn);
            }
            return result;
        };
        
        Element.prototype.transaction = async function (txn, data, dontShowError) {
            const attribs = [...this.attributes].reduce((attrs, attribute) => {
                attrs[attribute.name] = attribute.value;
                return attrs;
            }, {});
        
            attribs['_text'] = this.innerText;
        
            const serverData = {
                user: getUser(),
                attribs: attribs,
                'calling-url': window.location.href,
                txn: txn,
                data: data
            };
        
            const result = await server.post('/transaction', serverData);
            if (!result) {
                !dontShowError && wxfns.error('No result', 'Server did not send any data for ' + txn);
                return null;
            }
            if (result && result.rc != 'success') {
                !dontShowError && wxfns.error(wxfns.toCamelCase(result.rc), result.message || result.output || 'Error in txn ' + txn);
            }
            return result;
        };

        Element.prototype.refresh = async function () {
            const result = await this.transaction('refresh', null, false);
            if (result && result.rc != 'success') {
                wxfns.error(wxfns.toCamelCase(result.rc), result.message || result.output || 'Error refreshing element');
                return;
            }
        
            if (result.reload) {
                window.location.reload();
            }
        
            if (result.html) {
                this.innerHTML = result.html;
            }
        
            if (result.attribs) {
                for (var prop in result.attribs) {
                    this.setAttribute(prop, result.attribs[prop])
                }
            }
        
            const initialize = (_element) => {
                const xname = _element.getAttribute('xten');
                if (xname) {
                    const access = _element.checkAccess();
                    if (access) {
                        _element.addClass('wx-state-editable');
                    } else {
                        _element.removeClass('wx-state-editable');
                    }
        
                    const fn = initElement[xname];
                    fn && fn(_element);
                }
        
                for (var i = 0; i < _element.children.length; i++) {
                    initialize(_element.children[i]);
                }
            };
        
            initialize(this);
        };
        
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
    enhanceElements();

    const toolbarElements = document.querySelectorAll('.wx-xten-toolbar');
    adjustToolbarPosition(toolbarElements);

    initialiseXtens();
    showHide();
};

document.addEventListener('changeUser', (event) => {
    initialiseXtens();
    showHide();
});

window.addEventListener('resize', (event) => {
});

server.post = async (url, data) => {
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

const validateForm = (form) => {
    return true;
};

socket.on('hello', (message) => {
    console.debug('server sent', message);
});
