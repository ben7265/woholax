const txns = {};
const server = {};
const socket = io();
const xdata = {};


const websocket = io(serverURL);

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

window.onbeforeunload = function (event) {
};

document.addEventListener('changeUser', (event) => {
  initialiseXtens();
  showHide();
  //initialiseCSSVars();
});

window.addEventListener('resize', (event) => {
});

const clearUser = () => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

const getUser = () => {
  var user = sessionStorage.getItem('user') || localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

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

const checkAccess = (element) => {
  const user = getUser();
  var allow = element.getAttribute('allow');
  allow = allow ? allow.trim().split(/\s*\,\s*/) : [];
  const role = user ? user.role : 'public';
  return allow.includes(role);
};

const initialiseXtens = () => {
  const user = getUser();

  const list = document.querySelectorAll('[xten]');
  list.forEach(element => {
    const access = checkAccess(element);
    if (access) {
        wxfns.addClass(element, 'wx-state-editable');
    } else {
        wxfns.removeClass(element, 'wx-state-editable');
    }  
  });

  for (var prop in initElement) {
    const list = document.getElementsByClassName('wx-xten-' + prop);

    for (var i = 0; i < list.length; i++) {
      const element = list[i];
      if (!initElement[prop]) {
        return;
      }
      
      if (typeof initElement[prop] !== 'function') {
        const error = 'incorrect initElement function';
        element.setAttribute('error', error);
        return;
      }
      initElement[prop](element, prop);
    }
  }
  return true;
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
  console.log('server sent', message);
});

function checkOverlap(element1, element2) {
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
}

function adjustToolbarPosition(toolbarElements) {
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
}

window.onload = function () {
  initialiseXtens();
  const toolbarElements = document.querySelectorAll('.wx-xten-toolbar');
  adjustToolbarPosition(toolbarElements);
};

