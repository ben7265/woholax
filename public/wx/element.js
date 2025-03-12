// enhance default Javascript this to have additional helper functions
Element.prototype.traverse = function (callback) {
    _traverseNodes(this, callback);
};

Element.prototype.getId = function () {
    return this.getAttribute('id');
};

Element.prototype.getName = function () {
    return this.getAttribute('name');
};

Element.prototype.isEditable = function () {
    return this.hasClass('wx-state-editable');
};

// class manipulations
Element.prototype.addClass = function (className) {
    const str = className.trim();
    if (!str) {
        return;
    }
    const list = str.split(/[\s\t\,]+/);
    if (this.classList) {
        list.forEach((_cls) => {
            this.classList.add(_cls);
        });
    }
    else {
        var classes = this.className ? this.className.split(/[\s\t\,]+/) : [];
        const _list = {};
        classes.forEach((_cls) => {
            _list[_cls] = _cls;
        });
        list.forEach((_cls) => {
            _list[_cls] = _cls;
        });

        classes = Object.keys(_list);
        this.className = classes ? classes.join(' ') : '';
    }
};

Element.prototype.removeClass = function (className) {
    const str = className ? className.trim() : null;
    if (!str) {
        return;
    }
    const list = str.split(/[\s\t\,]+/);
    if (this.classList) {
        list.forEach((_cls) => {
            this.classList.remove(_cls);
        });
    }
    else {
        var classes = this.className ? this.className.split(/[\s\t\,]+/) : [];
        const _list = {};
        classes.forEach((_cls) => {
            _list[_cls] = _cls;
        });
        list.forEach((_cls) => {
            delete _list[_cls];
        });

        classes = Object.keys(_list);
        this.className = classes ? classes.join(' ') : '';
    }
};

Element.prototype.hasClass = function (className) {
    var list = this.getAttribute('class');
    list = list ? list.split(/ +/) : [];
    return list.indexOf(className.trim()) != -1;
};

Element.prototype.toggleClass = function (className) {
    if (this.hasClass(className)) {
        this.removeClass(className);
    }
    else {
        this.addClass(className);
    }
};

Element.prototype.addStyle = function (styles) {
    const obj = typeof styles == 'object' ? styles : wxfns.parseStyles(styles);
    const current = wxfns.parseStyles(this.getAttribute('style'));
    for (var prop in obj) {
        current[prop] = obj[prop];
    }

    const output = wxfns.makeStyles(current);
    this.setAttribute('style', output);
};

Element.prototype.removeStyle = function (styles) {
    // ### tbd
};

// local events related functions
const listeners = {};

Element.prototype.notify = function (message, data, target) {
    const _data = data || {};
    _data.name = this.getName() || null;
    const event = new CustomEvent(message, {
        bubbles: true,
        detail: _data
    });
    this.dispatchEvent(event);
};

Element.prototype.checkAccess = function () {
    const user = getUser();
    var allow = this.getAttribute('allow');
    if (allow == 'logged_in') {
        if (!user?.role || user.role != 'public') {
            return true;
        }
    }
    allow = allow ? allow.trim().split(/\s*\,\s*/) : [];
    const role = user ? user.role : 'public';
    return allow.includes(role);
};

Element.prototype.refreshAccess = function () {
    if (this.checkAccess()) {
        this.addClass('wx-state-editable');
    }
    else {
        this.removeClass('wx-state-editable');
    }
};

