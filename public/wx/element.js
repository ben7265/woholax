// enhance default Javascript element to have additional helper functions

const _traverseNodes = (element, callback) => {
    callback(element);
    element.childNodes.forEach(child => _traverseNodes(child, callback));
};

const enhanceElements = () => {
    const body = document.querySelector('body');
    _traverseNodes(body, (element) => {
        // arrow functions on the prototype do not have 'this' scope defined
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
            else
            {
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
            else
            {
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
            else
            {
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
    });    
};
