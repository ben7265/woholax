// enhance default Javascript element to have additional helper functions
Element.prototype.traverse = function (callback) {
    _traverseNodes(this, callback);
};

Element.prototype.getId = function () {
    return this.getAttribute('id');
};

Element.prototype.getName = function () {
    return this.getAttribute('name');
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
    const str = className.trim();
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

// local events related functions
const listeners = {};

Element.prototype.notify = function (message, data, target) {
    const event = new CustomEvent(message, {
        bubbles: true,
        detail: data
    });
    this.dispatchEvent(event);
};

Element.prototype.checkAccess = function () {
    const user = getUser();
    var allow = this.getAttribute('allow');
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

// link functions to elements
Element.prototype.attach = function (name, fn) {
    if (!this.xfns) {
        this.xfns = {};
    }
    this.xfns[name] = fn;
};

Element.prototype.invoke = function (name, ...args) {
    const fn = this.xfns ? this.xfns[name] : null;
    if (!fn) {
        console.error('function ' + name + ' not found in xten ' + xtname);
        return;
    }
    return fn(this, ...args);
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
    }

    return this.value;
};

Element.prototype.validate = function () {
    this.removeClass('invalid-value');
    var errorElement = this.nextElementSibling;
    if (errorElement && errorElement.hasClass('input-error-message')) {
        errorElement.style.display = 'none';
    }

    var valid = this.checkValidity();
    if (!valid) {
        this.validationError = this.validationMessage;
    }
    else 
    {
        delete this.validateError;

        const validate = this.getAttribute('validate');
        if (validate) {
            const checks = validate.split(/\s*\,\s*/);
            for (var i = 0; i < checks.length; i++) {
                const _check = checks[i].trim();
                const matches = _check.match(/^([a-z]+)\s*(\(\s*(.*)\s*\))?$/);
                const _fname = matches[1];
                if (!_fname || !validations[_fname]) {
                    this.validationError = 'validation ' + _fname + ' not defined';
                    this.addClass('invalid-value');
                    valid = false;
                    break;
                }
                const _args = matches[3];
                const error = validations[_fname](value, _args);
                if (error) {
                    this.validationError = error;
                    this.addClass('invalid-value');
                    valid = false;
                    break;
                }
            }
        }
    }

    if (valid) {
        return true;
    }

    this.addClass('invalid-value');

    errorElement = this.nextElementSibling;

    if (!errorElement || !errorElement.hasClass('input-error-message')) {
        errorElement = document.createElement('div');
        errorElement.addClass('input-error-message');
        this.parentNode.insertAfter(errorElement, this);
        errorElement.textContent = this.validationMessage;
        errorElement.style.display = 'block';
    }
}

Element.prototype.validateForm = function () {
    if (this.tagName.toLowerCase() != 'form') {
        return false;
    }

    const valid = true;
    for (var i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        const _valid = element.validate();
        if (!_valid) {
            valid = false;
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
    if (captcha) {
        if (data.gotcha) {
            console.error('Suspected BOT click');
            captcha.invoke('clear', captcha);
            return null;
        }

        if (!data['check-human']) {
            captcha.invoke('clear', captcha);
            wxfns.error('Cannot Send Message', 'Bot check failed');
            return null;
        }
    }

    const valid = this.validateForm();
    if (!valid) {
        captcha && captcha.invoke('clear', captcha);

        /* ### show errors and other error processing */

        return null;
    }

    return this.getFormData();
};

Element.prototype.validatedFormData = function () {
    if (this.tagName.toLowerCase() != 'form') {
        console.error('validatedFormData called on a non form element', this.tagName, this.getId());
        return null;
    }

    const captcha = this.querySelector('.wx-xten-check-human');
    if (captcha) {
        if (data.gotcha) {
            console.error('Suspected BOT click');
            captcha.invoke('clear', captcha);
            return null;
        }

        if (!data['check-human']) {
            captcha.invoke('clear', captcha);
            wxfns.error('Cannot Send Message', 'Bot check failed');
            return null;
        }
    }

    const valid = this.validateForm();
    if (!valid) {
        captcha && captcha.invoke('clear', captcha);

        /* ### show errors and other error processing */

        return null;
    }

    return this.getFormData();
};

Element.prototype.clearForm = function () {
    if (this.tagName.toLowerCase() != 'form') {
        console.error('clearForm called on a non form element', this.tagName, this.getId());
        return null;
    }

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

Element.prototype.__validate_not_used = function () {
    const value = this.getValue();
    if (!this.checkValidity()) {
        this.validationError = 'field is required';
    }

    const validate = this.getAttribute('validate');
    const required = this.getAttribute('required') === 'true' || this.getAttribute('required') == 'required';

    delete this.validationError;
    this.removeClass('invalid-value');

    if (!value && required) {
        this.validationError = 'field is required';
        this.addClass('invalid-value');
        return false;
    }

    if (!validate) {
        return true;
    }

    const checks = validate.split(/\s*\,\s*/);
    for (var i = 0; i < checks.length; i++) {
        const _check = checks[i].trim();
        const matches = _check.match(/^([a-z]+)\s*(\(\s*(.*)\s*\))?$/);
        const _fname = matches[1];
        if (!_fname || !validations[_fname]) {
            this.validationError = 'validation ' + _fname + ' not defined';
            this.addClass('invalid-value');
            return false;
        }
        const _args = matches[3];
        const error = validations[_fname](value, _args);
        if (error) {
            this.validationError = error;
            this.addClass('invalid-value');
            return false;
        }
    }

    return true;
};