Element.prototype.upload = async function (txn, data, file, suffix, dontShowError) {
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
        suffix: suffix,
        session: session,
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

Element.prototype.transaction = async function (txn, data, suffix, dontShowError) {
    const attribs = [...this.attributes].reduce((attrs, attribute) => {
        attrs[attribute.name] = attribute.value;
        return attrs;
    }, {});

    //attribs['_text'] = this.innerText;

    const serverData = {
        user: getUser(),
        attribs: attribs,
        'calling-url': window.location.href,
        txn: txn,
        suffix: suffix,
        session: session,
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

Element.prototype.saveData = async function (data, suffix, dontShowError) {
    return await this.transaction('save-object-data', data, suffix, dontShowError);
};

Element.prototype.openModal = async function (name, heading, setter, getter) {
    const modal = document.querySelector('[xten="modal"][name="' + name + '"]');
    return await modal.open(heading, setter, getter);
};

Element.prototype.refresh = async function () {
    const result = await this.transaction('refresh');
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

// link functions to elements
Element.prototype.attach = function (name, fn) {
    if (!this.xfns) {
        this.xfns = {};
    }
    this.xfns[name] = fn;
};

Element.prototype.invoke = function (name, ...args) {
    const xten = this.getAttribute('xten');
    const fn = xfns[xten] ? xfns[xten][name] : null;
    if (!fn) {
        console.error('function ' + name + ' not found in xten ' + xten);
        return;
    }
    return fn.call(this, ...args);
};

Element.prototype.getValue = function () {
    const type = this.getAttribute('type');
    switch (type) {
        case 'file':
            return this.files;
        case 'radio':
            return this.checked ? this.value : null;
        case 'checkbox':
            return this.checked;
        case "select-multiple":
            return Array.from(this.selectedOptions).map(opt => opt.value);
        default:
            return this.value;
    }

    return this.value;
};

Element.prototype.validate = function (_value) {
    const required = this.getAttribute('required') == 'true';
    const value = _value || this.value.trim();

    this.reportError(null);

    if (!this.checkValidity()) {
        return false;
    }

    if (!value && !required) {
        return true;
    }

    if (!value && required) {
        this.reportError('required value');
        return false;
    }

    const validate = this.getAttribute('validate');
    if (!validate) {
        return true;
    }

    const checks = validate.split(/\s*\:\s*/);
    for (var i = 0; i < checks.length; i++) {
        const _check = checks[i].trim();
        const matches = _check.match(/^([a-z]+)\s*(\(\s*(.*)\s*\))?$/);

        const _fname = matches[1];
        if (!_fname || !validations[_fname]) {
            this.reportError('validation ' + _fname + ' not defined');
            return false;
        }

        const _args = matches[3] ? matches[3].split(/\s*\,\s*/) : [];
        const error = validations[_fname](value, _args);
        if (error) {
            this.reportError(error);
            return false;
        }
    }

    return true;
}

Element.prototype.reportError = function (error) {
    if (error) {
        this.addClass('invalid-value');
        this.setCustomValidity(error);
    }
    else {
        this.removeClass('invalid-value');
        this.setCustomValidity('');
    }
    this.reportValidity();
};

Element.prototype.validateForm = function () {
    if (this.tagName.toLowerCase() != 'form') {
        return false;
    }

    var valid = true;
    for (var i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        if (!element.validate()) {
            valid = false;
            break;
        }
    }

    return valid;
};

Element.prototype.getFormData = function () {
    if (this.tagName.toLowerCase() != 'form') {
        console.error('getFormData called on a non form element', this.tagName, this.getId());
        return null;
    }

    const data = {};
    for (var i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        if (!element.name) {
            continue;
        }
        data[element.name] = element.getValue();
    }

    const checkHuman = this.querySelector('.wx-xten-check-human');
    data['check-human'] = checkHuman ? checkHuman._value : true;

    return data;
};

Element.prototype.validatedFormData = function () {
    if (this.tagName.toLowerCase() != 'form') {
        console.error('validatedFormData called on a non form element', this.tagName, this.getId());
        return null;
    }

    const captcha = this.querySelector('.wx-xten-check-human');
    const valid = this.validateForm();
    if (!valid) {
        captcha && captcha.invoke('clear', captcha);

        /* ### show errors and other error processing */

        return null;
    }

    const data = this.getFormData();
    if (captcha) {
        data['check-human'] = captcha.value;
        if (data.gotcha) {
            console.error('Suspected BOT click');
            captcha.invoke('clear', captcha);
            return null;
        }

        if (!captcha.value) {
            wxfns.error('Cannot Send Message', 'Please verify you are human');
            captcha.invoke('clear', captcha);
            return null;
        }
    }

    return data;
};

Element.prototype.clearForm = function () {
    if (this.tagName.toLowerCase() != 'form') {
        console.error('clearForm called on a non form element', this.tagName, this.getId());
        return null;
    }

    const captcha = this.querySelector('.wx-xten-check-human');
    captcha && captcha.invoke('clear', captcha);

    Array.from(this.elements).forEach((element) => {
        switch (element.type) {
            case "checkbox":
            case "radio":
                element.checked = false;
                break;
            case "select-one":
            case "select-multiple":
                element.selectedIndex = -1;
                break;
            default:
                element.value = "";
                break;
        }
    });
};

Element.prototype.computedStyles = function () {
    return window.getComputedStyle(this);
};

Element.prototype.contentHeight = function (selector) {
    const descendants = this.querySelectorAll(selector || '*');

    var maxBottom = 0;

    Array.from(descendants).forEach(child => {
        const top = child.offsetTop;
        const height = child.offsetHeight;
        const bottom = top + height;

        if (bottom > maxBottom) {
            maxBottom = bottom;
        }
    });

    return maxBottom;
};

Element.prototype.outerHeight = function (selector) {
    const styles = this.computedStyles();
    var height = 0;
    height += this.contentHeight(selector);

    height += parseFloat(styles.marginTop);
    height += parseFloat(styles.marginBottom);
    height += parseFloat(styles.paddingTop);
    height += parseFloat(styles.paddingBottom);
    height += parseFloat(styles.borderTopWidth);
    height += parseFloat(styles.borderBottomWidth);

    return height;
};

Element.prototype.stretchHeight = function (selector) {
    var height = this.outerHeight(selector);
    this.style.height = height + 'px';
    return height;
};

Element.prototype.childrenRendered = async function () {
    // ### not working
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations, observer) => {
            let allRendered = true;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const descendants = node.querySelectorAll('*');
                            descendants.forEach(descendant => {
                                if (descendant.tagName === 'IMG' && !descendant.complete) {
                                    allRendered = false;
                                }
                            });
                        }
                    });
                }
            });

            if (allRendered) {
                observer.disconnect();
                resolve(true);
            }
        });

        observer.observe(this, { childList: true, subtree: true });
    });
};