const wxfns = {
  confirm: async (message, heading, yestext, notext) => {
    const confirmation = new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.classList.add('overlay');
      overlay.style = 'position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgba(0, 0, 0, 0.3);z-index: 9999;';

      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: #ffffff;border-radius: 5px;box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);border: 1px solid darkgrey';

      const headingElement = document.createElement('div');
      headingElement.innerHTML = '<span>' + (heading || 'Are you sure?') + '</span>';
      modal.appendChild(headingElement);
      headingElement.style = 'padding:15px; text-align: center;border-bottom: 1px solid darkgrey;font-weight:bold;';

      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      modal.appendChild(messageElement);
      messageElement.style = 'padding: 15px;';

      const buttonPanel = document.createElement('div');
      modal.appendChild(buttonPanel);
      buttonPanel.style = 'padding: 15px; border-top: 1px solid darkgrey;text-align: right;';

      const yesButton = document.createElement('button');
      yesButton.textContent = yestext || 'Yes';
      yesButton.addEventListener('click', () => {
        removeModal();
        resolve(true);
      });
      buttonPanel.appendChild(yesButton);
      yesButton.style = 'display: inline-block;margin-right: 10px; padding: 5px 10px;';

      const noButton = document.createElement('button');
      noButton.textContent = notext || 'No';
      noButton.addEventListener('click', () => {
        removeModal();
        resolve(false);
      });
      buttonPanel.appendChild(noButton);
      noButton.style = 'display: inline-block;padding: 5px 10px;';

      const closeButton = document.createElement('div');
      closeButton.innerHTML = '<img style="width:30px; height: auto;" src="icons/close.svg"/>';
      closeButton.addEventListener('click', () => {
        removeModal();
        resolve(false);
      });
      modal.appendChild(closeButton);
      closeButton.style = 'display: inline-block; position: absolute; top: 0; right: 0;';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      function removeModal() {
        document.body.removeChild(overlay);
      }
    });

    return await confirmation;
  },

  error: (heading, message) => {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style = 'position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgba(0, 0, 0, 0.3);z-index: 9999;';

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: #ffffff;border-radius: 5px;box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);border: 1px solid darkgrey';

    const headingElement = document.createElement('div');
    headingElement.innerHTML = '<span>' + (heading || 'Are you sure?') + '</span>';
    modal.appendChild(headingElement);
    headingElement.style = 'padding:15px; text-align: center;border-bottom: 1px solid darkgrey;font-weight:bold;';

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    modal.appendChild(messageElement);
    messageElement.style = 'padding: 15px;';

    const buttonPanel = document.createElement('div');
    modal.appendChild(buttonPanel);
    buttonPanel.style = 'padding: 15px; border-top: 1px solid darkgrey;text-align: right;';

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => {
      removeModal();
    });
    buttonPanel.appendChild(okButton);
    okButton.style = 'display: inline-block;padding: 5px 10px;';

    const closeButton = document.createElement('div');
    closeButton.innerHTML = '<img style="margin: 10px;width:30px" src="icons/close.svg"/>';
    closeButton.addEventListener('click', () => {
      removeModal();
    });
    modal.appendChild(closeButton);
    closeButton.style = 'display: inline-block; position: absolute; top: 0; right: 0;';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function removeModal() {
      document.body.removeChild(overlay);
    }
  },

  inform: (message, timeout, callback) => {
    var overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style = 'position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgba(0, 0, 0, 0.3);z-index: 9999;';

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: #ffffff;border-radius: 5px;box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);border: 1px solid darkgrey';

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    modal.appendChild(messageElement);
    messageElement.style = 'padding: 15px;';

    const closeButton = document.createElement('div');
    closeButton.innerHTML = '<img style="margin: 10px;width:30px" src="icons/close.svg"/>';
    closeButton.addEventListener('click', () => {
      removeModal();
      callback && callback();
    });
    modal.appendChild(closeButton);
    closeButton.style = 'display: inline-block; position: absolute; top: 0; right: 0;';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function removeModal() {
        overlay && document.body.removeChild(overlay);
        overlay = null;
    }

    setTimeout(() => {
      removeModal();
      callback && callback();
    }, (timeout || 15) * 1000);
  },

  draggable: (element) => {
    element.onmousedown = (e) => {
      const resizeHandleSize = 15;
      const width = element.offsetWidth;
      const height = element.offsetHeight;

      const computedStyle = window.getComputedStyle(element);
      const cursorStyle = computedStyle.getPropertyValue('cursor');

      if (e.clientX > (element.offsetLeft + width - resizeHandleSize) && e.clientY > (element.offsetTop + height - resizeHandleSize)) {
        return true;
      }

      var currentX = 0;
      var currentY = 0;

      currentX = e.clientX;
      currentY = e.clientY;

      element.classList.add("dragging");

      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
        element.classList.remove("dragging");
      };

      document.onmousemove = (e) => {
        element.style.left = (element.offsetLeft - currentX + e.clientX) + 'px';
        element.style.top = (element.offsetTop - currentY + e.clientY) + 'px';
        currentX = e.clientX;
        currentY = e.clientY;
      };
    };
  },

  closeButton: (element, callback) => {
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '<img style="width:30px" src="icons/close.svg"/>';
    closeButton.addEventListener('click', () => {
      callback();
    });
    element.appendChild(closeButton);
    closeButton.style = 'display: inline-block; position: absolute; top: 0; right: 0;';
    return closeButton;
  },

  addButton: (element, label, callback) => {
    const button = document.createElement('button');
    button.innerHTML = label || '<span>OK</span>';
    button.addEventListener('click', () => {
      callback();
    });
    element.appendChild(button);
    button.style = 'display: inline-block;';
    return button;
  },

  addTitle: (element, title) => {
    if (!title) {
      return;
    }
    const titlebar = document.createElement('div');
    titlebar.innerHTML = '<span>' + title + '</span>';

    titlebar.classList.add('title');
    element.appendChild(titlebar);

    return titlebar;
  },

  getValue: async (name, type, title, fargs) => {
    const attribs = typeof fargs == 'string' ? JSON.parse(fargs) : fargs;
    
    const confirmation = new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.classList.add('overlay');
      overlay.style = 'position: fixed;top: 0;left: 0;width: 100%;height: 100%;z-index: 9999;';

      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.classList.add('get-value');
      modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%)';

      const titlebar = wxfns.addTitle(modal, title);

      const closeButton = wxfns.closeButton(modal, () => {
        removeModal();
        resolve(null);
      });

      const modalBody = document.createElement('div');
      modalBody.classList.add('modal-body');
      modal.appendChild(modalBody);

      const label = document.createElement('label');
      const input = document.createElement('input');

      const apply = ['type', 'name', 'value', 'min', 'max', 'step'];
      
      apply.forEach((att) => {
        if (attribs[att]) {
          input.setAttribute(att, attribs[att] || '');
        }
      });

      label.style = 'margin-right: 2px;';
      input.style = input.type != 'color' ? 'padding: 5px; margin: 5px;' : 'margin: 5px;';

      modalBody.appendChild(label);
      modalBody.appendChild(input);

      const buttonPanel = document.createElement('div');
      buttonPanel.classList.add('button-panel');
      modal.appendChild(buttonPanel);

      wxfns.addButton(buttonPanel, 'Save', () => {
        removeModal();
        resolve(input.value);
      });

      wxfns.addButton(buttonPanel, 'Cancel', () => {
        removeModal();
        resolve(null);
      });
      
      wxfns.draggable(modal);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
  
      const titleHeight = titlebar.offsetHeight;
      const closeHeight = closeButton.offsetHeight;

      closeButton.style.top = 0;
      closeButton.style.right = 0;

      function removeModal() {
        document.body.removeChild(overlay);
      }  
    });

    return await confirmation;
  },

  getMultipleValues: async (list, title, formStyle) => {    
    const confirmation = new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.classList.add('overlay');
      overlay.style = 'position: fixed;top: 0;left: 0;width: 100%;height: 100%;z-index: 9999;';

      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.classList.add('get-values');
      modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%)';

      const titlebar = wxfns.addTitle(modal, title);

      const closeButton = wxfns.closeButton(modal, () => {
        removeModal();
        resolve(null);
      });

      const modalBody = document.createElement('div');
      modalBody.classList.add('modal-body');
      modal.appendChild(modalBody);

      const form = document.createElement('form');
      form.style = 'display: block; width: 100%; padding: 10px;';

      const apply = ['type', 'name', 'value', 'min', 'max', 'step', 'required', 'height'];

      list.forEach(input => {
        const label = document.createElement('label');
        label.innerText = input.label;
        label.style = 'width: 150px; display: inline-block;';
        const field = document.createElement(input.tag);
        field.style = 'width: 200px; display: inline-block; padding: 5px; margin: 5px';

        const attribs = input;

        apply.forEach((att) => {
          if (att == 'value') {
            if (input.type == 'checkbox') {
              field.checked = String(input.value).toLowerCase() == 'true';
              return;
            }
            field.value = input.value || '';
            return;
          }
          if (attribs[att]) {
            field.setAttribute(att, attribs[att]);
          }
        });
        const group = document.createElement('div');
        group.style = 'padding: 5px';
        group.appendChild(label);
        group.appendChild(field);
        form.appendChild(group);
      });

      const showError = document.createElement('div');
      showError.style = 'display: none;';
      if (formStyle) {
        form.style = formStyle;
      }

      form.appendChild(showError);
      modalBody.appendChild(form);

      const buttonPanel = document.createElement('div');
      buttonPanel.classList.add('button-panel');
      modal.appendChild(buttonPanel);

      wxfns.addButton(buttonPanel, 'Save', () => {
        const data = wxfns.getFormData(form);
        for (var i = 0; i < list.length; i++) {
          const _input = list[i];
          if (_input.required && !data[_input.name]) {
            showError.innerText = _input.label + ' is mandatory';
            showError.style = 'display: block; color: red; padding: 10px 0;';
            return;
          }

          if (_input.validation) {
            if (typeof _input.validation == 'function') {
              const error = _input.validation(data[_input.name]);
              if (error) {
                showError.innerText = error;
                showError.style = 'display: block; color: red; padding: 10px 0;';
              }
            }
          }
        }
        showError.style = 'display: none';
        removeModal();
        resolve(data);
      });

      wxfns.addButton(buttonPanel, 'Cancel', () => {
        removeModal();
        resolve(null);
      });
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
  
      const titleHeight = titlebar.offsetHeight;
      const closeHeight = closeButton.offsetHeight;

      closeButton.style.top = 0;
      closeButton.style.right = 0;

      function removeModal() {
        document.body.removeChild(overlay);
      }  
    });

    return await confirmation;
  },

  selectFile: async (fileType) => {
    const selected = new Promise((resolve) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = fileType; // 'image/*';

      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        resolve(file);
      });

      fileInput.click();
    });

    return await selected;
  },

  upload: async (element, txn, data, file, dontShowError) => {
    const attribs = [...element.attributes].reduce((attrs, attribute) => {
      attrs[attribute.name] = attribute.value;
      return attrs;
    }, {});

    attribs['_text'] = element.innerText;

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
  },

  transaction: async (element, txn, data, dontShowError) => {
      const attribs = [...element.attributes].reduce((attrs, attribute) => {
      attrs[attribute.name] = attribute.value;
      return attrs;
    }, {});

    attribs['_text'] = element.innerText;

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
  },

  addClass: (element, className) => {
    const str = className.trim();
    if (!str) {
      return;
    }
    const list = str.split(/[\s\t\,]+/);
    list.forEach((_cls) => {
      if (element.classList) {
        element.classList.add(_cls);
      } else {
        element.className += ' ' + _cls;
        element.className = element.className.trim().replace(/[\w]+/g, ' ');
      }
    });
  },

  removeClass: (element, className) => {
    const str = className.trim();
    if (!str) {
      return;
    }
    const list = str.split(/[\s\t\,]+/);
    list.forEach((_cls) => {
      if (element.classList) {
        element.classList.remove(_cls);
      } else {
        element.className = element.className.replace(_cls, '').trim().replace(/[\w]+/g, ' ');
      }
    });
  },

  hasClass: (element, className) => {
    var list = element.getAttribute('class');
    list = list ? list.split(/ +/) : [];
    return list.indexOf(className.trim()) != -1;
  },

  getToolbarParent: (event) => {
    var element = event.target;

    const toolbar = element.closest('.wx-xten-toolbar');
    if (toolbar) {
        return toolbar.parentElement;
    }
    
    return element;
  },

  toCamelCase: (str) => {
    return str.split(/[\s\_\-\.]/).map((s) => { return s.trim() }).map((s) => { return s.charAt(0).toUpperCase() + s.substring(1) }).join(' ');
  },

  parseStyles: (styles) => {
    const obj = {};
    const list = typeof styles === 'string' ? styles.trim().split(/\s*\;\s*/) : [];
    list.forEach((_s) => {
        const arr = _s.split(/\s*\:\s*/);
        if (!arr[0] || !arr[1] || arr.length != 2) {
            return;
        }
        obj[arr[0]] = arr[1];
    });

    return obj;
  },

  makeStyles: (obj) => {
    var output = '';
    for (var prop in obj) {
        output += prop + ':' + obj[prop] + ';';
    }
    return output;
  },

  getFormData: (form) => {
    const data = {};
    const checkHuman = form.querySelector('.wx-xten-check-human');
    data['check-human'] = checkHuman ? checkHuman._value : true;

    for (var i = 0; i < form.elements.length; i++) {
      const element = form.elements[i];
      if (!element.name) {
        continue;
      }
      const name = element.name;
      const type = element.type;
      if (!name) {
        continue;
      }
      switch (type) {
        case 'file':
          data[name] = element.files;
          break;
        case 'radio':
          if (!data[name]) {
            data[name] = null;
          }
          if (element.checked) {
            data[name] = element.value;
          }
          break;
        case 'checkbox':
          if (!data[name]) {
            data[name] = null;
          }
          data[name] = element.checked;
          break;
        default:
          data[name] = element.value;
      }
    }
    return data;
  },
  closestXten: (e, name) => {
    return e.closest('.wx-xten-' + name);
  },
  callXten: async (e, xtenName, name, fn, data) => {
    const element = e.querySelector('.wx-xten-' + xtenName + (name ? '[name="' + name + '"]' : ''));
    return element ? await xfns[xtenName][fn](element, data) : null;
  }
};
