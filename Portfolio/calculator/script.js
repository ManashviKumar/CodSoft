class SafeCalculator {
    constructor() {
        this.display = document.getElementById('display');
        this.expressionDisplay = document.getElementById('expressionDisplay');
        this.historyList = document.getElementById('historyList');
        this.currentInput = '0';
        this.shouldResetScreen = false;
        this.history = JSON.parse(localStorage.getItem('calc_history')) || [];

        this.initEventListeners();
        this.renderHistory();
    }

    initEventListeners() {
        // Event Delegation for Keypad
        document.getElementById('keypad').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const { value, action } = btn.dataset;
            if (value !== undefined) this.handleInput(value);
            if (action) this.handleAction(action);
        });

        // Keyboard Support
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            if (/[0-9+\-*/.%]/.test(key)) {
                e.preventDefault();
                this.highlightKey(key);
                this.handleInput(key);
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                this.highlightKey('calculate', true);
                this.handleAction('calculate');
            } else if (key === 'Backspace') {
                e.preventDefault();
                this.highlightKey('backspace', true);
                this.handleAction('backspace');
            } else if (key === 'Escape') {
                e.preventDefault();
                this.highlightKey('clear', true);
                this.handleAction('clear');
            }
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', (e) => {
            const isLight = document.body.getAttribute('data-theme') === 'light';
            document.body.setAttribute('data-theme', isLight ? 'dark' : 'light');
            e.target.textContent = isLight ? '☀️' : '🌙';
        });

        // History Panel Toggle & Clear
        document.getElementById('historyToggle').addEventListener('click', () => {
            document.getElementById('historyPanel').classList.toggle('hidden');
        });

        document.getElementById('clearHistory').addEventListener('click', () => {
            this.history = [];
            localStorage.removeItem('calc_history');
            this.renderHistory();
        });
    }

    highlightKey(identifier, isAction = false) {
        const selector = isAction ? `[data-action="${identifier}"]` : `[data-value="${identifier}"]`;
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 120);
        }
    }

    isOperator(char) {
        return ['+', '-', '*', '/', '%'].includes(char);
    }

    handleInput(value) {
        if (this.currentInput === 'Error' || this.currentInput === 'Cannot divide by 0') {
            this.currentInput = '0';
        }

        if (this.shouldResetScreen && !this.isOperator(value)) {
            this.currentInput = '0';
            this.shouldResetScreen = false;
        }
        this.shouldResetScreen = false;

        const lastChar = this.currentInput.slice(-1);

        // Prevent consecutive operators (replace the previous operator instead)
        if (this.isOperator(value)) {
            if (this.isOperator(lastChar)) {
                this.currentInput = this.currentInput.slice(0, -1) + value;
            } else {
                this.currentInput += value;
            }
            this.updateDisplay();
            return;
        }

        // Prevent multiple decimals in the current number token
        if (value === '.') {
            const parts = this.currentInput.split(/[+\-*/%]/);
            const currentNumber = parts[parts.length - 1];
            if (currentNumber.includes('.')) return;
            if (currentNumber === '') {
                this.currentInput += '0.';
                this.updateDisplay();
                return;
            }
        }

        // Replace leading zero
        if (this.currentInput === '0' && value !== '.') {
            this.currentInput = value;
        } else {
            this.currentInput += value;
        }

        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.currentInput = '0';
                this.expressionDisplay.textContent = '';
                this.shouldResetScreen = false;
                break;

            case 'backspace':
                if (this.shouldResetScreen || this.currentInput.length === 1 || this.currentInput === 'Error') {
                    this.currentInput = '0';
                    this.shouldResetScreen = false;
                } else {
                    this.currentInput = this.currentInput.slice(0, -1);
                }
                break;

            case 'negate':
                if (this.currentInput !== '0' && !this.isOperator(this.currentInput.slice(-1))) {
                    this.currentInput = this.currentInput.startsWith('-')
                        ? this.currentInput.slice(1)
                        : '-' + this.currentInput;
                }
                break;

            case 'calculate':
                this.evaluateExpression();
                return;
        }
        this.updateDisplay();
    }

    // Safe Mathematical Parser (Shunting-Yard Algorithm) - Replaces unsafe eval()
    evaluateExpression() {
        let expr = this.currentInput;
        if (this.isOperator(expr.slice(-1))) {
            expr = expr.slice(0, -1); // Trim trailing operator
        }

        try {
            const tokens = this.tokenize(expr);
            const rpn = this.toRPN(tokens);
            const result = this.computeRPN(rpn);

            if (!isFinite(result)) {
                this.expressionDisplay.textContent = expr;
                this.currentInput = 'Cannot divide by 0';
                this.shouldResetScreen = true;
                this.updateDisplay();
                return;
            }

            // Fix floating point precision issues (e.g., 0.1 + 0.2 = 0.3)
            const formattedResult = String(Math.round((result + Number.EPSILON) * 1e10) / 1e10);

            this.addToHistory(expr, formattedResult);
            this.expressionDisplay.textContent = `${expr} =`;
            this.currentInput = formattedResult;
            this.shouldResetScreen = true;
        } catch (err) {
            this.currentInput = 'Error';
            this.shouldResetScreen = true;
        }
        this.updateDisplay();
    }

    tokenize(expr) {
        const tokens = [];
        let numBuffer = '';

        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            const isUnaryMinus = char === '-' && (i === 0 || this.isOperator(expr[i - 1]));

            if (/[0-9.]/.test(char) || isUnaryMinus) {
                numBuffer += char;
            } else if (this.isOperator(char)) {
                if (numBuffer !== '') {
                    tokens.push(parseFloat(numBuffer));
                    numBuffer = '';
                }
                tokens.push(char);
            }
        }
        if (numBuffer !== '') tokens.push(parseFloat(numBuffer));
        return tokens;
    }

    toRPN(tokens) {
        const output = [];
        const ops = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

        for (const token of tokens) {
            if (typeof token === 'number') {
                output.push(token);
            } else if (token in precedence) {
                while (ops.length && precedence[ops[ops.length - 1]] >= precedence[token]) {
                    output.push(ops.pop());
                }
                ops.push(token);
            }
        }
        while (ops.length) output.push(ops.pop());
        return output;
    }

    computeRPN(rpn) {
        const stack = [];
        for (const token of rpn) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                switch (token) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': stack.push(a / b); break;
                    case '%': stack.push(a % b); break;
                }
            }
        }
        return stack[0];
    }

    addToHistory(expression, result) {
        this.history.unshift({ expression, result });
        if (this.history.length > 20) this.history.pop();
        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<li class="empty-msg">No calculations yet</li>';
            return;
        }

        this.historyList.innerHTML = this.history.map((item, idx) => `
            <li class="history-item" data-index="${idx}">
                <span class="hist-expr">${item.expression} =</span>
                <span class="hist-res">${item.result}</span>
            </li>
        `).join('');

        this.historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const item = this.history[el.dataset.index];
                this.currentInput = item.result;
                this.expressionDisplay.textContent = `${item.expression} =`;
                this.shouldResetScreen = true;
                this.updateDisplay();
            });
        });
    }

    updateDisplay() {
        this.display.value = this.currentInput;
    }
}

document.addEventListener('DOMContentLoaded', () => new SafeCalculator());