Element.prototype.makeDraggable = function (dropHandler, dragHandler, key, handleSize) {
    const resizeHandleSize = handleSize || 15;
    if (!dropHandler) {
        console.error('draggable element must have a drop handler');
        return;
    }

    this.isDraggable = true;

    this.removeClass('is-dragging');
    let isDragging = false;
    let isHolding = false;
    let startX, startY;
    let dragThreshold = 5;
    let holdTimer = null;

    this.onmousemove = (e) => {
        const rect = this.getBoundingClientRect();
        const width = this.offsetWidth;
        const height = this.offsetHeight;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        switch (true) {
            case mouseX < resizeHandleSize && mouseY < resizeHandleSize:
                this.style.cursor = 'nw-resize';
                break;
            case mouseX > width - resizeHandleSize && mouseY < resizeHandleSize:
                this.style.cursor = 'ne-resize';
                break;
            case mouseX < resizeHandleSize && mouseY > height - resizeHandleSize:
                this.style.cursor = 'sw-resize';
                break;
            case mouseX > width - resizeHandleSize && mouseY > height - resizeHandleSize:
                this.style.cursor = 'se-resize';
                break;
            case mouseX < resizeHandleSize:
                this.style.cursor = 'w-resize';
                break;
            case mouseX > width - resizeHandleSize:
                this.style.cursor = 'e-resize';
                break;
            case mouseY < resizeHandleSize:
                this.style.cursor = 'n-resize';
                break;
            case mouseY > height - resizeHandleSize:
                this.style.cursor = 's-resize';
                break;
            default:
                this.style.cursor = 'default';
        }
    }

    this.onmousedown = (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        isHolding = false;

        let width = this.offsetWidth;
        let height = this.offsetHeight;

        const rect = this.getBoundingClientRect();
        let mode = null;

        switch (true) {
            case e.clientX < (rect.left + resizeHandleSize) && e.clientY < (rect.top + resizeHandleSize):
                mode = 'nw-resizing';
                break;
            case e.clientX > (rect.left + width - resizeHandleSize) && e.clientY < (rect.top + resizeHandleSize):
                mode = 'ne-resizing';
                break;
            case e.clientX < (rect.left + resizeHandleSize) && e.clientY > (rect.top + height - resizeHandleSize):
                mode = 'sw-resizing';
                break;
            case e.clientX > (rect.left + width - resizeHandleSize) && e.clientY > (rect.top + height - resizeHandleSize):
                mode = 'se-resizing';
                break;
            case e.clientX < (rect.left + resizeHandleSize):
                mode = 'w-resizing';
                break;
            case e.clientX > (rect.left + width - resizeHandleSize):
                mode = 'e-resizing';
                break;
            case e.clientY < (rect.top + resizeHandleSize):
                mode = 'n-resizing';
                break;
            case e.clientY > (rect.top + height - resizeHandleSize):
                mode = 's-resizing';
                break;
            default:
                mode = 'dragging';
                this.style.cursor = 'move';
        }

        let currentX = e.clientX;
        let currentY = e.clientY;

        holdTimer = setTimeout(() => {
            isHolding = true;
        }, 200);

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (isHolding && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
                isDragging = true;
                this.addClass('is-dragging');
            }

            if (isDragging) {
                switch (mode) {
                    case 'dragging':
                        this.style.left = (this.offsetLeft - currentX + e.clientX) + 'px';
                        this.style.top = (this.offsetTop - currentY + e.clientY) + 'px';
                        this.style.cursor = 'move';
                        break;
                    case 'se-resizing':
                        width = width - currentX + e.clientX;
                        height = height - currentY + e.clientY;
                        this.style.width = width + 'px';
                        this.style.height = height + 'px';
                        break;
                    case 'nw-resizing':
                        this.style.left = (this.offsetLeft - currentX + e.clientX) + 'px';
                        this.style.top = (this.offsetTop - currentY + e.clientY) + 'px';
                        width = width + currentX - e.clientX;
                        height = height + currentY - e.clientY;
                        this.style.width = width + 'px';
                        this.style.height = height + 'px';
                        break;
                    case 'ne-resizing':
                        this.style.top = (this.offsetTop - (currentY - e.clientY)) + 'px';
                        width = width - currentX + e.clientX;
                        height = height + currentY - e.clientY;
                        this.style.width = width + 'px';
                        this.style.height = height + 'px';
                        break;
                    case 'sw-resizing':
                        this.style.left = (this.offsetLeft - (currentX - e.clientX)) + 'px';
                        width = width + currentX - e.clientX;
                        height = height - currentY + e.clientY;
                        this.style.width = width + 'px';
                        this.style.height = height + 'px';
                        break;    
                    case 's-resizing':
                        height = height - currentY + e.clientY;
                        this.style.height = height + 'px';
                        break;
                    case 'e-resizing':
                        width = width - currentX + e.clientX;
                        this.style.width = width + 'px';
                        break;
                    case 'w-resizing':
                        this.style.left = (this.offsetLeft - currentX + e.clientX) + 'px';
                        width = width + currentX - e.clientX;
                        this.style.width = width + 'px';
                        break;
                    case 'n-resizing':
                        this.style.top = (this.offsetTop - currentY + e.clientY) + 'px';
                        height = height + currentY - e.clientY;
                        this.style.height = height + 'px';
                        break;
                    }
                currentX = e.clientX;
                currentY = e.clientY;
            }
        };

        const onMouseUp = () => {
            clearTimeout(holdTimer);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.removeClass("dragging");
            this.removeClass("resizing");

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (isHolding && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
                isDragging = true;
                this.addClass('is-dragging');
            }

            if (isDragging) {
                const style = this.getAttribute('style');
                const obj = wxfns.parseStyles(style);
                const position = {
                    left: obj.left,
                    top: obj.top,
                    width: obj.width,
                    height: obj.height
                };
                this.removeClass('is-dragging');
                dropHandler(position, key);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
};

Element.prototype.stopDraggable = function () {
    if (this.isDraggable) {
        const newEl = this.cloneNode(true);
        this.parentNode.replaceChild(newEl, this);
        this.dragging = false;
    }
};
