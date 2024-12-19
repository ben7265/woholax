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
        modal.style = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: #ffffff;border-radius: 5px;box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);border: 1px solid darkgrey; width: fit-content';

        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        modal.appendChild(messageElement);
        messageElement.style = 'padding: 20px; width: fit-content';

        const closeButton = document.createElement('div');
        closeButton.innerHTML = '<img style="margin: 3px;width:20px" src="icons/close.svg"/>';
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

    getUserValue: async (name, type, title, fargs, listener) => {
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

            const apply = ['value', 'min', 'max', 'step'];
            input.setAttribute('name', name);
            input.setAttribute('type', type);

            apply.forEach((att) => {
                if (attribs[att]) {
                    input.setAttribute(att, attribs[att] || '');
                }
            });

            label.style = 'margin-right: 2px;';
            input.style = input.type != 'color' ? 'padding: 5px; margin: 5px; border: 1px solid lightgrey;' : 'margin: 5px;';

            input.addEventListener('change', () => {
                listener && listener(input.value);
            });

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
                const data = form.validatedFormData();
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

    getToolbarParent: (event) => {
        var element = event.target;

        const toolbar = element.closest('.wx-xten-toolbar');
        if (toolbar) {
            return toolbar.parentElement;
        }

        var target = element.closest('[target]');
        if (target) {
            return element.closest(target.getAttribute('target'));
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

    closestXten: (e, name) => {
        return e.closest('.wx-xten-' + name);
    },

    curl: async (url, method = 'GET', data = null, contentType = 'application/json') => {
        const options = {
            method: method,
            headers: {}
        };
    
        if (data) {
            options.body = typeof data === 'string' ? data : JSON.stringify(data);
            options.headers['Content-Type'] = contentType;
        }
    
        try {
            const response = await fetch(url, options);
            const responseData = await response.text();
    
            return {
                success: response.ok,
                statusCode: response.status,
                data: response.ok ? responseData : null,
                error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
            };
        } catch (error) {
            return {
                success: false,
                statusCode: null,
                data: null,
                error: error.message
            };
        }
    },
};
