const themeBtn = document.getElementById("themeBtn");

let currentPage = "home";

function updateThemeButtonIcon(theme) {
    if (!themeBtn) return;
    const isDark = theme === "dark";
    const isEnglish = document.documentElement.lang === "en";
    const icon = themeBtn.querySelector(".theme-icon");
    if (icon) {
        icon.src = isDark ? "assets/icons/sun.svg" : "assets/icons/moon.svg";
        icon.alt = isDark
            ? (isEnglish ? "Light mode" : "حالت روشن")
            : (isEnglish ? "Dark mode" : "حالت تاریک");
    }
    themeBtn.setAttribute(
        "aria-label",
        isDark
            ? (isEnglish ? "Switch to light mode" : "تغییر به حالت روشن")
            : (isEnglish ? "Switch to dark mode" : "تغییر به حالت تاریک")
    );
    themeBtn.title = isDark
        ? (isEnglish ? "Light mode" : "حالت روشن")
        : (isEnglish ? "Dark mode" : "حالت تاریک");
}


// تغییر حالت روشن و تاریک
themeBtn.addEventListener("click", () => {

    const isDark = document.body.classList.toggle("dark");

    const theme = isDark ? "dark" : "light";

    updateThemeButtonIcon(theme);

    localStorage.setItem("mathmateTheme", theme);
    window.dispatchEvent(new Event("mathmate:settings-changed"));

    themeOptions.forEach((button) => {
        button.classList.remove("active");

        if (button.dataset.theme === theme) {
            button.classList.add("active");
        }
    });

});

// فعال شدن آیتم‌های نوار پایین
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((item) => {
    item.addEventListener("click", () => {

        navItems.forEach((nav) => {
            nav.classList.remove("active");
        });

        item.classList.add("active");

    });
});

// دکمه شروع
const startBtn = document.querySelector(".start-btn");

if (startBtn) {
    startBtn.addEventListener("click", () => {
        const btn = document.getElementById("moreToolsBtn");
        if (btn) btn.click();
        else {
            // fallback open tools
            currentPage = "tools";
            if (typeof activateToolsNav === "function") activateToolsNav();
            hideAllPages();
            document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
            document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
            document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
            document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
            if (toolsPage) toolsPage.classList.add("show");
            if (typeof setActiveSidebar === "function") setActiveSidebar("tools");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}

// ================= CALCULATOR PAGE =================

const calculatorCard = document.getElementById("calculatorCard");
const calculatorPage = document.getElementById("calculatorPage");
const calculatorBack = document.getElementById("calculatorBack");

calculatorCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش ماشین حساب
    calculatorPage.classList.add("show");

    // مخفی کردن نوار پایین
    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
calculatorBack.addEventListener("click", () => {

    // مخفی کردن ماشین حساب
    calculatorPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // صفحه ابزارها را دوباره نشان بده
        toolsPage.classList.add("show");

    } else {

        // صفحه خانه را دوباره نشان بده
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    // نمایش نوار پایین
    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= CALCULATOR LOGIC =================

const calcDisplay = document.getElementById("calculatorDisplay");
const calcButtons = document.querySelectorAll(".calc-btn");

let currentExpression = "";
let justCalculated = false;
// When user presses %, we keep the decimal value in currentExpression for math,
// but show the original number with a "%" sign so it is not confusing.
let percentDisplaySuffix = null; // e.g. "25%" while expression holds 0.25

function normalizeMathInput(source) {
    return String(source ?? '')
        .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
        .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
        .replace(/[×✕]/g, '*').replace(/[÷]/g, '/').replace(/[−–]/g, '-')
        .replace(/[٫،]/g, '.').replace(/\s+/g, '');
}
function parseMathExpression(source, allowVariable = false) {
    const text = normalizeMathInput(source);
    if (!text) throw new Error('empty');
    const tokens = [];
    let offset = 0;
    const tokenPattern = /(?:\d+(?:\.\d*)?|\.\d+)|[xX]|[+\-*/^()%√()]/y;
    while (offset < text.length) {
        tokenPattern.lastIndex = offset;
        const match = tokenPattern.exec(text);
        if (!match || match.index !== offset) throw new Error('invalid');
        const token = match[0];
        if (/^[xX]$/.test(token) && !allowVariable) throw new Error('variable');
        tokens.push(token);
        offset = tokenPattern.lastIndex;
    }
    let index = 0;
    const peek = () => tokens[index] || '';
    const take = () => tokens[index++] || '';
    const startsPrimary = token => token === '(' || token === '√' || token === 'x' || token === 'X' || /^\d/.test(token) || /^\./.test(token);
    function parseAdditive() {
        let node = parseMultiplicative();
        while (peek() === '+' || peek() === '-') { const op = take(); node = { type:'binary', op, left:node, right:parseMultiplicative() }; }
        return node;
    }
    function parseMultiplicative() {
        let node = parseUnary();
        while (['*','/','%'].includes(peek()) || startsPrimary(peek())) {
            let op = peek();
            if (['*','/','%'].includes(op)) take(); else op = '*';
            node = { type:'binary', op, left:node, right:parseUnary() };
        }
        return node;
    }
    function parseUnary() {
        if (peek() === '+' || peek() === '-') return { type:'unary', op:take(), value:parseUnary() };
        if (peek() === '√') { take(); return { type:'sqrt', value:parseUnary() }; }
        return parsePower();
    }
    function parsePower() {
        let node = parsePrimary();
        if (peek() === '^') { take(); node = { type:'binary', op:'^', left:node, right:parseUnary() }; }
        return node;
    }
    function parsePrimary() {
        const token = take();
        if (!token) throw new Error('incomplete');
        if (token === '(') {
            const node = parseAdditive();
            if (take() !== ')') throw new Error('parenthesis');
            return node;
        }
        if (token === 'x' || token === 'X') return { type:'variable' };
        if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) {
            const value = Number(token);
            if (!Number.isFinite(value)) throw new Error('number');
            return { type:'number', value };
        }
        throw new Error('invalid');
    }
    const ast = parseAdditive();
    if (index !== tokens.length) throw new Error(peek() === ')' ? 'parenthesis' : 'invalid');
    return ast;
}
function finiteMathResult(value) {
    if (!Number.isFinite(value)) throw new Error('range');
    return Object.is(value, -0) || Math.abs(value) < 1e-14 ? 0 : value;
}
function evaluateMathAst(node) {
    if (node.type === 'number') return node.value;
    if (node.type === 'variable') throw new Error('variable');
    if (node.type === 'unary') return finiteMathResult(node.op === '-' ? -evaluateMathAst(node.value) : evaluateMathAst(node.value));
    if (node.type === 'sqrt') { const value=evaluateMathAst(node.value); if (value < 0) throw new Error('sqrt'); return finiteMathResult(Math.sqrt(value)); }
    const left=evaluateMathAst(node.left), right=evaluateMathAst(node.right);
    if ((node.op === '/' || node.op === '%') && right === 0) throw new Error('zero');
    if (node.op === '+') return finiteMathResult(left+right);
    if (node.op === '-') return finiteMathResult(left-right);
    if (node.op === '*') return finiteMathResult(left*right);
    if (node.op === '/') return finiteMathResult(left/right);
    if (node.op === '%') return finiteMathResult(left%right);
    if (node.op === '^') return finiteMathResult(Math.pow(left,right));
    throw new Error('invalid');
}
function safeEvaluate(expr) { return evaluateMathAst(parseMathExpression(expr, false)); }
function evaluateLinearAst(node) {
    if (node.type === 'number') return { a:0, b:node.value };
    if (node.type === 'variable') return { a:1, b:0 };
    if (node.type === 'unary') { const v=evaluateLinearAst(node.value), sign=node.op==='-'?-1:1; return {a:v.a*sign,b:v.b*sign}; }
    if (node.type === 'sqrt') { const v=evaluateLinearAst(node.value); if (Math.abs(v.a)>1e-12 || v.b<0) throw new Error('nonlinear'); return {a:0,b:Math.sqrt(v.b)}; }
    const left=evaluateLinearAst(node.left), right=evaluateLinearAst(node.right);
    if (node.op === '+') return {a:left.a+right.a,b:left.b+right.b};
    if (node.op === '-') return {a:left.a-right.a,b:left.b-right.b};
    if (node.op === '*') {
        if (Math.abs(left.a)>1e-12 && Math.abs(right.a)>1e-12) throw new Error('nonlinear');
        return Math.abs(left.a)>1e-12 ? {a:left.a*right.b,b:left.b*right.b} : {a:right.a*left.b,b:right.b*left.b};
    }
    if (node.op === '/') {
        if (Math.abs(right.a)>1e-12) throw new Error('nonlinear');
        if (right.b===0) throw new Error('zero');
        return {a:left.a/right.b,b:left.b/right.b};
    }
    if (node.op === '^') {
        if (Math.abs(right.a)>1e-12) throw new Error('nonlinear');
        if (Math.abs(left.a)<1e-12) return {a:0,b:finiteMathResult(Math.pow(left.b,right.b))};
        if (right.b===1) return left;
        if (right.b===0) return {a:0,b:1};
        throw new Error('nonlinear');
    }
    if (node.op === '%') {
        if (Math.abs(left.a)>1e-12 || Math.abs(right.a)>1e-12) throw new Error('nonlinear');
        if (right.b===0) throw new Error('zero');
        return {a:0,b:left.b%right.b};
    }
    throw new Error('invalid');
}
function solveLinearEquation(source) {
    const normalized=normalizeMathInput(source);
    const equalAt=normalized.indexOf('=');
    if (equalAt < 0 || equalAt !== normalized.lastIndexOf('=')) throw new Error('equation');
    const leftText=normalized.slice(0,equalAt), rightText=normalized.slice(equalAt+1);
    if (!leftText || !rightText) throw new Error('equation');
    const left=evaluateLinearAst(parseMathExpression(leftText,true));
    const right=evaluateLinearAst(parseMathExpression(rightText,true));
    const coefficient=left.a-right.a, constant=right.b-left.b;
    if (Math.abs(coefficient)<1e-12) {
        if (Math.abs(constant)<1e-12) return { type:'infinite' };
        return { type:'none' };
    }
    return { type:'solution', value:finiteMathResult(constant/coefficient) };
}
function formatCalculatorNumber(value) {
    const clean=finiteMathResult(Number(value.toPrecision(12)));
    return String(clean);
}
function calculatorMessage(error) {
    const en=document.documentElement.lang==='en';
    const messages={
        empty:en?'Enter an expression first.':'ابتدا یک عبارت وارد کن.',
        zero:en?'Division by zero is not allowed.':'تقسیم بر صفر مجاز نیست.',
        sqrt:en?'The square root of a negative number is not real.':'ریشهٔ دوم عدد منفی در اعداد حقیقی تعریف نشده است.',
        variable:en?'Use x only in a one-variable equation.':'نماد x فقط در معادلهٔ یک‌مجهولی قابل استفاده است.',
        nonlinear:en?'Only linear equations in x are supported.':'در این بخش فقط معادله‌های خطیِ یک‌مجهولی پشتیبانی می‌شوند.',
        equation:en?'Enter one equation with exactly one = sign.':'یک معادله با دقیقاً یک علامت = وارد کن.',
        parenthesis:en?'Check the parentheses.':'پرانتزها را بررسی کن.',
        incomplete:en?'The expression is incomplete.':'عبارت ناقص است.',
        range:en?'The result is outside the supported numeric range.':'نتیجه خارج از محدودهٔ عددی قابل پشتیبانی است.',
        number:en?'Enter a valid number.':'یک عدد معتبر وارد کن.',
        invalid:en?'The expression contains unsupported input.':'عبارت شامل نویسه یا عملگر پشتیبانی‌نشده است.'
    };
    return messages[error?.message] || messages.invalid;
}
function toggleCalculatorSign() {
    if (justCalculated) {
        try { currentExpression=formatCalculatorNumber(-safeEvaluate(currentExpression)); percentDisplaySuffix=null; return; }
        catch (_) { justCalculated=false; }
    }
    const match=currentExpression.match(/(?:\d+(?:\.\d*)?|\.\d+)$/);
    if (!match) {
        if (!currentExpression) currentExpression='-';
        else if (currentExpression.endsWith('-') && (currentExpression.length===1 || /[+\-*/^(]/.test(currentExpression[currentExpression.length-2]))) currentExpression=currentExpression.slice(0,-1);
        else if (/[+\-*/^(]$/.test(currentExpression)) currentExpression+='-';
        return;
    }
    const start=match.index, number=match[0], previous=currentExpression[start-1]||'', beforePrevious=currentExpression[start-2]||'';
    if (previous==='-' && (start-1===0 || /[+\-*/^(^√]/.test(beforePrevious))) {
        currentExpression=currentExpression.slice(0,start-1)+currentExpression.slice(start);
    } else if (start===0) {
        currentExpression='-'+number;
    } else if (previous==='(') {
        currentExpression=currentExpression.slice(0,start)+'-'+number;
    } else {
        currentExpression=currentExpression.slice(0,start)+'-'+number;
    }
    percentDisplaySuffix=null;
}
function applyCalculatorSquareRoot() {
    if (justCalculated) {
        currentExpression=`√(${currentExpression})`;
        justCalculated=false; percentDisplaySuffix=null; return;
    }
    const match=currentExpression.match(/(?:\d+(?:\.\d*)?|\.\d+)$/);
    if (match) {
        currentExpression=currentExpression.slice(0,match.index)+`√(${match[0]})`;
    } else if (!currentExpression || /[+\-*/^(]$/.test(currentExpression)) {
        currentExpression+='√';
    } else if (currentExpression.endsWith(')')) {
        currentExpression+='*√';
    } else {
        currentExpression=`√(${currentExpression})`;
    }
    justCalculated=false; percentDisplaySuffix=null;
}

function renderCalculatorDisplay() {
    if (!calcDisplay) return;
    if (percentDisplaySuffix != null && currentExpression !== "") {
        // Show human-friendly percent (e.g. 25%) while value is stored as decimal.
        const displayExpression = currentExpression
            .replace(/\*/g, "×")
            .replace(/\//g, "÷");
        // Replace trailing decimal that came from % with the labeled form
        const replaced = displayExpression.replace(
            /(\d+(?:\.\d+)?)$/,
            percentDisplaySuffix
        );
        calcDisplay.textContent = replaced || "0";
        return;
    }
    const displayExpression = currentExpression
        .replace(/\*/g, "×")
        .replace(/\//g, "÷");
    calcDisplay.textContent = displayExpression || "0";
}

function appendCalculatorValue(value) {
    if (/^\d$/.test(value)) {
        if (justCalculated) {
            currentExpression = "";
            justCalculated = false;
        }
        percentDisplaySuffix = null;
        currentExpression += value;
        return;
    }

    if (value === ".") {
        if (justCalculated) {
            currentExpression = "";
            justCalculated = false;
        }
        percentDisplaySuffix = null;
        const trailingNumber = currentExpression.match(/(?:\d+(?:\.\d*)?|\.\d+)$/);
        if (trailingNumber) {
            if (!trailingNumber[0].includes(".")) currentExpression += ".";
        } else if (!currentExpression || /[+\-*/^(√^]$/.test(currentExpression)) {
            currentExpression += "0.";
        } else if (currentExpression.endsWith(")")) {
            currentExpression += "*0.";
        }
        return;
    }

    if (["+", "-", "*", "/"].includes(value)) {
        justCalculated = false;
        percentDisplaySuffix = null;
        if (!currentExpression) {
            if (value === "-") currentExpression = "-";
            return;
        }
        if (/[+\-*/]$/.test(currentExpression)) {
            currentExpression = currentExpression.slice(0, -1) + value;
        } else {
            currentExpression += value;
        }
        return;
    }

    if (value === "%") {
        const match = currentExpression.match(/(\d+(?:\.\d+)?)$/);
        if (match) {
            const original = match[1];
            const numeric = Number(original) / 100;
            // Avoid ugly floating noise (e.g. 0.30000000000000004)
            const clean = String(Number(numeric.toFixed(12)));
            currentExpression = currentExpression.slice(0, -original.length) + clean;
            percentDisplaySuffix = original + "%";
            justCalculated = false;
        }
    }
}

calcButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;
        if (!calcDisplay) return;

        if (value === "C") {
            currentExpression = "";
            justCalculated = false;
            percentDisplaySuffix = null;
            renderCalculatorDisplay();
            return;
        }

        if (value === "DEL") {
            if (justCalculated) justCalculated = false;
            if (percentDisplaySuffix != null) {
                // Undo percent: restore original number from label
                const orig = percentDisplaySuffix.replace(/%$/, "");
                const match = currentExpression.match(/(\d+(?:\.\d+)?)$/);
                if (match) {
                    currentExpression = currentExpression.slice(0, -match[1].length) + orig;
                }
                percentDisplaySuffix = null;
            } else {
                currentExpression = currentExpression.slice(0, -1);
            }
            renderCalculatorDisplay();
            return;
        }

        if (value === "SIGN") { toggleCalculatorSign(); renderCalculatorDisplay(); return; }
        if (value === "SQRT") { applyCalculatorSquareRoot(); renderCalculatorDisplay(); return; }
        if (value === "POWER") {
            if (justCalculated) justCalculated = false;
            if (currentExpression && !/[+\-*/^.(√]$/.test(currentExpression)) currentExpression += "^";
            percentDisplaySuffix = null; renderCalculatorDisplay(); return;
        }
        if (value === "LPAREN") {
            if (justCalculated) { currentExpression = ""; justCalculated = false; }
            if (!currentExpression || /[+\-*/^(√]$/.test(currentExpression)) currentExpression += "(";
            else currentExpression += "*(";
            percentDisplaySuffix = null; renderCalculatorDisplay(); return;
        }
        if (value === "RPAREN") {
            const opens=(currentExpression.match(/\(/g)||[]).length, closes=(currentExpression.match(/\)/g)||[]).length;
            if (opens>closes && !/[+\-*/^(√]$/.test(currentExpression)) currentExpression += ")";
            percentDisplaySuffix = null; renderCalculatorDisplay(); return;
        }

        if (value === "=") {
            if (!currentExpression || /[+\-*/^.(√]$/.test(currentExpression)) return;
            try {
                const result = safeEvaluate(currentExpression);
                currentExpression = formatCalculatorNumber(result);
                justCalculated = true;
                percentDisplaySuffix = null;
                renderCalculatorDisplay();
            } catch (error) {
                calcDisplay.textContent = calculatorMessage(error);
                currentExpression = "";
                justCalculated = false;
                percentDisplaySuffix = null;
            }
            return;
        }

        appendCalculatorValue(value);
        renderCalculatorDisplay();
    });
});

// ================= SAFE EXPRESSION / LINEAR EQUATION CALCULATOR =================
(() => {
    const input=document.getElementById('calcExpressionInput');
    const submit=document.getElementById('calcExpressionSubmit');
    const output=document.getElementById('calcExpressionResult');
    if (!input || !submit || !output) return;
    let outputClearTimer=null;
    const clearOutputLater=(ms=3000)=>{
        if(outputClearTimer) clearTimeout(outputClearTimer);
        outputClearTimer=setTimeout(()=>{
            if(output.classList.contains('is-error')){
                output.textContent='';
                output.classList.remove('is-error','is-success');
            }
        }, ms);
    };
    const calculate=() => {
        const source=input.value.trim();
        if(outputClearTimer){ clearTimeout(outputClearTimer); outputClearTimer=null; }
        output.classList.remove('is-error','is-success');
        if (!source) {
            output.textContent=calculatorMessage(new Error('empty'));
            output.classList.add('is-error');
            clearOutputLater(3000);
            return;
        }
        try {
            if (source.includes('=')) {
                const solution=solveLinearEquation(source);
                const en=document.documentElement.lang==='en';
                if (solution.type==='infinite') output.textContent=en?'Every real value of x is a solution.':'این معادله بی‌نهایت جواب دارد.';
                else if (solution.type==='none') output.textContent=en?'The equation has no solution.':'این معادله جواب ندارد.';
                else output.textContent=`x = ${formatCalculatorNumber(solution.value)}`;
            } else {
                output.textContent=`= ${formatCalculatorNumber(safeEvaluate(source))}`;
            }
            output.classList.add('is-success');
        } catch (error) {
            output.textContent=calculatorMessage(error);
            output.classList.add('is-error');
            clearOutputLater(3000);
        }
    };
    submit.addEventListener('click',calculate);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();calculate();}});
})();

// ================= MULTIPLES PAGE =================

const multiplesCard = document.getElementById("multiplesCard");
const multiplesPage = document.getElementById("multiplesPage");
const multiplesBack = document.getElementById("multiplesBack");

multiplesCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه مضرب‌ها
    multiplesPage.classList.add("show");

    // مخفی کردن نوار پایین
    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت از مضرب‌ها
multiplesBack.addEventListener("click", () => {

    multiplesPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= MULTIPLES LOGIC =================

const multipleNumber = document.getElementById("multipleNumber");
const multipleCount = document.getElementById("multipleCount");
const calculateMultiples = document.getElementById("calculateMultiples");
const multiplesResult = document.getElementById("multiplesResult");
const multiplesList = document.getElementById("multiplesList");


calculateMultiples.addEventListener("click", () => {

    // گرفتن عدد واردشده
    const number = Number(multipleNumber.value);
    const count = Number(multipleCount.value);

    // بررسی اینکه کاربر عدد وارد کرده باشد
    if (!multipleNumber.value || !multipleCount.value) {
        void mmAlert(translateKey("alert_calc_both"));
        return;
    }

    // بررسی معتبر بودن اعداد
    if (!Number.isFinite(number) || !Number.isInteger(count) || count <= 0) {
        void mmAlert(translateKey("alert_calc_numbers"));
        return;
    }

    // پاک کردن نتایج قبلی
    multiplesList.innerHTML = "";

    // ساخت مضرب‌ها
    for (let i = 1; i <= count; i++) {

        const multiple = number * i;

        const item = document.createElement("div");

        item.classList.add("multiple-item");

        item.textContent = multiple;

        multiplesList.appendChild(item);
    }

    // نمایش بخش نتیجه
    multiplesResult.classList.add("show");
});

// ================= GEOMETRY PAGE =================

const geometryCard = document.getElementById("geometryCard");
const geometryPage = document.getElementById("geometryPage");
const geometryBack = document.getElementById("geometryBack");


// باز کردن صفحه مساحت و محیط
geometryCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه هندسه
    geometryPage.classList.add("show");

    // مخفی کردن نوار پایین
    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
geometryBack.addEventListener("click", () => {

    // مخفی کردن صفحه هندسه
    geometryPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

    } else {

        // نمایش صفحه خانه
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    // نمایش نوار پایین
    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= GEOMETRY LOGIC =================

const shapeCards = document.querySelectorAll(".shape-card");
const geometryInputs = document.getElementById("geometryInputs");
const calculateGeometry = document.getElementById("calculateGeometry");
const geometryResult = document.getElementById("geometryResult");
const areaResult = document.getElementById("areaResult");
const perimeterResult = document.getElementById("perimeterResult");

let selectedShape = "rectangle";


// نمایش ورودی‌های مربوط به هر شکل
function showGeometryInputs(shape) {
    const isEnglish = document.documentElement.lang === "en";
    const text = isEnglish ? {
        length: "Length", width: "Width", side: "Side length",
        base: "Base", height: "Height", side1: "Side 1", side2: "Side 2", radius: "Radius"
    } : {
        length: "طول", width: "عرض", side: "اندازه ضلع",
        base: "قاعده", height: "ارتفاع", side1: "ضلع اول", side2: "ضلع دوم", radius: "شعاع"
    };
    const example = isEnglish ? "e.g. " : "مثلاً ";

    if (shape === "rectangle") {
        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>${text.length}</label>
                <input type="number" id="length" placeholder="${example}10">
            </div>
            <div class="geometry-input">
                <label>${text.width}</label>
                <input type="number" id="width" placeholder="${example}5">
            </div>
        `;
    } else if (shape === "square") {
        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>${text.side}</label>
                <input type="number" id="side" placeholder="${example}8">
            </div>
        `;
    } else if (shape === "triangle") {
        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>${text.base}</label>
                <input type="number" id="base" placeholder="${example}10">
            </div>
            <div class="geometry-input">
                <label>${text.height}</label>
                <input type="number" id="height" placeholder="${example}6">
            </div>
            <div class="geometry-input">
                <label>${text.side1}</label>
                <input type="number" id="side1" placeholder="${example}8">
            </div>
            <div class="geometry-input">
                <label>${text.side2}</label>
                <input type="number" id="side2" placeholder="${example}7">
            </div>
        `;
    } else if (shape === "circle") {
        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>${text.radius}</label>
                <input type="number" id="radius" placeholder="${example}5">
            </div>
        `;
    }
}



// انتخاب شکل
shapeCards.forEach((card) => {

    card.addEventListener("click", () => {

        // حذف انتخاب قبلی
        shapeCards.forEach((item) => {
            item.classList.remove("active");
        });

        // انتخاب شکل جدید
        card.classList.add("active");

        selectedShape = card.dataset.shape;

        // مخفی کردن نتیجه قبلی
        geometryResult.classList.remove("show");

        // نمایش ورودی‌های جدید
        showGeometryInputs(selectedShape);
    });
});


// نمایش ورودی اولیه مستطیل
showGeometryInputs(selectedShape);


// محاسبه
calculateGeometry.addEventListener("click", () => {

    let area;
    let perimeter;


    // مستطیل
    if (selectedShape === "rectangle") {

        const length = Number(document.getElementById("length").value);
        const width = Number(document.getElementById("width").value);

        if (length <= 0 || width <= 0) {
            void mmAlert(translateKey("alert_geometry_rect"));
            return;
        }

        area = length * width;
        perimeter = 2 * (length + width);
    }


    // مربع
    else if (selectedShape === "square") {

        const side = Number(document.getElementById("side").value);

        if (side <= 0) {
            void mmAlert(translateKey("alert_geometry_square"));
            return;
        }

        area = side * side;
        perimeter = 4 * side;
    }


    // مثلث
    else if (selectedShape === "triangle") {

        const base = Number(document.getElementById("base").value);
        const height = Number(document.getElementById("height").value);
        const side1 = Number(document.getElementById("side1").value);
        const side2 = Number(document.getElementById("side2").value);

        if (base <= 0 || height <= 0 || side1 <= 0 || side2 <= 0) {
            void mmAlert(translateKey("alert_geometry_triangle"));
            return;
        }

        // Triangle inequality on the three sides (base, side1, side2)
        if (
            base + side1 <= side2 ||
            base + side2 <= side1 ||
            side1 + side2 <= base
        ) {
            void mmAlert(
                document.documentElement.lang === "en"
                    ? "These sides cannot form a triangle."
                    : "این اضلاع نمی‌توانند یک مثلث بسازند."
            );
            return;
        }

        area = (base * height) / 2;
        perimeter = base + side1 + side2;
    }


    // دایره
    else if (selectedShape === "circle") {

        const radius = Number(document.getElementById("radius").value);

        if (radius <= 0) {
            void mmAlert(translateKey("alert_geometry_circle"));
            return;
        }

        area = Math.PI * radius * radius;
        perimeter = 2 * Math.PI * radius;
    }


    // نمایش نتیجه
    areaResult.textContent = area.toFixed(2);
    perimeterResult.textContent = perimeter.toFixed(2);

    const en = document.documentElement.lang === "en" || (typeof currentLang !== "undefined" && currentLang === "en");
    let formulaText = "";
    if (selectedShape === "rectangle") {
        const length = Number(document.getElementById("length").value);
        const width = Number(document.getElementById("width").value);
        formulaText = en
            ? `Area = length × width = ${length} × ${width} = ${area.toFixed(2)}\nPerimeter = 2 × (length + width) = 2 × (${length} + ${width}) = ${perimeter.toFixed(2)}`
            : `مساحت = طول × عرض = ${length} × ${width} = ${area.toFixed(2)}\nمحیط = ۲ × (طول + عرض) = ۲ × (${length} + ${width}) = ${perimeter.toFixed(2)}`;
    } else if (selectedShape === "square") {
        const side = Number(document.getElementById("side").value);
        formulaText = en
            ? `Area = side² = ${side}² = ${area.toFixed(2)}\nPerimeter = 4 × side = 4 × ${side} = ${perimeter.toFixed(2)}`
            : `مساحت = ضلع² = ${side}² = ${area.toFixed(2)}\nمحیط = ۴ × ضلع = ۴ × ${side} = ${perimeter.toFixed(2)}`;
    } else if (selectedShape === "triangle") {
        const base = Number(document.getElementById("base").value);
        const height = Number(document.getElementById("height").value);
        const side1 = Number(document.getElementById("side1").value);
        const side2 = Number(document.getElementById("side2").value);
        formulaText = en
            ? `Area = (base × height) / 2 = (${base} × ${height}) / 2 = ${area.toFixed(2)}\nPerimeter = side1 + side2 + base = ${side1} + ${side2} + ${base} = ${perimeter.toFixed(2)}`
            : `مساحت = (قاعده × ارتفاع) / ۲ = (${base} × ${height}) / ۲ = ${area.toFixed(2)}\nمحیط = ضلع۱ + ضلع۲ + قاعده = ${side1} + ${side2} + ${base} = ${perimeter.toFixed(2)}`;
    } else if (selectedShape === "circle") {
        const radius = Number(document.getElementById("radius").value);
        formulaText = en
            ? `Area = π × r² = π × ${radius}² = ${area.toFixed(2)}\nCircumference = 2 × π × r = 2 × π × ${radius} = ${perimeter.toFixed(2)}`
            : `مساحت = π × شعاع² = π × ${radius}² = ${area.toFixed(2)}\nمحیط = ۲ × π × شعاع = ۲ × π × ${radius} = ${perimeter.toFixed(2)}`;
    }
    const formulaEl = document.getElementById("geometryFormula");
    const formulaRow = document.getElementById("geometryFormulaRow");
    if (formulaEl && formulaRow) {
        const lines = String(formulaText).split(/\n+/).filter(Boolean);
        formulaEl.innerHTML = lines.map((line, i) => {
            const cls = i === 0 ? 'formula-line formula-answer' : 'formula-line';
            return `<div class="${cls}">${line.replace(/</g,'&lt;')}</div>`;
        }).join('');
        formulaRow.style.display = "flex";
    }

    geometryResult.classList.add("show");
});

// ================= GCD & LCM PAGE =================

const gcdLcmCard = document.getElementById("gcdLcmCard");
const gcdLcmPage = document.getElementById("gcdLcmPage");
const gcdLcmBack = document.getElementById("gcdLcmBack");


// باز کردن صفحه ب.م.م و ک.م.م
gcdLcmCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ب.م.م و ک.م.م
    gcdLcmPage.classList.add("show");

    // مخفی کردن نوار پایین
    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
gcdLcmBack.addEventListener("click", () => {

    gcdLcmPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= GCD & LCM LOGIC =================

const gcdNumber1 = document.getElementById("gcdNumber1");
const gcdNumber2 = document.getElementById("gcdNumber2");

const calculateGcdLcm = document.getElementById("calculateGcdLcm");

const gcdLcmResult = document.getElementById("gcdLcmResult");
const gcdResult = document.getElementById("gcdResult");
const lcmResult = document.getElementById("lcmResult");


// تابع محاسبه ب.م.م با الگوریتم اقلیدس
function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

        let temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}


// تابع محاسبه ک.م.م
function lcm(a, b) {

    return Math.abs(a * b) / gcd(a, b);
}


// کلیک روی دکمه محاسبه
calculateGcdLcm.addEventListener("click", () => {

    const number1 = Number(gcdNumber1.value);
    const number2 = Number(gcdNumber2.value);


    // بررسی معتبر بودن ورودی‌ها
    if (
        !gcdNumber1.value ||
        !gcdNumber2.value ||
        !Number.isInteger(number1) ||
        !Number.isInteger(number2) ||
        number1 <= 0 ||
        number2 <= 0
    ) {

        void mmAlert(translateKey("alert_gcd"));

        return;
    }


    // محاسبه ب.م.م
    const gcdValue = gcd(number1, number2);

    // محاسبه ک.م.م
    const lcmValue = lcm(number1, number2);


    // نمایش نتیجه
    gcdResult.textContent = gcdValue;
    lcmResult.textContent = lcmValue;

    const en = document.documentElement.lang === "en" || (typeof currentLang !== "undefined" && currentLang === "en");
    const n1 = Number(document.getElementById("gcdNumber1")?.value);
    const n2 = Number(document.getElementById("gcdNumber2")?.value);
    const formulaEl = document.getElementById("gcdLcmFormula");
    const formulaRow = document.getElementById("gcdLcmFormulaRow");
    if (formulaEl && formulaRow) {
        const lines = en
            ? [
                `GCD(${n1}, ${n2}) = ${gcdValue}`,
                `Method: Euclidean algorithm`,
                `LCM(${n1}, ${n2}) = |${n1} × ${n2}| ÷ GCD = ${lcmValue}`
              ]
            : [
                `ب.م.م(${n1}، ${n2}) = ${gcdValue}`,
                `روش: الگوریتم اقلیدس`,
                `ک.م.م(${n1}، ${n2}) = |${n1} × ${n2}| ÷ ب.م.م = ${lcmValue}`
              ];
        formulaEl.innerHTML = lines.map((line, i) => {
            const cls = (i === 0 || i === 2) ? 'formula-line formula-answer' : 'formula-line formula-meta';
            return `<div class="${cls}">${line}</div>`;
        }).join('');
        formulaRow.style.display = "flex";
    }

    gcdLcmResult.classList.add("show");
});

// ================= LEARNING PAGE =================

const learningCard = document.getElementById("learningCard");
const learningPage = document.getElementById("learningPage");
const learningBack = document.getElementById("learningBack");

const learningSearch = document.getElementById("learningSearch");
const searchAparat = document.getElementById("searchAparat");
const searchYoutube = document.getElementById("searchYoutube");


// باز کردن صفحه آموزش
learningCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه آموزش
    learningPage.classList.add("show");

    // مخفی کردن نوار پایین
    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// بازگشت از صفحه آموزش
learningBack.addEventListener("click", () => {

    // مخفی کردن صفحه آموزش
    learningPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // دوباره صفحه ابزارها را نمایش بده
        toolsPage.classList.add("show");

    } else {

        // در غیر این صورت صفحه خانه را نمایش بده
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";
    }

    // نمایش نوار پایین
    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// جستجو در آپارات
searchAparat.addEventListener("click", () => {

    const searchText = learningSearch.value.trim();

    if (searchText === "") {
        void mmAlert(translateKey("alert_learning"));
        return;
    }

    const q = encodeURIComponent(searchText);

    const aparatUrl =
        "https://www.aparat.com/search/" + q;

    window.open(aparatUrl, "_blank");
});


// جستجو در یوتیوب
searchYoutube.addEventListener("click", () => {

    const searchText = learningSearch.value.trim();

    if (searchText === "") {
        void mmAlert(translateKey("alert_learning"));
        return;
    }

    const youtubeUrl =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(searchText);

    window.open(youtubeUrl, "_blank");
});

// ================= FACTORS PAGE =================

const factorsCard = document.getElementById("factorsCard");

const factorsPage = document.getElementById("factorsPage");

const factorsBack = document.getElementById("factorsBack");


// باز کردن صفحه شمارنده‌ها

factorsCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی

    document.querySelector(".header").style.display = "none";

    document.querySelector(".welcome-card").style.display = "none";

    document.querySelector(".tools-section").style.display = "none";

    document.querySelector(".learning-card").style.display = "none";


    // نمایش صفحه شمارنده‌ها

    factorsPage.classList.add("show");


    // مخفی کردن نوار پایین

    const _bn = document.querySelector(".bottom-nav"); if (_bn) _bn.style.display = "none";


    // رفتن به بالای صفحه

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= بازگشت =================

factorsBack.addEventListener("click", () => {

    factorsPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= FACTORS LOGIC =================

const factorsNumber =
    document.getElementById("factorsNumber");

const calculateFactors =
    document.getElementById("calculateFactors");

const factorsResult =
    document.getElementById("factorsResult");

const factorsList =
    document.getElementById("factorsList");


// محاسبه شمارنده‌ها

calculateFactors.addEventListener("click", () => {

    const number = Number(factorsNumber.value);


    // بررسی عدد

    if (
        !factorsNumber.value ||
        !Number.isInteger(number) ||
        number <= 0
    ) {

        void mmAlert(translateKey("alert_factors"));

        return;
    }


    // پاک کردن نتیجه قبلی

    factorsList.innerHTML = "";


    // پیدا کردن شمارنده‌ها

    for (let i = 1; i <= number; i++) {

        if (number % i === 0) {

            const item =
                document.createElement("div");

            item.classList.add("factor-item");

            item.textContent = i;

            factorsList.appendChild(item);
        }

    }


    // نمایش نتیجه

    factorsResult.classList.add("show");

});

function hideAllPages() {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("show");
    });
    document.body.classList.remove("games-view", "darsyar-view");
}

// ================= TOOLS NAVIGATION =================***

const toolsNav = document.getElementById("toolsNav");
const toolsPage = document.getElementById("toolsPage");
const moreToolsBtn = document.getElementById("moreToolsBtn");
const startLearningCard = document.getElementById("startLearningCard");

function activateToolsNav() {
    // غیرفعال کردن همه دکمه‌های نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });
    // فعال کردن ابزارها (اگر نوار پایین وجود داشته باشد)
    if (toolsNav) toolsNav.classList.add("active");
}

// رفتن به صفحه ابزارها از نوار پایین
if (toolsNav) toolsNav.addEventListener("click", () => {

    currentPage = "tools";

    activateToolsNav();

    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ابزارها
    toolsPage.classList.add("show");

    // نوار پایین باقی بماند
    const _bn2 = document.querySelector(".bottom-nav"); if (_bn2) _bn2.style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= HOME NAVIGATION =================

const homeNav = document.getElementById("homeNav");

if (homeNav) homeNav.addEventListener("click", () => {

    // مخفی کردن تمام صفحه‌های جداگانه
    hideAllPages();

    // نمایش دوباره صفحه خانه
    document.querySelector(".header").style.display = "flex";
    document.querySelector(".welcome-card").style.display = "flex";
    document.querySelector(".tools-section").style.display = "block";
    document.querySelector(".learning-card").style.display = "flex";

    // فعال کردن خانه در نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });

    homeNav.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= MORE TOOLS BUTTON =================

if (moreToolsBtn) moreToolsBtn.addEventListener("click", () => {
    currentPage = "tools";
    activateToolsNav();
    hideAllPages();
    document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
    document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
    document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
    document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
    if (toolsPage) toolsPage.classList.add("show");
    if (typeof setActiveSidebar === "function") setActiveSidebar("tools");
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ================= START LEARNING CARD =================

if (startLearningCard) startLearningCard.addEventListener("click", (e) => {
    e.stopPropagation();
    currentPage = "tools";
    activateToolsNav();
    hideAllPages();
    document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
    document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
    document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
    document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
    if (toolsPage) toolsPage.classList.add("show");
    if (typeof setActiveSidebar === "function") setActiveSidebar("tools");
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ================= VIDEOS NAVIGATION =================

const videosNav = document.getElementById("videosNav");
const videosPage = document.getElementById("videosPage");

if (videosNav) videosNav.addEventListener("click", () => {

    currentPage = "videos";

    // بستن تمام صفحه‌های جداگانه
    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه فیلم‌های آموزشی
    videosPage.classList.add("show");

    // فعال کردن آموزش در نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });

    videosNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= TOOLS PAGE CARDS =================

// کارت‌های داخل صفحه ابزارها
const toolsCalculator = document.getElementById("toolsCalculator");
const toolsGeometry = document.getElementById("toolsGeometry");
const toolsGcdLcm = document.getElementById("toolsGcdLcm");
const toolsMultiples = document.getElementById("toolsMultiples");
const toolsFactors = document.getElementById("toolsFactors");
const toolsLearning = document.getElementById("toolsLearning");


// تابع مخفی کردن صفحه ابزارها
function closeToolsPage() {
    toolsPage.classList.remove("show");
}


// ماشین حساب
toolsCalculator.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    calculatorPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// مساحت و محیط
toolsGeometry.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    geometryPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ب.م.م و ک.م.م
toolsGcdLcm.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    gcdLcmPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// مضرب‌ها
toolsMultiples.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    multiplesPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// شمارنده‌ها
toolsFactors.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    factorsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// آموزش
toolsLearning.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    learningPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

/* ================= DATE PAGE ================= */

const toolsDate = document.getElementById("toolsDate");

const datePage = document.getElementById("datePage");

const dateBack = document.getElementById("dateBack");


// باز کردن صفحه تبدیل تاریخ

toolsDate.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    datePage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// بازگشت از صفحه تبدیل تاریخ

dateBack.addEventListener("click", () => {

    datePage.classList.remove("show");

    toolsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= SETTINGS & ABOUT =================

// صفحات
const settingsPage = document.getElementById("settingsPage");
const aboutPage = document.getElementById("aboutPage");

// دکمه‌های نوار پایین
const settingsNav = document.getElementById("settingsNav");
const aboutNav = document.getElementById("aboutNav");


// ================= مخفی کردن صفحه اصلی =================

function hideHomePage() {

    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

}


// ================= نمایش صفحه تنظیمات =================

function showSettingsPage() {

    currentPage = "settings";

    // مخفی کردن تمام صفحه‌های دیگر
    hideAllPages();

    // مخفی کردن صفحه اصلی
    hideHomePage();

    // نمایش تنظیمات
    settingsPage.classList.add("show");

    // فعال کردن دکمه تنظیمات
    navItems.forEach(nav => {
        nav.classList.remove("active");
    });

    settingsNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// کلیک روی تنظیمات
if (settingsNav) {

    settingsNav.addEventListener("click", () => {

        showSettingsPage();

    });

}


// ================= نمایش صفحه درباره ما =================

function showAboutPage() {

    currentPage = "about";

    // مخفی کردن تمام صفحه‌های دیگر
    hideAllPages();

    // مخفی کردن صفحه اصلی
    hideHomePage();

    // نمایش صفحه درباره ما
    aboutPage.classList.add("show");

    // فعال کردن دکمه درباره ما
    navItems.forEach(nav => {
        nav.classList.remove("active");
    });

    aboutNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// کلیک روی درباره ما
if (aboutNav) {

    aboutNav.addEventListener("click", () => {

        showAboutPage();

    });

}


// ================= FONT SIZE =================

const fontSizeButtons =
    document.querySelectorAll(".font-size-btn");


// تغییر اندازه نوشته
function changeFontSize(size) {

    document.body.classList.remove(
        "font-small",
        "font-normal",
        "font-large"
    );

    document.body.classList.add(`font-${size}`);

    localStorage.setItem("mathmateFontSize", size);
    window.dispatchEvent(new Event("mathmate:settings-changed"));
}


// کلیک روی دکمه‌های اندازه نوشته
fontSizeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const size = button.dataset.size;

        // تغییر اندازه
        changeFontSize(size);

        // حذف active قبلی
        fontSizeButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // فعال کردن دکمه جدید
        button.classList.add("active");

    });

});


// بارگذاری اندازه ذخیره‌شده
const savedFontSize =
    localStorage.getItem("mathmateFontSize") || "normal";


// اعمال اندازه
changeFontSize(savedFontSize);


// فعال کردن دکمه درست
fontSizeButtons.forEach(button => {

    if (button.dataset.size === savedFontSize) {

        button.classList.add("active");

    } else {

        button.classList.remove("active");

    }

});


// ================= THEME SETTINGS =================

const themeOptions =
    document.querySelectorAll(".theme-option");


// تغییر حالت روشن و تاریک
function changeTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add("dark");

        // تغییر آیکون

    } else {

        document.body.classList.remove("dark");

        // تغییر آیکون

    }

    updateThemeButtonIcon(theme);

    // ذخیره تنظیم
    localStorage.setItem(
        "mathmateTheme",
        theme
    );
    window.dispatchEvent(new Event("mathmate:settings-changed"));

}


// کلیک روی دکمه‌های حالت
themeOptions.forEach(button => {

    button.addEventListener("click", () => {

        const theme = button.dataset.theme;

        // تغییر حالت
        changeTheme(theme);

        // حذف active قبلی
        themeOptions.forEach(btn => {
            btn.classList.remove("active");
        });

        // فعال کردن دکمه انتخاب‌شده
        button.classList.add("active");

    });

});


// بارگذاری حالت ذخیره‌شده
const savedTheme =
    localStorage.getItem("mathmateTheme") || "light";


// اعمال حالت
changeTheme(savedTheme);


// فعال کردن دکمه درست
themeOptions.forEach(button => {

    if (button.dataset.theme === savedTheme) {

        button.classList.add("active");

    } else {

        button.classList.remove("active");

    }

});


// ================= DEVICE INFORMATION =================

const osInfo = document.getElementById("osInfo");
const userAgent = navigator.userAgent || "";
const platform = navigator.platform || "";

function detectOSVersion() {
    // Windows
    if (/Windows NT 10\.0/.test(userAgent)) {
        // Chromium may reduce the user-agent to Windows NT 10.0 for both Windows 10 and 11.
        // The async Client Hints upgrade below will identify the version when the browser allows it.
        return document.documentElement.lang === "en" ? "Windows (exact version unavailable)" : "ویندوز (نسخه دقیق از مرورگر قابل تشخیص نیست)";
    }
    if (/Windows NT 6\.3/.test(userAgent)) return "Windows 8.1";
    if (/Windows NT 6\.2/.test(userAgent)) return "Windows 8";
    if (/Windows NT 6\.1/.test(userAgent)) return "Windows 7";
    if (/Windows NT 6\.0/.test(userAgent)) return "Windows Vista";
    if (/Windows NT 5\.1/.test(userAgent) || /Windows XP/.test(userAgent)) return "Windows XP";
    if (/Windows/.test(userAgent)) return "Windows";

    // Android
    const androidMatch = userAgent.match(/Android\s([0-9.]+)/);
    if (androidMatch) return "Android " + androidMatch[1];

    // iOS
    if (/iPhone|iPad|iPod/.test(userAgent)) {
        const iosMatch = userAgent.match(/OS (\d+)[._](\d+)/);
        if (iosMatch) return "iOS " + iosMatch[1] + "." + iosMatch[2];
        return "iOS";
    }

    // macOS
    if (/Mac OS X/.test(userAgent)) {
        // Safari may intentionally retain a compatibility UA version; do not misreport it as the installed macOS release.
        return document.documentElement.lang === "en" ? "macOS (exact version unavailable)" : "macOS (نسخه دقیق از مرورگر قابل تشخیص نیست)";
    }

    if (/Linux/.test(userAgent)) return "Linux";
    return "Unknown";
}

if (osInfo) {
    osInfo.textContent = detectOSVersion();
}
(async function refineOSVersionFromClientHints() {
    if (!osInfo || !navigator.userAgentData || typeof navigator.userAgentData.getHighEntropyValues !== "function") return;
    try {
        const hints = await navigator.userAgentData.getHighEntropyValues(["platformVersion", "architecture", "bitness"]);
        const platformName = navigator.userAgentData.platform || "";
        const rawVersion = String(hints.platformVersion || "").trim();
        const parts = rawVersion.split(".").map(Number);
        const major = parts[0];
        let label = "";
        if (/Windows/i.test(platformName)) {
            if (Number.isFinite(major) && major > 0) label = major >= 13 ? "Windows 11" : "Windows 10";
        } else if (/Android/i.test(platformName)) {
            if (Number.isFinite(major) && major > 0) label = "Android " + parts.slice(0, 2).join(".");
        } else if (/macOS/i.test(platformName)) {
            if (Number.isFinite(major) && major > 0) label = "macOS " + parts.slice(0, 2).join(".");
        } else if (/Chrome OS/i.test(platformName)) {
            label = "ChromeOS";
        } else if (/Linux/i.test(platformName)) {
            label = "Linux";
        }
        if (label) {
            osInfo.dataset.mmOsCanonical = label;
            osInfo.textContent = currentLang === "en" ? label : label.replace("Windows", "ویندوز").replace("Android", "اندروید").replace("macOS", "macOS").replace("Linux", "لینوکس").replace("ChromeOS", "ChromeOS");
        }
        const archHint = document.getElementById("architectureInfo");
        if (archHint && hints.architecture) {
            const bits = String(hints.bitness || "").trim();
            if (bits === "64" || bits === "32") archHint.textContent = bits + "-bit";
        }
    } catch (_) {
        // Browser privacy settings can block high-entropy hints; keep the explicitly qualified fallback.
    }
})();


// ---------- معماری سیستم ----------

const architectureInfo =
    document.getElementById("architectureInfo");

let architecture =
    "نامشخص";


if (
    userAgent.includes("Win64") ||
    userAgent.includes("x64") ||
    userAgent.includes("x86_64")
) {

    architecture = "64-bit";

} else if (
    userAgent.includes("WOW64") ||
    userAgent.includes("x86")
) {

    architecture = "32-bit";

}


// نمایش معماری
if (architectureInfo) {

    architectureInfo.textContent =
        architecture;

}


// ---------- مرورگر ----------

const browserInfo =
    document.getElementById("browserInfo");

let browser =
    "نامشخص";


if (userAgent.includes("Firefox")) {

    browser = "Firefox";

} else if (userAgent.includes("Edg")) {

    browser = "Microsoft Edge";

} else if (
    userAgent.includes("Chrome") &&
    !userAgent.includes("Edg")
) {

    browser = "Google Chrome";

} else if (
    userAgent.includes("Safari") &&
    !userAgent.includes("Chrome")
) {

    browser = "Safari";

}


// نمایش مرورگر
if (browserInfo) {

    browserInfo.textContent =
        browser;

}



// ================= تبدیل تاریخ =================

const dateCalendarOptions =
    document.querySelectorAll(".date-calendar-option");

const dateYear =
    document.getElementById("dateYear");

const dateMonth =
    document.getElementById("dateMonth");

const dateDay =
    document.getElementById("dateDay");

const calculateDate =
    document.getElementById("calculateDate");

const jalaliResult =
    document.getElementById("jalaliResult");

const gregorianResult =
    document.getElementById("gregorianResult");

const hijriResult =
    document.getElementById("hijriResult");

const dateResult =
    document.getElementById("dateResult");


let selectedCalendar = "jalali";


// ================= انتخاب تقویم =================

dateCalendarOptions.forEach(button => {

    button.addEventListener("click", () => {

        dateCalendarOptions.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCalendar =
            button.dataset.calendar;
        refreshDateDayLimit();

        console.log(
            "تقویم انتخاب شده:",
            selectedCalendar
        );

    });

});

[dateYear, dateMonth].forEach(input => input?.addEventListener('input', refreshDateDayLimit));
refreshDateDayLimit();


// ================= تبدیل شمسی ↔ میلادی (الگوریتم دقیق استاندارد) =================

function jalaliToGregorian(jy, jm, jd) {
    jy = Number(jy); jm = Number(jm); jd = Number(jd);
    var gy, days;
    if (jy > 979) {
        gy = 1600;
        jy -= 979;
    } else {
        gy = 621;
        jy -= 0;
    }
    days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    var gd = days + 1;
    var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm;
    for (gm = 1; gm <= 12 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return { year: gy, month: gm, day: gd };
}

function gregorianToJalali(gy, gm, gd) {
    gy = Number(gy); gm = Number(gm); gd = Number(gd);
    var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var gy2 = (gm > 2) ? (gy + 1) : gy;
    var days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    var jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    var jm, jd;
    if (days < 186) {
        jm = 1 + Math.floor(days / 31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }
    return { year: jy, month: jm, day: jd };
}

// ================= تبدیل میلادی به قمری =================

function gregorianToHijri(date) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-US-u-ca-islamic",
            {
                year: "numeric",
                month: "numeric",
                day: "numeric"
            }
        );

    const parts =
        formatter.formatToParts(date);

    let year;
    let month;
    let day;

    parts.forEach(part => {

        if (part.type === "year") {
            year = Number(part.value);
        }

        if (part.type === "month") {
            month = Number(part.value);
        }

        if (part.type === "day") {
            day = Number(part.value);
        }

    });

    return {
        year,
        month,
        day
    };
}


// ================= تبدیل قمری به میلادی =================

function hijriToGregorian(hy, hm, hd) {

    const epoch =
        new Date(Date.UTC(622, 6, 19));

    const days =
        Math.floor(
            (11 * hy + 3) / 30
        ) +
        354 * (hy - 1) +
        30 * (hm - 1) -
        Math.floor((hm - 1) / 2) +
        hd -
        1;

    const result =
        new Date(
            epoch.getTime() +
            days * 86400000
        );

    return {
        year: result.getUTCFullYear(),
        month: result.getUTCMonth() + 1,
        day: result.getUTCDate()
    };
}


// ================= اعتبارسنجی تاریخ =================

function calendarMonthLength(year, month, calendar = selectedCalendar) {
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) return 0;
    if (calendar === 'jalali') {
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        const thisYear = jalaliToGregorian(year, 1, 1);
        const nextYear = jalaliToGregorian(year + 1, 1, 1);
        const span = (Date.UTC(nextYear.year, nextYear.month - 1, nextYear.day) - Date.UTC(thisYear.year, thisYear.month - 1, thisYear.day)) / 86400000;
        return span === 366 ? 30 : 29;
    }
    if (calendar === 'hijri') {
        if (month < 12) return month % 2 === 1 ? 30 : 29;
        const leapThis = Math.floor((11 * year + 3) / 30) > Math.floor((11 * (year - 1) + 3) / 30);
        return leapThis ? 30 : 29;
    }
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function refreshDateDayLimit() {
    if (!dateDay || !dateMonth || !dateYear) return;
    const year = Number(dateYear.value);
    const month = Number(dateMonth.value);
    const maxDay = calendarMonthLength(year, month, selectedCalendar);
    dateDay.max = String(maxDay || 31);
    if (maxDay && Number(dateDay.value) > maxDay) dateDay.value = String(maxDay);
}

function isValidDate(year, month, day) {
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (month < 1 || month > 12 || day < 1) return false;
    return day <= calendarMonthLength(year, month, selectedCalendar);
}


// ================= دکمه تبدیل =================

if (calculateDate) {

    calculateDate.addEventListener("click", () => {

        const year =
            Number(dateYear.value);

        const month =
            Number(dateMonth.value);

        const day =
            Number(dateDay.value);


        // بررسی خالی نبودن ورودی‌ها

        if (
            !dateYear.value ||
            !dateMonth.value ||
            !dateDay.value
        ) {

            void mmAlert(
                translateKey("alert_date_missing")
            );

            return;
        }


        // بررسی معتبر بودن عددها

        if (
            !isValidDate(
                year,
                month,
                day
            )
        ) {

            void mmAlert(
                translateKey("alert_date_invalid")
            );

            return;
        }


        let jalali;
        let gregorian;
        let hijri;


        // ================= شمسی =================

        if (
            selectedCalendar === "jalali"
        ) {

            jalali = {
                year,
                month,
                day
            };

            gregorian =
                jalaliToGregorian(
                    year,
                    month,
                    day
                );

            hijri =
                gregorianToHijri(
                    new Date(
                        gregorian.year,
                        gregorian.month - 1,
                        gregorian.day
                    )
                );
        }


        // ================= میلادی =================

        else if (
            selectedCalendar === "gregorian"
        ) {

            gregorian = {
                year,
                month,
                day
            };

            jalali =
                gregorianToJalali(
                    year,
                    month,
                    day
                );

            hijri =
                gregorianToHijri(
                    new Date(
                        year,
                        month - 1,
                        day
                    )
                );
        }


        // ================= قمری =================

        else if (
            selectedCalendar === "hijri"
        ) {

            hijri = {
                year,
                month,
                day
            };

            gregorian =
                hijriToGregorian(
                    year,
                    month,
                    day
                );

            jalali =
                gregorianToJalali(
                    gregorian.year,
                    gregorian.month,
                    gregorian.day
                );
        }


        // ================= نمایش نتیجه =================

        if (jalaliResult) {

            jalaliResult.textContent =
                `${jalali.year}/${jalali.month}/${jalali.day}`;
        }

        if (gregorianResult) {

            gregorianResult.textContent =
                `${gregorian.year}/${gregorian.month}/${gregorian.day}`;
        }

        if (hijriResult) {

            hijriResult.textContent =
                `${hijri.year}/${hijri.month}/${hijri.day}`;
        }


        // نمایش کارت نتیجه

        if (dateResult) {

            dateResult.classList.add("show");
        }

    });

}


// ===============================
// UNIT CONVERTER PAGE
// ===============================

const toolsUnit = document.getElementById("toolsUnit");
const unitPage = document.getElementById("unitPage");
const unitBack = document.getElementById("unitBack");


// ===============================
// باز کردن صفحه تبدیل واحد
// ===============================

if (toolsUnit) {

    toolsUnit.addEventListener("click", () => {

        currentPage = "tools";

        // مخفی کردن همه صفحات
        hideAllPages();

        // مخفی کردن صفحه ابزارها
        closeToolsPage();

        // نمایش صفحه تبدیل واحد
        unitPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// بازگشت از صفحه تبدیل واحد
// ===============================

if (unitBack) {

    unitBack.addEventListener("click", () => {

        // مخفی کردن صفحه تبدیل واحد
        unitPage.classList.remove("show");

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// UNIT CONVERTER LOGIC
// ===============================

const unitValue =
    document.getElementById("unitValue");

const unitFrom =
    document.getElementById("unitFrom");

const unitTo =
    document.getElementById("unitTo");

const calculateUnit =
    document.getElementById("calculateUnit");

const unitResult =
    document.getElementById("unitResult");

const unitResultValue =
    document.getElementById("unitResultValue");

const unitTypes =
    document.querySelectorAll(".unit-type");


// ===============================
// واحدها و ضرایب تبدیل
// ===============================

const conversionRates = {

    // طول
    length: {

        meter: 1,

        kilometer: 1000,

        centimeter: 0.01,

        millimeter: 0.001

    },


    // وزن
    weight: {

        kilogram: 1,

        gram: 0.001,

        milligram: 0.000001,

        ton: 1000

    },


    // حجم
    volume: {

        liter: 1,

        milliliter: 0.001,

        cubicMeter: 1000

    },


    // دما
    temperature: {

        celsius: 1,

        fahrenheit: 1,

        kelvin: 1

    }

};


// ===============================
// نام فارسی واحدها
// ===============================

const unitNames = {
    fa: {
        length: { meter: "متر", kilometer: "کیلومتر", centimeter: "سانتی‌متر", millimeter: "میلی‌متر" },
        weight: { kilogram: "کیلوگرم", gram: "گرم", milligram: "میلی‌گرم", ton: "تن" },
        volume: { liter: "لیتر", milliliter: "میلی‌لیتر", cubicMeter: "متر مکعب" },
        temperature: { celsius: "سلسیوس", fahrenheit: "فارنهایت", kelvin: "کلوین" }
    },
    en: {
        length: { meter: "Meter", kilometer: "Kilometer", centimeter: "Centimeter", millimeter: "Millimeter" },
        weight: { kilogram: "Kilogram", gram: "Gram", milligram: "Milligram", ton: "Ton" },
        volume: { liter: "Liter", milliliter: "Milliliter", cubicMeter: "Cubic meter" },
        temperature: { celsius: "Celsius", fahrenheit: "Fahrenheit", kelvin: "Kelvin" }
    }
};


// ===============================
// نوع واحد فعلی
// ===============================

let currentUnitType = "length";


// ===============================
// ساخت گزینه‌های Select
// ===============================

function updateUnitOptions() {

    // پاک کردن گزینه‌های قبلی
    unitFrom.innerHTML = "";
    unitTo.innerHTML = "";


    // گرفتن واحدهای مربوط به نوع انتخاب‌شده
    const units =
        conversionRates[currentUnitType];
    const lang = document.documentElement.lang === "en" ? "en" : "fa";
    const labels = unitNames[lang][currentUnitType];


    // ساخت گزینه‌ها
    Object.keys(units).forEach(unit => {

        // ---------------------------
        // Select مبدا
        // ---------------------------

        const optionFrom =
            document.createElement("option");

        optionFrom.value = unit;

        optionFrom.textContent =
            labels[unit];

        unitFrom.appendChild(optionFrom);


        // ---------------------------
        // Select مقصد
        // ---------------------------

        const optionTo =
            document.createElement("option");

        optionTo.value = unit;

        optionTo.textContent =
            labels[unit];

        unitTo.appendChild(optionTo);

    });


    // ---------------------------
    // انتخاب پیش‌فرض
    // ---------------------------

    if (unitFrom.options.length > 0) {

        unitFrom.selectedIndex = 0;

    }


    if (unitTo.options.length > 1) {

        unitTo.selectedIndex = 1;

    }


    else if (unitTo.options.length > 0) {

        unitTo.selectedIndex = 0;

    }

    // Refresh custom glass menus if present
    [unitFrom, unitTo].forEach((sel) => {
        if (!sel) return;
        const wrap = sel.closest('.select-control-wrap');
        if (!wrap) return;
        const menu = wrap.querySelector('.select-control-menu');
        const valueEl = wrap.querySelector('.select-control-value');
        if (menu) {
            menu.innerHTML = '';
            Array.from(sel.options).forEach((option) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'select-control-option';
                item.setAttribute('role', 'option');
                item.dataset.value = option.value;
                item.textContent = option.textContent;
                item.disabled = option.disabled;
                item.addEventListener('click', () => {
                    sel.value = option.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    const opt = sel.options[sel.selectedIndex];
                    if (valueEl) valueEl.textContent = opt ? opt.textContent : '';
                    menu.querySelectorAll('[role=option]').forEach((b) => {
                        const on = b.dataset.value === sel.value;
                        b.setAttribute('aria-selected', String(on));
                        b.classList.toggle('is-selected', on);
                    });
                    wrap.classList.remove('is-open');
                    const trigger = wrap.querySelector('.select-control-trigger');
                    if (trigger) trigger.setAttribute('aria-expanded', 'false');
                });
                menu.appendChild(item);
            });
        }
        if (valueEl) {
            const opt = sel.options[sel.selectedIndex];
            valueEl.textContent = opt ? opt.textContent : '';
        }
    });

}


// ===============================
// نمایش نتیجه
// ===============================

function showUnitResult(result) {

    // نمایش عدد
    unitResultValue.textContent =
        result.toLocaleString("fa-IR", {
            maximumFractionDigits: 10
        });


    // نمایش کارت نتیجه
    unitResult.classList.add("show");

}


// ===============================
// تغییر نوع واحد
// ===============================

unitTypes.forEach(button => {

    button.addEventListener("click", () => {


        // حذف active از همه
        unitTypes.forEach(btn => {

            btn.classList.remove("active");

        });


        // فعال کردن گزینه انتخاب‌شده
        button.classList.add("active");


        // ذخیره نوع واحد
        currentUnitType =
            button.dataset.unit;


        // ساخت دوباره Selectها
        updateUnitOptions();


        // پاک کردن ورودی
        unitValue.value = "";


        // پاک کردن نتیجه
        unitResultValue.textContent = "0";


        // مخفی کردن نتیجه قبلی
        unitResult.classList.remove("show");

    });

});


// ===============================
// دکمه تبدیل
// ===============================

if (calculateUnit) {

    calculateUnit.addEventListener("click", () => {


        // گرفتن مقدار
        const value =
            Number(unitValue.value);


        // ---------------------------
        // بررسی ورودی
        // ---------------------------

        if (
            unitValue.value.trim() === "" ||
            !Number.isFinite(value)
        ) {

            void mmAlert(
                translateKey("alert_unit")
            );

            return;

        }


        // گرفتن واحد مبدا و مقصد
        const from =
            unitFrom.value;

        const to =
            unitTo.value;


        // ===============================
        // تبدیل دما
        // ===============================

        if (
            currentUnitType === "temperature"
        ) {


            let celsius;


            // ---------------------------
            // مبدا → سلسیوس
            // ---------------------------

            if (from === "celsius") {

                celsius = value;

            }

            else if (from === "fahrenheit") {

                celsius =
                    (value - 32) * 5 / 9;

            }

            else if (from === "kelvin") {

                celsius =
                    value - 273.15;

            }


            // ---------------------------
            // سلسیوس → مقصد
            // ---------------------------

            let result;


            if (to === "celsius") {

                result = celsius;

            }

            else if (to === "fahrenheit") {

                result =
                    (celsius * 9 / 5) + 32;

            }

            else if (to === "kelvin") {

                result =
                    celsius + 273.15;

            }


            // نمایش نتیجه
            showUnitResult(result);

            return;

        }


        // ===============================
        // تبدیل واحدهای معمولی
        // ===============================


        const fromRate =
            conversionRates[currentUnitType][from];


        const toRate =
            conversionRates[currentUnitType][to];


        // تبدیل مقدار به واحد پایه
        const baseValue =
            value * fromRate;


        // تبدیل واحد پایه به مقصد
        const result =
            baseValue / toRate;


        // نمایش نتیجه
        showUnitResult(result);

    });

}


// ===============================
// اجرای اولیه
// ===============================

updateUnitOptions();

// ================= PERCENTAGE PAGE =================

const toolsPercentage = document.getElementById("toolsPercentage");
const percentagePage = document.getElementById("percentagePage");
const percentageBack = document.getElementById("percentageBack");


// ===============================
// باز کردن صفحه محاسبه درصد
// ===============================

toolsPercentage.addEventListener("click", () => {

    currentPage = "tools";

    // مخفی کردن همه صفحات
    hideAllPages();

    // مخفی کردن صفحه ابزارها
    closeToolsPage();

    // نمایش صفحه محاسبه درصد
    percentagePage.classList.add("show");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ===============================
// بازگشت از صفحه درصد
// ===============================

percentageBack.addEventListener("click", () => {

    percentagePage.classList.remove("show");

    // برگشت به صفحه ابزارها
    toolsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ===============================
// عناصر محاسبه درصد
// ===============================

const percentageValue =
    document.getElementById("percentageValue");

const percentageNumber =
    document.getElementById("percentageNumber");

const calculatePercentage =
    document.getElementById("calculatePercentage");

const percentageResult =
    document.getElementById("percentageResult");

const percentageResultValue =
    document.getElementById("percentageResultValue");


// ===============================
// محاسبه درصد
// ===============================

calculatePercentage.addEventListener("click", () => {

    const percentage =
        Number(percentageValue.value);

    const number =
        Number(percentageNumber.value);


    // بررسی ورودی‌ها
    if (
        percentageValue.value.trim() === "" ||
        percentageNumber.value.trim() === "" ||
        !Number.isFinite(percentage) ||
        !Number.isFinite(number)
    ) {

        void mmAlert(translateKey("alert_percentage"));

        return;
    }


    // محاسبه درصد
    // مثال:
    // 20 درصد از 500
    // 20 ÷ 100 × 500 = 100

    const result =
        (percentage / 100) * number;


    // نمایش نتیجه
    percentageResultValue.textContent =
        result.toLocaleString("fa-IR", {
            maximumFractionDigits: 10
        });

});

/* ================= TIME PAGE ================= */

const toolsTime = document.getElementById("toolsTime");
const timePage = document.getElementById("timePage");
const timeBack = document.getElementById("timeBack");



// ===============================
// باز کردن صفحه تبدیل زمان
// ===============================

if (toolsTime) {

    toolsTime.addEventListener("click", () => {

        currentPage = "tools";

        // مخفی کردن تمام صفحات
        hideAllPages();

        // مخفی کردن صفحه ابزارها
        closeToolsPage();

        // نمایش صفحه تبدیل زمان
        timePage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// بازگشت از صفحه تبدیل زمان
// ===============================

if (timeBack) {

    timeBack.addEventListener("click", () => {

        // مخفی کردن صفحه زمان
        timePage.classList.remove("show");

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


/* ================= TIME CONVERTER ================= */

// ورودی مقدار
const timeValue =
    document.getElementById("timeValue");

// واحد مبدا
const timeFrom =
    document.getElementById("timeFrom");

// واحد مقصد
const timeTo =
    document.getElementById("timeTo");

// دکمه تبدیل
const calculateTimeBtn =
    document.getElementById("calculateTimeBtn");

// کارت نتیجه
const timeResult =
    document.getElementById("timeResult");

// مقدار نتیجه
const timeResultValue =
    document.getElementById("timeResultValue");


// ===============================
// ضریب تبدیل واحدهای زمان
// ===============================

const timeConversionRates = {

    second: 1,

    minute: 60,

    hour: 60 * 60,

    day: 24 * 60 * 60

};


// ===============================
// نام فارسی واحدهای زمان
// ===============================

const timeUnitNames = {
    fa: { second: "ثانیه", minute: "دقیقه", hour: "ساعت", day: "روز" },
    en: { second: "seconds", minute: "minutes", hour: "hours", day: "days" }
};


// ===============================
// تبدیل زمان
// ===============================

if (calculateTimeBtn) {

    calculateTimeBtn.addEventListener("click", () => {

        // گرفتن مقدار واردشده
        const value =
            Number(timeValue.value);


        // ===============================
        // بررسی ورودی
        // ===============================

        if (
            timeValue.value.trim() === "" ||
            !Number.isFinite(value)
        ) {

            void mmAlert(
                translateKey("alert_time")
            );

            timeResult.classList.remove("show");

            return;
        }


        // ===============================
        // واحد مبدا و مقصد
        // ===============================

        const from =
            timeFrom.value;

        const to =
            timeTo.value;


        // ===============================
        // تبدیل مقدار به ثانیه
        // ===============================

        const seconds =
            value * timeConversionRates[from];


        // ===============================
        // تبدیل ثانیه به واحد مقصد
        // ===============================

        const result =
            seconds / timeConversionRates[to];


        // ===============================
        // حذف اعشارهای اضافی
        // ===============================

        const cleanResult =
            Number(result.toFixed(10));


        // ===============================
        // نمایش نتیجه
        // ===============================

        timeResultValue.textContent =
            `${cleanResult.toLocaleString(document.documentElement.lang === "en" ? "en" : "fa-IR")} ${timeUnitNames[document.documentElement.lang === "en" ? "en" : "fa"][to]}`;

        // نمایش کارت نتیجه
        timeResult.classList.add("show");

    });
}

/* ================= SIDEBAR ================= */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarItems = document.querySelectorAll(".sidebar-item");

let sidebarCloseTimer = null;

function isMobileSidebar() {
    return window.matchMedia("(max-width: 899px)").matches;
}

function openSidebar() {
    if (!sidebar) return;
    if (sidebarCloseTimer) {
        clearTimeout(sidebarCloseTimer);
        sidebarCloseTimer = null;
    }
    sidebar.classList.remove("is-closing");
    sidebar.classList.add("open");
    document.body.classList.add("sidebar-open");
    if (isMobileSidebar() && sidebarOverlay) sidebarOverlay.classList.add("show");
    if (sidebarToggle) sidebarToggle.style.display = "none";
}

function closeSidebar() {
    if (!sidebar) return;
    // Close sidebar and content layout simultaneously (same transition).
    if (sidebarCloseTimer) {
        clearTimeout(sidebarCloseTimer);
        sidebarCloseTimer = null;
    }
    sidebar.classList.remove("is-closing");
    sidebar.classList.remove("open");
    document.body.classList.remove("sidebar-open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    if (sidebarToggle) sidebarToggle.style.display = "";
}

if (sidebarToggle) sidebarToggle.addEventListener("click", () => {
    if (sidebar?.classList.contains("open") && !sidebar.classList.contains("is-closing")) {
        // toggle only closes on mobile via hamburger; on desktop hamburger opens
        if (isMobileSidebar()) closeSidebar();
        else openSidebar();
    } else {
        openSidebar();
    }
});
if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => {
    if (isMobileSidebar()) closeSidebar();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
});

window.addEventListener("resize", () => {
    if (!sidebar) return;
    if (isMobileSidebar()) {
        if (sidebarOverlay) sidebarOverlay.classList.toggle("show", sidebar.classList.contains("open") && !sidebar.classList.contains("is-closing"));
        if (!sidebar.classList.contains("open")) {
            document.body.classList.remove("sidebar-open");
            if (sidebarToggle) sidebarToggle.style.display = "";
        }
    } else {
        // Desktop: keep current open/closed state; no overlay
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
        if (sidebar.classList.contains("open") && !sidebar.classList.contains("is-closing")) {
            document.body.classList.add("sidebar-open");
            if (sidebarToggle) sidebarToggle.style.display = "none";
        } else {
            document.body.classList.remove("sidebar-open");
            if (sidebarToggle) sidebarToggle.style.display = "";
        }
    }
});

function setActiveSidebar(nav) {
    document.querySelectorAll(".sidebar-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.nav === nav);
    });
}

function goHome() {
    if (typeof window.__mmSetRoute === 'function') {
      try { window.__mmSetRoute('home'); } catch (_) {}
    }
    hideAllPages();
    document.body.classList.remove("games-view");
    const header = document.querySelector(".header");
    const welcome = document.querySelector(".welcome-card");
    const toolsSec = document.querySelector(".tools-section");
    const learning = document.querySelector(".learning-card");
    if (header) header.style.display = "flex";
    if (welcome) welcome.style.display = "flex";
    if (toolsSec) toolsSec.style.display = "block";
    if (learning) learning.style.display = "flex";
    setActiveSidebar("home");
    if (typeof isMobileSidebar === "function" && isMobileSidebar()) closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openToolsFromSidebar() {
    currentPage = "tools";
    if (typeof window.__mmSetRoute === 'function') {
      try { window.__mmSetRoute('tools'); } catch (_) {}
    }
    hideAllPages();
    document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
    document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
    document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
    document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
    if (toolsPage) toolsPage.classList.add("show");
    setActiveSidebar("tools");
    if (typeof isMobileSidebar === "function" && isMobileSidebar()) closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

let practicalToolReturnTo = "home"; // "home" | "tools"

function openPageFromSidebar(pageId, navKey, opts) {
    const practicalIds = ["paintPage","shoppingPage","discountPage","measurementPage","schoolPage"];
    if (practicalIds.includes(pageId)) practicalToolReturnTo = "home";
    if (!(opts && opts.skipRoute) && typeof window.__mmSetRoute === 'function') {
      try { window.__mmSetRoute(pageId); } catch (_) {}
    }
    hideAllPages();
    document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
    document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
    document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
    document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
    const page = document.getElementById(pageId);
    if (page) page.classList.add("show");
    document.body.classList.toggle("games-view", navKey === "games");
    document.body.classList.toggle("darsyar-view", navKey === "darsyar");
    setActiveSidebar(navKey);
    if (typeof isMobileSidebar === "function" && isMobileSidebar()) closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnFromPracticalTool(pageId) {
    document.getElementById(pageId)?.classList.remove("show");
    if (practicalToolReturnTo === "tools") {
        openToolsFromSidebar();
    } else {
        goHome();
    }
}

document.getElementById("sidebarHome")?.addEventListener("click", goHome);
document.getElementById("sidebarTools")?.addEventListener("click", openToolsFromSidebar);

document.getElementById("sidebarGames")?.addEventListener("click", () => openPageFromSidebar("gamesPage", "games"));
document.getElementById("sidebarDarsyar")?.addEventListener("click", () => openPageFromSidebar("darsyarPage", "darsyar"));

function getMathMateSharedSettings(){
    const m=(document.body.className.match(/(?:^|\s)(theme-instagram|theme-pink-purple|theme-blue-purple|theme-gold-black)(?:\s|$)/)||[])[1]||'theme-instagram';
    return {type:'mathmate:settings',version:1,theme:document.body.classList.contains('dark')?'dark':'light',colorTheme:m.replace('theme-',''),fontSize:['small','normal','large'].includes(localStorage.getItem('mathmateFontSize'))?localStorage.getItem('mathmateFontSize'):'normal',language:document.documentElement.lang==='en'?'en':'fa',animations:!document.body.classList.contains('no-animations')};
}
function syncDarsyarComponent(){
    const mount=document.getElementById('darsyarMount'); if(!mount || !mount.shadowRoot) return;
    window.dispatchEvent(new CustomEvent('mathmate:host-settings',{detail:getMathMateSharedSettings()}));
}
window.addEventListener('mathmate:settings-changed',syncDarsyarComponent);
window.addEventListener('storage',event=>{if(['mathmateTheme','mathmateColorTheme','mathmateFontSize','mathmateLang','mathmateAnimations'].includes(event.key))syncDarsyarComponent();});
window.addEventListener('mathmate:darsyar-setting-request',event=>{
    const request=event.detail||{}; const {key,value}=request;
    if(key==='theme'&&(value==='light'||value==='dark')) changeTheme(value);
    else if(key==='colorTheme'&&['instagram','pink-purple','blue-purple','gold-black'].includes(value)) applyColorTheme(value);
    else if(key==='fontSize'&&['small','normal','large'].includes(value)) changeFontSize(value);
    else if(key==='language'&&(value==='fa'||value==='en')) applyLanguage(value);
    else if(key==='animations'&&typeof value==='boolean') applyAnimations(value);
});
/* Collapsible Real World submenu */
const realworldToggle = document.getElementById("sidebarRealWorldToggle");
const realworldSubmenu = document.getElementById("realworldSubmenu");
if (realworldToggle && realworldSubmenu) {
    realworldToggle.addEventListener("click", () => {
        const isOpen = realworldSubmenu.classList.toggle("open");
        realworldToggle.classList.toggle("expanded", isOpen);
    });
}

document.getElementById("sidebarPaint")?.addEventListener("click", () => openPageFromSidebar("paintPage", "paint"));
document.getElementById("sidebarShopping")?.addEventListener("click", () => openPageFromSidebar("shoppingPage", "shopping"));
document.getElementById("sidebarDiscount")?.addEventListener("click", () => openPageFromSidebar("discountPage", "discount"));
document.getElementById("sidebarMeasurement")?.addEventListener("click", () => openPageFromSidebar("measurementPage", "measurement"));
document.getElementById("sidebarSchool")?.addEventListener("click", () => openPageFromSidebar("schoolPage", "school"));

document.getElementById("sidebarSettings")?.addEventListener("click", () => {
    openPageFromSidebar("settingsPage", "settings");
});
document.getElementById("sidebarAbout")?.addEventListener("click", () => {
    openPageFromSidebar("aboutPage", "about");
});

/* ================= PAINT ================= */
document.getElementById("paintBack")?.addEventListener("click", () => {
    returnFromPracticalTool("paintPage");
});
document.getElementById("calculatePaint")?.addEventListener("click", () => {
    const W = Number(document.getElementById("paintWidth")?.value);
    const H = Number(document.getElementById("paintHeight")?.value);
    const openings = Number(document.getElementById("paintOpenings")?.value) || 0;
    const coats = 2;       // practical default estimate; no extra technical fields needed
    const coverage = 10;   // approximate 10 m² per liter
    if (!W || !H || W <= 0 || H <= 0) {
        void mmAlert(translateKey("alert_paint"));
        return;
    }
    const totalArea = W * H;
    const paintable = Math.max(0, totalArea - openings);
    const withCoats = paintable * coats;
    const liters = withCoats / coverage;
    document.getElementById("paintLiters").textContent =
        (currentLang === "en" ? "About " : "حدود ") +
        liters.toLocaleString(currentLang === "en" ? "en" : "fa-IR", { maximumFractionDigits: 2 }) +
        (currentLang === "en" ? " liters needed." : " لیتر رنگ لازم است.");
    document.getElementById("paintSteps").innerHTML = `
        <div class="step">${currentLang === "en" ? "Wall area" : "مساحت دیوار"} — ${W} × ${H} = ${totalArea.toFixed(2)} m²</div>
        <div class="step">${currentLang === "en" ? "Paintable area" : "مساحت قابل رنگ‌آمیزی"} — ${totalArea.toFixed(2)} − ${openings} = ${paintable.toFixed(2)} m²</div>
        <div class="step">${currentLang === "en" ? "Estimated paint needed (approx. 2 coats)" : "رنگ تقریبی موردنیاز (حدود دو دست)"} — ${liters.toFixed(2)} L</div>
        <div class="step">${currentLang === "en" ? "This is an estimate; actual use depends on the wall and paint." : "این عدد تقریبی است و به جنس دیوار و نوع رنگ بستگی دارد."}</div>
    `;
    document.getElementById("paintResult").classList.add("show");
});

/* ================= SHOPPING ================= */
document.getElementById("shoppingBack")?.addEventListener("click", () => {
    returnFromPracticalTool("shoppingPage");
});
document.getElementById("calculateShopping")?.addEventListener("click", () => {
    const price = Number(document.getElementById("shopPrice")?.value);
    const qty = Number(document.getElementById("shopQty")?.value);
    const disc = Number(document.getElementById("shopDiscount")?.value) || 0;
    if (!price || !qty || price <= 0 || qty <= 0) {
        void mmAlert(translateKey("alert_shopping"));
        return;
    }
    const subtotal = price * qty;
    const discountAmt = subtotal * (disc / 100);
    const final = subtotal - discountAmt;
    const loc = currentLang === "en" ? "en" : "fa-IR";
    document.getElementById("shopSubtotal").textContent = subtotal.toLocaleString(loc);
    document.getElementById("shopDiscountAmount").textContent = discountAmt.toLocaleString(loc);
    document.getElementById("shopTotal").textContent = final.toLocaleString(loc);
    document.getElementById("shopSteps").innerHTML = `
        <div class="step">${price.toLocaleString(loc)} × ${qty} = ${subtotal.toLocaleString(loc)}</div>
        <div class="step">${subtotal.toLocaleString(loc)} × ${disc}% = ${discountAmt.toLocaleString(loc)}</div>
        <div class="step">${subtotal.toLocaleString(loc)} − ${discountAmt.toLocaleString(loc)} = ${final.toLocaleString(loc)}</div>
    `;
    document.getElementById("shoppingResult").classList.add("show");
});

/* ================= DISCOUNT ================= */
document.getElementById("discountBack")?.addEventListener("click", () => {
    returnFromPracticalTool("discountPage");
});
document.getElementById("calculateDiscount")?.addEventListener("click", () => {
    const price = Number(document.getElementById("discountPrice")?.value);
    const pct = Number(document.getElementById("discountPercent")?.value);
    if (!price || price <= 0 || isNaN(pct) || pct < 0) {
        void mmAlert(translateKey("alert_discount"));
        return;
    }
    const amount = price * (pct / 100);
    const final = price - amount;
    const loc = currentLang === "en" ? "en" : "fa-IR";
    document.getElementById("discountAmount").textContent = amount.toLocaleString(loc);
    document.getElementById("discountFinal").textContent = final.toLocaleString(loc);
    document.getElementById("discountSteps").innerHTML = `
        <div class="step">${price.toLocaleString(loc)} × ${pct}% = ${amount.toLocaleString(loc)}</div>
        <div class="step">${price.toLocaleString(loc)} − ${amount.toLocaleString(loc)} = ${final.toLocaleString(loc)}</div>
    `;
    document.getElementById("discountResult").classList.add("show");
});

/* ================= MEASUREMENT ================= */
document.getElementById("measurementBack")?.addEventListener("click", () => {
    returnFromPracticalTool("measurementPage");
});
document.getElementById("calculateMeasurement")?.addEventListener("click", () => {
    const L = Number(document.getElementById("measLength")?.value);
    const W = Number(document.getElementById("measWidth")?.value);
    const Hval = document.getElementById("measHeight")?.value.trim();
    const H = Hval === "" ? null : Number(Hval);
    if (!L || !W || L <= 0 || W <= 0) {
        void mmAlert(translateKey("alert_measurement"));
        return;
    }
    const area = L * W;
    const perimeter = 2 * (L + W);
    document.getElementById("measArea").textContent = area.toFixed(2);
    document.getElementById("measPerimeter").textContent = perimeter.toFixed(2);
    let steps = `<div class="step">${L} × ${W} = ${area.toFixed(2)}</div><div class="step">2 × (${L} + ${W}) = ${perimeter.toFixed(2)}</div>`;
    if (H !== null && H > 0) {
        const volume = area * H;
        document.getElementById("measVolume").textContent = volume.toFixed(2);
        document.getElementById("measVolumeRow").style.display = "flex";
        steps += `<div class="step">${area.toFixed(2)} × ${H} = ${volume.toFixed(2)}</div>`;
    } else {
        document.getElementById("measVolumeRow").style.display = "none";
    }
    document.getElementById("measSteps").innerHTML = steps;
    document.getElementById("measurementResult").classList.add("show");
});

/* ================= SCHOOL ================= */
document.getElementById("schoolBack")?.addEventListener("click", () => {
    returnFromPracticalTool("schoolPage");
});
document.querySelectorAll(".school-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".school-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const name = tab.dataset.tab;
        document.getElementById("schoolAverage").style.display = name === "average" ? "block" : "none";
        document.getElementById("schoolProportion").style.display = name === "proportion" ? "block" : "none";
        document.getElementById("schoolSpeed").style.display = name === "speed" ? "block" : "none";
        document.getElementById("schoolResult")?.classList.remove("show");
    });
});
document.getElementById("calcAverage")?.addEventListener("click", () => {
    const raw = document.getElementById("avgNumbers")?.value.trim();
    const isEn = (typeof currentLang !== "undefined" && currentLang === "en") || document.documentElement.lang === "en";
    if (!raw) {
        void mmAlert(isEn ? "Please enter at least one number." : "لطفاً حداقل یک عدد وارد کن.");
        return;
    }
    const nums = raw.split(/[,،\s]+/).map(Number).filter((n) => Number.isFinite(n));
    if (!nums.length) {
        void mmAlert(isEn ? "Please enter valid numbers separated by commas." : "لطفاً اعداد معتبر را با ویرگول جدا کن.");
        return;
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    document.getElementById("schoolSteps").innerHTML = `
        <div class="step">${nums.join(", ")}</div>
        <div class="step">Σ = ${sum}</div>
        <div class="step">n = ${nums.length}</div>
        <div class="step">avg = ${avg.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
    `;
    document.getElementById("schoolResult").classList.add("show");
});
document.getElementById("calcProportion")?.addEventListener("click", () => {
    const a = Number(document.getElementById("propA")?.value);
    const b = Number(document.getElementById("propB")?.value);
    const c = Number(document.getElementById("propC")?.value);
    const isEn = (typeof currentLang !== "undefined" && currentLang === "en") || document.documentElement.lang === "en";
    if (!a || !b || !c || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
        void mmAlert(isEn ? "Please fill in a, b, and c with valid numbers." : "لطفاً مقادیر a، b و c را با اعداد معتبر پر کن.");
        return;
    }
    const x = (b * c) / a;
    document.getElementById("schoolSteps").innerHTML = `
        <div class="step">x = (b × c) / a</div>
        <div class="step">x = (${b} × ${c}) / ${a} = ${x}</div>
    `;
    document.getElementById("schoolResult").classList.add("show");
});
document.getElementById("calcSpeed")?.addEventListener("click", () => {
    const s = document.getElementById("spdSpeed")?.value.trim() === "" ? null : Number(document.getElementById("spdSpeed").value);
    const t = document.getElementById("spdTime")?.value.trim() === "" ? null : Number(document.getElementById("spdTime").value);
    const d = document.getElementById("spdDist")?.value.trim() === "" ? null : Number(document.getElementById("spdDist").value);
    let html = "";
    if (s != null && t != null && d == null) html = `<div class="step">d = s × t = ${s * t}</div>`;
    else if (d != null && t != null && s == null && t) html = `<div class="step">s = d / t = ${d / t}</div>`;
    else if (d != null && s != null && t == null && s) html = `<div class="step">t = d / s = ${d / s}</div>`;
    else return void mmAlert((typeof currentLang!=='undefined'&&currentLang==='en')||document.documentElement.lang==='en'?'Enter exactly two values.':'دقیقاً دو مقدار وارد کن.');
    document.getElementById("schoolSteps").innerHTML = html;
    document.getElementById("schoolResult").classList.add("show");
});

/* ================= ANIMATIONS TOGGLE ================= */
let animationsEnabled = localStorage.getItem("mathmateAnimations") !== "off";
function applyAnimations(on) {
    animationsEnabled = on;
    document.body.classList.toggle("no-animations", !on);
    localStorage.setItem("mathmateAnimations", on ? "on" : "off");
    window.dispatchEvent(new Event("mathmate:settings-changed"));
    document.getElementById("animOn")?.classList.toggle("active", on);
    document.getElementById("animOff")?.classList.toggle("active", !on);
}
applyAnimations(animationsEnabled);
document.getElementById("animOn")?.addEventListener("click", () => applyAnimations(true));
document.getElementById("animOff")?.addEventListener("click", () => applyAnimations(false));

/* ================= LANGUAGE TOGGLE ================= */
let currentLang = localStorage.getItem("mathmateLang") || "fa";
const domPhrasePairs = [
    ["همیار ریاضی", "MathMate"],
    ["خانه", "Home"], ["ابزارها", "Tools"], ["بازی‌های ریاضی", "Math Games"], ["ریاضی در دنیای واقعی", "Real-World Math"], ["ابزارهای کاربردی", "Practical Tools"],
    ["رنگ‌آمیزی", "Paint"], ["خرید", "Shopping"], ["تخفیف", "Discount"], ["اندازه‌گیری", "Measurement"], ["مسائل مدرسه", "School Problems"], ["سایر", "Other"], ["تنظیمات", "Settings"], ["درباره ما", "About"],
    ["بازگشت", "Back"], ["برگشت", "Back"], ["ماشین حساب", "Calculator"], ["مضرب‌ها", "Multiples"], ["پیدا کردن مضرب‌ها", "Find Multiples"],
    ["یک عدد وارد کن تا مضرب‌های آن را پیدا کنیم.", "Enter a number to find its multiples."], ["عدد مورد نظر", "Number"], ["چند مضرب نمایش داده شود؟", "How many multiples should be shown?"], ["مضرب‌های عدد", "Multiples of the number"], ["نتیجه اینجا نمایش داده می‌شود", "The result will appear here."],
    ["محاسبه مساحت و محیط", "Calculate Area & Perimeter"], ["شکل مورد نظر را انتخاب کن و اندازه‌های آن را وارد کن.", "Select a shape and enter its dimensions."], ["مستطیل", "Rectangle"], ["مربع", "Square"], ["مثلث", "Triangle"], ["دایره", "Circle"], ["JavaScript این قسمت را تغییر می‌دهد", "JavaScript updates this section"], ["محاسبه کن", "Calculate"], ["مساحت", "Area"], ["محیط", "Perimeter"],
    ["محاسبه ب.م.م و ک.م.م", "Calculate GCD & LCM"], ["دو عدد وارد کن تا ب.م.م و ک.م.م آن‌ها را پیدا کنیم.", "Enter two numbers to find their GCD and LCM."], ["عدد اول", "First number"], ["عدد دوم", "Second number"], ["ب.م.م", "GCD"], ["ک.م.م", "LCM"],
    ["آموزش", "Learning"], ["دنبال چی می‌گردی؟", "What are you looking for?"], ["موضوع مورد نظرت را وارد کن تا فیلم‌های آموزشی مرتبط را پیدا کنیم.", "Enter a topic to find related educational videos."], ["موضوع آموزشی", "Educational topic"], ["جستجو در آپارات", "Search on Aparat"], ["جستجو در یوتیوب", "Search on YouTube"],
    ["شمارنده‌ها", "Factors"], ["پیدا کردن شمارنده‌ها", "Find Factors"], ["یک عدد وارد کن تا شمارنده‌های آن را پیدا کنیم.", "Enter a number to find its factors."], ["شمارنده‌های عدد", "Factors of the number"], ["نتیجه اینجا قرار می‌گیرد", "The result will appear here."],
    ["تبدیل تاریخ", "Date Converter"], ["تاریخ شمسی، میلادی یا قمری را وارد کن تا به تقویم‌های دیگر تبدیل شود.", "Enter a Jalali, Gregorian, or Hijri date to convert it to the other calendars."], ["شمسی", "Jalali"], ["میلادی", "Gregorian"], ["قمری", "Hijri"], ["انتخاب تاریخ", "Pick a date"], ["تقویم دلخواهت را انتخاب کن", "Choose your preferred calendar"], ["امروز", "Today"], ["ماه قبل", "Previous month"], ["ماه بعد", "Next month"], ["بستن", "Close"], ["سال", "Year"], ["ماه", "Month"], ["روز", "Day"], ["نتیجه تبدیل", "Conversion result"],
    ["تبدیل واحد", "Unit Converter"], ["مقدار مورد نظر را وارد کن و واحد آن را تبدیل کن.", "Enter a value and convert its unit."], ["طول", "Length"], ["وزن", "Weight"], ["حجم", "Volume"], ["دما", "Temperature"], ["مقدار", "Value"], ["تبدیل از", "Convert from"], ["تبدیل به", "Convert to"], ["نتیجه", "Result"],
    ["محاسبه درصد", "Percentage Calculator"], ["درصد و عدد مورد نظر را وارد کن تا مقدار درصد را حساب کنیم.", "Enter the percentage and number to calculate the result."], ["درصد مورد نظر", "Percentage"], ["عدد", "Number"],
    ["تبدیل زمان", "Time Converter"], ["زمان را به‌سادگی بین ثانیه، دقیقه، ساعت و روز تبدیل کنید.", "Easily convert time between seconds, minutes, hours, and days."], ["از", "From"], ["به", "To"], ["نتیجه تبدیل:", "Conversion result:"],
    ["رنگ‌آمیزی دیوار", "Wall Painting"], ["محاسبه رنگ دیوار", "Calculate Wall Paint"], ["عرض، ارتفاع و مساحت در و پنجره را وارد کن.", "Enter wall width, height, and door/window area."], ["عرض، ارتفاع، مساحت بازشوها و تعداد دست رنگ را وارد کن.", "Enter the width, height, openings area, and number of coats."], ["عرض دیوار (متر)", "Wall width (m)"], ["ارتفاع دیوار (متر)", "Wall height (m)"], ["مساحت در و پنجره (متر مربع)", "Door and window area (m²)"], ["تعداد دست رنگ", "Number of coats"], ["پوشش هر لیتر رنگ (متر مربع)", "Coverage per liter (m²)"], ["رنگ مورد نیاز", "Required paint"],
    ["هزینه خرید", "Shopping Cost"], ["محاسبه هزینه خرید", "Calculate Shopping Cost"], ["قیمت، تعداد و درصد تخفیف را وارد کن.", "Enter the price, quantity, and discount percentage."], ["قیمت کالا (تومان)", "Item price (toman)"], ["تعداد", "Quantity"], ["درصد تخفیف", "Discount percentage"], ["قیمت اولیه", "Subtotal"], ["مبلغ تخفیف", "Discount amount"], ["قیمت نهایی", "Final price"],
    ["درصد و تخفیف", "Discount & Percentage"], ["محاسبه درصد و تخفیف", "Calculate Discount"], ["مبلغ و درصد را وارد کن تا مبلغ تخفیف و قیمت نهایی را ببینی.", "Enter the amount and percentage to see the discount and final price."], ["مبلغ (تومان)", "Amount (toman)"], ["درصد", "Percent"],
    ["محاسبه مساحت، محیط و حجم", "Calculate Area, Perimeter & Volume"], ["طول و عرض را وارد کن. ارتفاع اختیاری است.", "Enter the length and width. Height is optional."], ["طول (متر)", "Length (m)"], ["عرض (متر)", "Width (m)"], ["ارتفاع (متر) — اختیاری", "Height (m) — optional"], ["حجم", "Volume"],
    ["مسائل رایج مدرسه", "Common School Problems"], ["میانگین، تناسب یا سرعت/مسافت/زمان را انتخاب کن و اعداد را وارد کن.", "Choose average, proportion, or speed/distance/time and enter the numbers."], ["میانگین", "Average"], ["تناسب", "Proportion"], ["سرعت / مسافت", "Speed / Distance"], ["اعداد (با ویرگول جدا کن)", "Numbers (separate with commas)"], ["محاسبه میانگین", "Calculate Average"], ["فرمول: a / b = c / x x = (b × c) / a", "Formula: a / b = c / x  x = (b × c) / a"], ["محاسبه x", "Calculate x"], ["سرعت (اختیاری)", "Speed (optional)"], ["زمان (اختیاری)", "Time (optional)"], ["مسافت (اختیاری)", "Distance (optional)"], ["دو مقدار را وارد کن تا سومی محاسبه شود.", "Enter two values to calculate the third."],
    ["فیلم‌های آموزشی", "Educational Videos"], ["آموزش‌های ریاضی را ببین و بهتر یاد بگیر.", "Watch math lessons and learn better."], ["عنوان فیلم آموزشی", "Lesson title"], ["توضیح کوتاهی درباره این آموزش", "A short description of this lesson"],
    ["آواتار", "Avatar"], ["انتخاب آواتار", "Choose Avatar"], ["از آواتارهای پیش‌فرض یکی را انتخاب کن یا از دستگاه خودت یک عکس بگذار. عکس کامل با گوشه‌های گرد نمایش داده می‌شود.", "Choose a default avatar or upload a photo from your device. The full image is shown with rounded corners."], ["انتخاب از دستگاه", "Choose from device"], ["ذخیره آواتار", "Save Avatar"], ["آواتارهای پیش‌فرض", "Default Avatars"],
    ["اندازه نوشته‌ها", "Font Size"], ["اندازه متن‌های برنامه را انتخاب کن.", "Choose the app text size."], ["کوچک", "Small"], ["معمولی", "Normal"], ["بزرگ", "Large"], ["ظاهر برنامه", "Appearance"], ["حالت روشن یا تاریک را انتخاب کن.", "Choose light or dark mode."], ["روشن", "Light"], ["تاریک", "Dark"], ["تم رنگی", "Color Theme"], ["پالت رنگ برنامه را انتخاب کن.", "Choose the app color palette."], ["اینستاگرام", "Instagram"], ["صورتی و بنفش", "Pink & Purple"], ["آبی و بنفش", "Blue & Purple"], ["زبان", "Language"], ["زبان رابط کاربری را انتخاب کن.", "Choose the interface language."], ["فارسی", "Persian"], ["انیمیشن‌ها", "Animations"], ["انیمیشن‌های برنامه را روشن یا خاموش کن.", "Enable or disable app animations."], ["خاموش", "Off"], ["اطلاعات دستگاه", "Device Info"], ["سیستم عامل", "Operating System"], ["در حال تشخیص...", "Detecting..."], ["معماری سیستم", "System Architecture"], ["مرورگر", "Browser"],
    ["تغییر علامت عدد، جذر و توان در ماشین‌حساب", "Change sign, square root, and powers in the calculator"], ["محاسبهٔ عبارت‌های ریاضی با رعایت ترتیب عملگرها و پرانتزها", "Evaluate mathematical expressions with operator precedence and parentheses"], ["حل معادله‌های خطی یک‌مجهولی", "Solve one-variable linear equations"], ["بازی‌های سودوکو، پاسخ سریع، ادغام اعداد، معمای عددی، عدد گمشده و حافظهٔ ریاضی", "Games: Sudoku, Quick Answer, Number Merge, Number Puzzle, Missing Number, and Math Memory"], ["پشتیبان‌گیری و بازیابی اطلاعات سایت با فایل JSON", "Back up and restore site data using a JSON file"], ["پاک‌کردن اطلاعات ذخیره‌شدهٔ سایت با حفظ حالت روشن یا تاریک", "Clear saved site data while preserving light or dark mode"], ["مدیریت تکلیف‌ها، یادداشت‌ها، تقویم و زمان تمرکز در درس‌یار", "Manage tasks, notes, calendar, and focus timer in Study Planner"], ["جست‌وجوی اطلاعات مرتبط در درس‌یار", "Search for related information in Study Planner"], ["ثبت آمار، امتیازها و رکوردهای بازی‌ها", "Track game statistics, scores, and records"], ["تایمر تمرکز مطالعه با حلقهٔ پیشرفت در درس‌یار", "Study focus timer with progress ring in Study Planner"],
    ["پشتیبان‌گیری و بازیابی کل سایت", "Full-site backup and restore"], ["تمام اطلاعات همیار ریاضی را منتقل یا نگهداری کن.", "Transfer or preserve all MathMate data."], ["یک فایل JSON از تم رنگی، حالت روشن/تاریک، زبان و تنظیمات، نام و آواتار، آمار و رکورد همهٔ بازی‌ها و تمام اطلاعات درس‌یار بساز؛ سپس آن را در همین سایت روی دستگاهی دیگر بازیابی کن.", "Create a JSON file containing color theme, light/dark mode, language and settings, name and avatar, all game statistics and records, and all Study Planner data; then restore it on another device."], ["دریافت پشتیبان", "Download backup"], ["بازیابی پشتیبان", "Restore backup"], ["حذف همه اطلاعات", "Clear all data"], ["این کار قابل بازگردانی نیست مگر پشتیبان داشته باشی.", "This action cannot be undone unless you have a backup."], ["با این کار همهٔ اطلاعات سایت، از جمله نام و آواتار، تم رنگی، تنظیمات شخصی، آمار و رکورد بازی‌ها و اطلاعات درس‌یار پاک می‌شود. حالت روشن/تاریک فعلی تغییر نمی‌کند.", "This clears site data, including name and avatar, color theme, personal settings, game statistics and records, and Study Planner data. The current light/dark mode stays unchanged."], ["پاک کردن اطلاعات سایت", "Clear site data"],
    ["درباره همیار ریاضی", "About MathMate"], ["نسخه 4.0.0", "Version 4.0.0"], ["MathMate یک ابزار ساده و کاربردی برای کمک به انجام محاسبات ریاضی و یادگیری بهتر مفاهیم ریاضی است.", "MathMate is a simple and useful tool for calculations and learning math concepts."], ["امکانات برنامه", "Features"], ["محاسبه مضرب‌ها", "Calculate multiples"], ["پیدا کردن شمارنده‌ها", "Find factors"], ["محاسبه مساحت و محیط شکل‌ها", "Calculate area and perimeter of shapes"], ["محاسبه ب.م.م و ک.م.م", "Calculate GCD & LCM"], ["جستجوی آموزش‌های ریاضی در آپارات و یوتیوب", "Search for math lessons on Aparat and YouTube"], ["تبدیل تاریخ شمسی، میلادی و قمری", "Convert Jalali, Gregorian, and Hijri dates"], ["تبدیل واحدهای طول، وزن، حجم و دما", "Convert length, weight, volume, and temperature units"], ["تبدیل واحدهای زمان", "Convert time units"], ["محاسبه درصد", "Calculate percentages"], ["محاسبه رنگ‌آمیزی دیوار", "Calculate wall paint"], ["محاسبه هزینه خرید", "Calculate shopping cost"], ["محاسبه تخفیف", "Calculate discount"], ["مسائل مدرسه با راه‌حل گام‌به‌گام", "School problems with step-by-step solutions"], ["حالت روشن و تاریک", "Light and dark mode"], ["تنظیم اندازه نوشته‌ها", "Adjust font size"], ["ذخیره تنظیمات با LocalStorage", "Save settings with LocalStorage"], ["نمایش اطلاعات دستگاه و مرورگر", "Show device and browser information"], ["سایدبار و نوار ناوبری", "Sidebar and navigation bar"], ["انتخاب و شخصی‌سازی آواتار (۴۰ آواتار)", "Choose and customize avatar (40 avatars)"], ["درس‌یار (برنامه‌ریز مطالعه، تکلیف و امتحان)", "Study Planner (homework, exams & notes)"], ["تم‌های رنگی (اینستاگرام، صورتی، آبی، طلایی)", "Color themes (Instagram, pink, blue, gold)"], ["تغییر زبان فارسی / انگلیسی", "Switch language Persian / English"], ["روشن و خاموش کردن انیمیشن‌ها", "Turn animations on or off"], ["صفحه درباره برنامه", "About the app page"], ["بازی‌های ریاضی", "Math games"], ["درباره نسخه", "About this version"], ["فرمول", "Formula"], ["مساحت", "Area"], ["محیط", "Perimeter"], ["ب.م.م", "GCD"], ["ک.م.م", "LCM"], ["طول", "Length"], ["عرض", "Width"], ["قاعده", "Base"], ["ارتفاع", "Height"], ["شعاع", "Radius"], ["اندازه ضلع", "Side length"], ["ضلع اول", "Side 1"], ["ضلع دوم", "Side 2"], ["محاسبه کن", "Calculate"], ["نام شما", "Your name"], ["نامت را وارد کن", "Enter your name"], ["این نام روی صفحهٔ خوش‌آمدگویی نمایش داده می‌شود.", "This name appears in the welcome message."], ["نسخه 4.0.0 یک نسخه جدیدتر و کامل‌تر از نسخه‌های اولیه MathMate است و با ظاهر بهتر، ابزارهای بیشتر و تنظیمات شخصی‌سازی ساخته شده.", "Version 4.0.0 is a newer and more complete version of the early MathMate releases, with a better interface, more tools, and personalization settings."],
    ["سلام!", "Hello!"], ["به همیار ریاضی خوش اومدی", "Welcome to MathMate"], ["آماده یادگیری؟", "Ready to learn?"], ["ریاضی رو راحت‌تر", "Learn math easier"], ["و جذاب‌تر یاد بگیر!", "and make it more fun!"], ["ابزارهای کاربردی ریاضی، ماشین حساب و آموزش، همه در یک جا.", "Practical math tools, a calculator, and learning resources — all in one place."], ["شروع کنیم", "Let's start"], ["همه ابزارها", "All tools"], ["آماده‌ای شروع کنی؟", "Ready to begin?"], ["یک ابزار انتخاب کن و شروع کن!", "Pick a tool and start!"],
    ["تغییر آواتار", "Change avatar"], ["پیش‌نمایش", "Preview"], ["تغییر حالت", "Toggle theme"], ["خطا", "Error"], ["نامشخص", "Unknown"],
    ["ثانیه", "seconds"], ["دقیقه", "minutes"], ["ساعت", "hours"], ["مثلاً 5", "e.g. 5"], ["مثلاً 10", "e.g. 10"], ["مثلاً 12", "e.g. 12"], ["مثلاً 18", "e.g. 18"], ["مثلاً آموزش کسر کلاس هفتم", "e.g. a seventh-grade fraction lesson"], ["مثلاً 24", "e.g. 24"], ["مثلاً 1405", "e.g. 1405"], ["مثلاً 20", "e.g. 20"], ["مثلاً 500", "e.g. 500"], ["مثلاً 120", "e.g. 120"], ["مثلاً 4", "e.g. 4"], ["مثلاً 3", "e.g. 3"], ["مثلاً 2", "e.g. 2"], ["مثلاً 50000", "e.g. 50000"], ["مثلاً 200000", "e.g. 200000"], ["مثلاً 200000", "e.g. 200000"], ["مثلاً 18, 17, 19, 16", "e.g. 18, 17, 19, 16"], ["مثلاً 60", "e.g. 60"], ["مثلاً 27", "e.g. 27"], ["مثلاً 6", "e.g. 6"],
    ["تقویم انتخاب شده:", "Selected calendar:"], ["Menu", "منو"], ["Close", "بستن"], ["English", "انگلیسی"],
];

const domPhraseFaToEn = new Map(domPhrasePairs.map(([fa, en]) => [fa, en]));
const domPhraseEnToFa = new Map(domPhrasePairs.map(([fa, en]) => [en, fa]));

function normalizeUiText(value) {
    return String(value).replace(/\s+/g, " ").trim();
}

function translateUiText(value, lang) {
    const normalized = normalizeUiText(value);
    if (!normalized) return null;
    const map = lang === "en" ? domPhraseFaToEn : domPhraseEnToFa;
    return map.get(normalized) || null;
}


/* ========== Site-native alert / confirm (never browser chrome) ========== */
function mmAlert(message) {
    return new Promise((resolve) => {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'mm-confirm-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            const okLabel = (typeof currentLang !== 'undefined' && currentLang === 'en') || document.documentElement.lang === 'en' ? 'OK' : 'باشه';
            overlay.innerHTML = '<div class="mm-confirm-dialog"><p></p><div class="mm-confirm-actions"><button type="button" class="mm-confirm-ok"></button></div></div>';
            overlay.querySelector('p').textContent = String(message ?? '');
            overlay.querySelector('.mm-confirm-ok').textContent = okLabel;
            const finish = () => { try { overlay.remove(); } catch (_) {} resolve(); };
            overlay.querySelector('.mm-confirm-ok').addEventListener('click', finish);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(); });
            document.body.appendChild(overlay);
            try { overlay.querySelector('.mm-confirm-ok').focus(); } catch (_) {}
        } catch (_) {
            try { window.alert(message); } catch (__) {}
            resolve();
        }
    });
}

function mmConfirm(message) {
    return new Promise((resolve) => {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'mm-confirm-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            const isEn = (typeof currentLang !== 'undefined' && currentLang === 'en') || document.documentElement.lang === 'en';
            const okLabel = isEn ? 'OK' : 'تأیید';
            const cancelLabel = isEn ? 'Cancel' : 'لغو';
            overlay.innerHTML = '<div class="mm-confirm-dialog"><p></p><div class="mm-confirm-actions"><button type="button" class="mm-confirm-cancel"></button><button type="button" class="mm-confirm-ok"></button></div></div>';
            overlay.querySelector('p').textContent = String(message ?? '');
            overlay.querySelector('.mm-confirm-ok').textContent = okLabel;
            overlay.querySelector('.mm-confirm-cancel').textContent = cancelLabel;
            const finish = (value) => { try { overlay.remove(); } catch (_) {} resolve(value); };
            overlay.querySelector('.mm-confirm-ok').addEventListener('click', () => finish(true));
            overlay.querySelector('.mm-confirm-cancel').addEventListener('click', () => finish(false));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
            document.body.appendChild(overlay);
            try { overlay.querySelector('.mm-confirm-ok').focus(); } catch (_) {}
        } catch (_) {
            try { resolve(window.confirm(message)); } catch (__) { resolve(false); }
        }
    });
}

function translateKey(key) {

    const lang = document.documentElement.lang === "en" ? "en" : "fa";
    return (i18n[lang] && i18n[lang][key]) || "";
}

const i18n = {
    fa: {
        app_name: "همیار ریاضی",
        home: "خانه", tools: "ابزارها", games_nav: "بازی‌های ریاضی", darsyar_nav: "درس‌یار", practical_tools: "ابزارهای کاربردی", paint: "رنگ‌آمیزی",
        shopping: "خرید", discount: "تخفیف", measurement: "اندازه‌گیری", school: "مسائل مدرسه",
        education: "آموزش", settings: "تنظیمات", about: "درباره ما",
        realworld_section: "ریاضی در دنیای واقعی", other: "سایر",
        language_title: "زبان", language_desc: "زبان رابط کاربری را انتخاب کن.",
        anim_title: "انیمیشن‌ها", anim_desc: "انیمیشن‌های برنامه را روشن یا خاموش کن.",
        device_title: "اطلاعات دستگاه", os_label: "سیستم عامل", arch_label: "معماری سیستم", browser_label: "مرورگر",
        back: "بازگشت",
        avatar_title: "آواتار", avatar_heading: "انتخاب آواتار",
        avatar_desc: "از آواتارهای پیش‌فرض یکی را انتخاب کن یا یک عکس از دستگاهت بارگذاری کن؛ تصویر با گوشه‌های گرد نمایش داده می‌شود.",
        account_name_label: "نام شما", account_name_placeholder: "مثلاً حسین",
        account_name_help: "نام دلخواهت را وارد کن؛ این نام در پیام خوش‌آمدگویی نمایش داده می‌شود. پس از انتخاب آواتار، «تأیید و ذخیره اطلاعات» را بزن تا نام و تصویر با هم ذخیره شوند.",
        avatar_upload: "انتخاب عکس از دستگاه", avatar_save: "تأیید و ذخیره اطلاعات", avatar_defaults: "آواتارهای پیش‌فرض",
        avatar_saved: "اطلاعات حساب با موفقیت ذخیره شد!", avatar_fail: "ذخیره اطلاعات حساب ممکن نشد.",
        font_size_title: "اندازه نوشته‌ها", font_size_desc: "اندازه متن‌های برنامه را انتخاب کن.",
        font_small: "کوچک", font_normal: "معمولی", font_large: "بزرگ",
        appearance_title: "ظاهر برنامه", appearance_desc: "حالت روشن یا تاریک را انتخاب کن.",
        theme_light: "روشن", theme_dark: "تاریک",
        color_theme_title: "تم رنگی", color_theme_desc: "پالت رنگ برنامه را انتخاب کن.",
        theme_instagram: "اینستاگرام", theme_pink: "صورتی و بنفش", theme_blue: "آبی و بنفش", theme_gold: "طلایی و مشکی",
        hello: "سلام!", welcome_title: "به همیار ریاضی خوش اومدی",
        badge_ready: "آماده یادگیری؟", hero_line1: "ریاضی رو راحت‌تر", hero_line2: "و جذاب‌تر یاد بگیر!",
        hero_desc: "ابزارهای کاربردی ریاضی، ماشین حساب و آموزش، همه در یک جا.",
        start_btn: "شروع کنیم", tools_section_title: "ابزارهای همیار ریاضی", all_tools: "همه ابزارها",
        ready_start: "آماده‌ای شروع کنی؟", pick_tool: "یک ابزار انتخاب کن و شروع کن!",
        tools_page_title: "ابزارهای همیار ریاضی", tools_page_desc: "ابزار مورد نظرت را انتخاب کن و شروع کن.",
        about_title: "درباره همیار ریاضی",
        calc: "ماشین حساب", calc_expression_title: "محاسبهٔ عبارت و حل معادله", calc_expression_label: "عبارت یا معادله را وارد کن", calc_expression_placeholder: "مثال: (2 + 3) × 4", calc_expression_help: "عملگرهای +، −، ×، ÷، توان ^، رادیکال √ و معادله‌های خطی دارای x پشتیبانی می‌شوند.", calc_expression_submit: "محاسبه کن", geometry: "مساحت و محیط", gcd_lcm: "ب.م.م و ک.م.م",
        formula_label: "فرمول", area_label: "مساحت", perimeter_label: "محیط", gcd_label: "ب.م.م", lcm_label: "ک.م.م",
        length_label: "طول", width_label: "عرض", side_label: "اندازه ضلع", base_label: "قاعده", height_label: "ارتفاع",
        side1_label: "ضلع اول", side2_label: "ضلع دوم", radius_label: "شعاع", calculate_btn: "محاسبه کن",
        multiples: "مضرب‌ها", learning: "آموزش", factors: "شمارنده‌ها",
        date_convert: "تبدیل تاریخ", unit_convert: "تبدیل واحد", percentage: "محاسبه درصد",
        time_convert: "تبدیل زمان",
        anim_on: "روشن", anim_off: "خاموش",
        features: "امکانات برنامه", version_about: "درباره نسخه",
        footer: "ساخته شده با ❤ و JavaScript توسط حسین ثقفی",
        desc_calc: "محاسبات سریع و آسان",
        desc_geometry: "محاسبه شکل‌های هندسی",
        desc_gcd: "محاسبه سریع اعداد",
        desc_multiples: "پیدا کردن مضرب‌های یک عدد",
        desc_multiples_short: "پیدا کردن مضرب‌ها",
        desc_learning: "جستجوی فیلم‌های آموزشی",
        desc_learning_short: "یادگیری آنلاین",
        desc_factors: "پیدا کردن شمارنده‌های یک عدد",
        desc_factors_short: "پیدا کردن شمارنده‌ها",
        desc_date: "تبدیل تاریخ شمسی، میلادی و قمری",
        desc_unit: "تبدیل واحدهای مختلف",
        desc_percentage: "محاسبه درصد یک عدد",
        desc_time: "تبدیل ثانیه، دقیقه، ساعت و روز",
        desc_paint: "محاسبه رنگ دیوار",
        desc_shopping: "محاسبه هزینه خرید",
        desc_discount: "محاسبه درصد و تخفیف",
        desc_measurement: "مساحت، محیط و حجم",
        desc_school: "میانگین، تناسب، سرعت",
        alert_calc_error: "خطا",
        alert_calc_both: "لطفاً هر دو قسمت را کامل کن",
        alert_calc_numbers: "لطفاً عددهای معتبر وارد کن",
        alert_geometry_rect: "لطفاً طول و عرض معتبر وارد کن",
        alert_geometry_square: "لطفاً اندازه ضلع معتبر وارد کن",
        alert_geometry_triangle: "لطفاً همه اندازه‌ها را درست وارد کن",
        alert_geometry_circle: "لطفاً شعاع معتبر وارد کن",
        alert_gcd: "لطفاً دو عدد صحیح و مثبت وارد کن",
        alert_learning: "اول موضوع آموزشی مورد نظرت را وارد کن",
        alert_factors: "لطفاً یک عدد صحیح و مثبت وارد کن",
        alert_date_missing: "لطفاً سال، ماه و روز را کامل وارد کن",
        alert_date_invalid: "تاریخ واردشده معتبر نیست",
        alert_unit: "لطفاً یک عدد معتبر وارد کن",
        alert_percentage: "لطفاً درصد و عدد را به‌درستی وارد کن",
        alert_time: "لطفاً یک مقدار معتبر وارد کن",
        alert_paint: "لطفاً عرض و ارتفاع معتبر وارد کن",
        alert_shopping: "لطفاً قیمت و تعداد معتبر وارد کن",
        alert_discount: "لطفاً مبلغ و درصد معتبر وارد کن",
        alert_measurement: "لطفاً طول و عرض معتبر وارد کن",
        alert_select_image: "لطفاً یک تصویر انتخاب کن."
    },
    en: {
        app_name: "MathMate",
        home: "Home", tools: "Tools", games_nav: "Math Games", darsyar_nav: "Study Planner", practical_tools: "Practical Tools", paint: "Paint",
        shopping: "Shopping", discount: "Discount", measurement: "Measurement", school: "School Problems",
        education: "Education", settings: "Settings", about: "About",
        realworld_section: "Real-World Math", other: "Other",
        language_title: "Language", language_desc: "Choose interface language.",
        anim_title: "Animations", anim_desc: "Enable or disable app animations.",
        device_title: "Device Info", os_label: "Operating System", arch_label: "Architecture", browser_label: "Browser",
        back: "Back",
        avatar_title: "Avatar", avatar_heading: "Choose Avatar",
        avatar_desc: "Choose a default avatar or upload a photo from your device. Your image will be displayed with rounded corners.",
        account_name_label: "Your name", account_name_placeholder: "For example, Alex",
        account_name_help: "Enter the name you want to see in the welcome message. After choosing an avatar, select “Confirm and save profile” to save both together.",
        avatar_upload: "Choose a photo from device", avatar_save: "Confirm and save profile", avatar_defaults: "Default avatars",
        avatar_saved: "Profile details saved successfully!", avatar_fail: "Could not save profile details.",
        font_size_title: "Font size", font_size_desc: "Choose the app text size.",
        font_small: "Small", font_normal: "Normal", font_large: "Large",
        appearance_title: "Appearance", appearance_desc: "Choose light or dark mode.",
        theme_light: "Light", theme_dark: "Dark",
        color_theme_title: "Color theme", color_theme_desc: "Choose the app color palette.",
        theme_instagram: "Instagram", theme_pink: "Pink & Purple", theme_blue: "Blue & Purple", theme_gold: "Gold & Black",
        hello: "Hello!", welcome_title: "Welcome to MathMate",
        badge_ready: "Ready to learn?", hero_line1: "Learn math easier", hero_line2: "and more fun!",
        hero_desc: "Practical math tools, calculator and lessons — all in one place.",
        start_btn: "Let's start", tools_section_title: "MathMate Tools", all_tools: "All tools",
        ready_start: "Ready to begin?", pick_tool: "Pick a tool and start!",
        tools_page_title: "MathMate Tools", tools_page_desc: "Choose a tool and get started.",
        about_title: "About MathMate",
        calc: "Calculator", calc_expression_title: "Evaluate an expression or solve an equation", calc_expression_label: "Enter an expression or equation", calc_expression_placeholder: "Example: (2 + 3) × 4", calc_expression_help: "Supports +, −, ×, ÷, power ^, square root √, and linear equations with x.", calc_expression_submit: "Calculate", geometry: "Area & Perimeter", gcd_lcm: "GCD & LCM",
        formula_label: "Formula", area_label: "Area", perimeter_label: "Perimeter", gcd_label: "GCD", lcm_label: "LCM",
        length_label: "Length", width_label: "Width", side_label: "Side length", base_label: "Base", height_label: "Height",
        side1_label: "Side 1", side2_label: "Side 2", radius_label: "Radius", calculate_btn: "Calculate",
        multiples: "Multiples", learning: "Learning", factors: "Factors",
        date_convert: "Date Convert", unit_convert: "Unit Convert", percentage: "Percentage",
        time_convert: "Time Convert",
        anim_on: "On", anim_off: "Off",
        features: "Features", version_about: "About this version",
        footer: "Made with ❤ and JavaScript by Hossein Saghafi",
        desc_calc: "Quick and easy calculations",
        desc_geometry: "Calculate geometric shapes",
        desc_gcd: "Quick number calculations",
        desc_multiples: "Find multiples of a number",
        desc_multiples_short: "Find multiples",
        desc_learning: "Search educational videos",
        desc_learning_short: "Online learning",
        desc_factors: "Find factors of a number",
        desc_factors_short: "Find factors",
        desc_date: "Convert Jalali, Gregorian and Hijri dates",
        desc_unit: "Convert various units",
        desc_percentage: "Calculate a percentage of a number",
        desc_time: "Convert seconds, minutes, hours and days",
        desc_paint: "Calculate wall paint",
        desc_shopping: "Calculate shopping cost",
        desc_discount: "Calculate percent and discount",
        desc_measurement: "Area, perimeter and volume",
        desc_school: "Average, proportion, speed",
        alert_calc_error: "Error",
        alert_calc_both: "Please complete both fields.",
        alert_calc_numbers: "Please enter valid numbers.",
        alert_geometry_rect: "Please enter valid length and width.",
        alert_geometry_square: "Please enter a valid side length.",
        alert_geometry_triangle: "Please enter all dimensions correctly.",
        alert_geometry_circle: "Please enter a valid radius.",
        alert_gcd: "Please enter two positive integers.",
        alert_learning: "Enter an educational topic first.",
        alert_factors: "Please enter a positive integer.",
        alert_date_missing: "Please enter year, month, and day.",
        alert_date_invalid: "The entered date is not valid.",
        alert_unit: "Please enter a valid number.",
        alert_percentage: "Please enter a valid percentage and number.",
        alert_time: "Please enter a valid value.",
        alert_paint: "Please enter a valid wall width and height.",
        alert_shopping: "Please enter valid price and quantity.",
        alert_discount: "Please enter a valid amount and percent.",
        alert_measurement: "Please enter valid length and width.",
        alert_select_image: "Please select an image."
    }
};

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("mathmateLang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    window.dispatchEvent(new Event("mathmate:settings-changed"));
    const dict = i18n[lang] || i18n.fa;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (dict[key] != null) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        if (dict[key] != null) el.textContent = dict[key];
    });

    // Translate every remaining static phrase/placeholder so no Persian UI text
    // is left behind on pages that predate the data-i18n attributes.
    const phraseMap = lang === "en" ? domPhraseFaToEn : domPhraseEnToFa;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script,style,noscript")) continue;
        textNodes.push(node);
    }
    textNodes.forEach((textNode) => {
        const normalized = normalizeUiText(textNode.nodeValue);
        if (!normalized) return;
        const translated = phraseMap.get(normalized);
        if (translated) {
            const leading = (textNode.nodeValue.match(/^\s*/) || [""])[0];
            const trailing = (textNode.nodeValue.match(/\s*$/) || [""])[0];
            textNode.nodeValue = leading + translated + trailing;
        }
    });

    const attrNames = ["placeholder", "title", "aria-label", "alt"];
    document.querySelectorAll("*").forEach((el) => {
        attrNames.forEach((attr) => {
            const value = el.getAttribute(attr);
            if (!value) return;
            const translated = phraseMap.get(normalizeUiText(value));
            if (translated) el.setAttribute(attr, translated);
        });
    });

    const appName = dict.app_name || "MathMate";
    document.title = appName;
    const st = document.getElementById("sidebarAppTitle");
    if (st) st.textContent = appName;
    const animOn = document.getElementById("animOn");
    const animOff = document.getElementById("animOff");
    if (animOn) animOn.textContent = dict.anim_on || "On";
    if (animOff) animOff.textContent = dict.anim_off || "Off";
    const langFaBtn = document.getElementById("langFa");
    const langEnBtn = document.getElementById("langEn");
    if (langFaBtn) langFaBtn.textContent = lang === "en" ? "Persian" : "فارسی";
    if (langEnBtn) langEnBtn.textContent = lang === "en" ? "English" : "انگلیسی";
    langFaBtn?.classList.toggle("active", lang === "fa");
    langEnBtn?.classList.toggle("active", lang === "en");

    // Re-apply labels generated after the initial page load.
    if (typeof updateUnitOptions === "function" && typeof unitFrom !== "undefined" && unitFrom) {
        const fromValue = unitFrom.value;
        const toValue = unitTo?.value;
        updateUnitOptions();
        if ([...unitFrom.options].some((o) => o.value === fromValue)) unitFrom.value = fromValue;
        if (toValue && [...unitTo.options].some((o) => o.value === toValue)) unitTo.value = toValue;
    }
    // Refresh geometry field labels for the active shape
    if (typeof showGeometryInputs === "function" && typeof selectedShape !== "undefined") {
        try { showGeometryInputs(selectedShape); } catch (_) {}
    }
    // Ensure body dir mirrors html for alignment rules
    document.body.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");
    document.body.classList.toggle("lang-en", lang === "en");
    document.body.classList.toggle("lang-fa", lang === "fa");
    // Re-translate formula row labels if visible
    document.querySelectorAll("[data-i18n=\"formula_label\"],[data-i18n=\"area_label\"],[data-i18n=\"perimeter_label\"],[data-i18n=\"gcd_label\"],[data-i18n=\"lcm_label\"]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (dict[key] != null) el.textContent = dict[key];
    });

    if (typeof updateThemeButtonIcon === "function") {
        const theme = document.body.classList.contains("dark") ? "dark" : "light";
        updateThemeButtonIcon(theme);
    }
    try { const name = (localStorage.getItem("mathmateName") || "").slice(0, 50); const nameEl = document.getElementById("welcomeUserName"); if (nameEl) nameEl.textContent = name.trim() ? (lang === "en" ? `, ${name.trim()}!` : `، ${name.trim()}!`) : ""; } catch {}
    // Refresh device labels so OS names follow language
    try {
        const osEl = document.getElementById("osInfo");
        if (osEl && typeof detectOSVersion === "function") {
            const base = detectOSVersion();
            // Prefer English canonical forms then localize
            let label = osEl.dataset.mmOsCanonical || base;
            if (!osEl.dataset.mmOsCanonical && /Windows|Android|macOS|Linux|ChromeOS|ویندوز|اندروید|لینوکس/.test(base)) {
                osEl.dataset.mmOsCanonical = base.replace("ویندوز", "Windows").replace("اندروید", "Android").replace("لینوکس", "Linux");
                label = osEl.dataset.mmOsCanonical;
            }
            if (osEl.dataset.mmOsCanonical) label = osEl.dataset.mmOsCanonical;
            osEl.textContent = lang === "en"
                ? label
                : label.replace(/Windows/g, "ویندوز").replace(/Android/g, "اندروید").replace(/Linux/g, "لینوکس");
        }
    } catch {}
}
applyLanguage(currentLang);
document.getElementById("langFa")?.addEventListener("click", () => applyLanguage("fa"));
document.getElementById("langEn")?.addEventListener("click", () => applyLanguage("en"));

/* Hide architecture on mobile already via CSS; ensure bottom-nav gone */
document.querySelectorAll(".bottom-nav").forEach((n) => (n.style.display = "none"));


function applyColorTheme(theme) {
  const allowedThemes = ["instagram", "pink-purple", "blue-purple", "gold-black"];
  if (!allowedThemes.includes(theme)) theme = "instagram";
  document.body.classList.remove("theme-instagram", "theme-pink-purple", "theme-blue-purple", "theme-gold-black");
  document.body.classList.add("theme-" + theme);
  localStorage.setItem("mathmateColorTheme", theme);
  window.dispatchEvent(new Event("mathmate:settings-changed"));
  document.querySelectorAll(".color-theme-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-color-theme") === theme);
  });
}
var savedColorTheme = ["instagram", "pink-purple", "blue-purple", "gold-black"].includes(localStorage.getItem("mathmateColorTheme")) ? localStorage.getItem("mathmateColorTheme") : "instagram";
applyColorTheme(savedColorTheme);
document.querySelectorAll(".color-theme-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    applyColorTheme(btn.getAttribute("data-color-theme"));
  });
});

function wireTool(id, pageId, nav) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", function () {
    practicalToolReturnTo = "tools";
    if (typeof openPageFromSidebar === "function") {
      // open without resetting return target to home
      hideAllPages();
      document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
      document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
      document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
      document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
      var page = document.getElementById(pageId);
      if (page) page.classList.add("show");
      document.body.classList.remove("games-view");
      document.body.classList.remove("darsyar-view");
      if (typeof setActiveSidebar === "function") setActiveSidebar(nav);
      if (typeof isMobileSidebar === "function" && isMobileSidebar()) closeSidebar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}
wireTool("toolsPaint", "paintPage", "paint");
wireTool("toolsShopping", "shoppingPage", "shopping");
wireTool("toolsDiscount", "discountPage", "discount");
wireTool("toolsMeasurement", "measurementPage", "measurement");
wireTool("toolsSchool", "schoolPage", "school");

// Desktop: start with sidebar open (like Win11 start), user can close with X
if (window.matchMedia("(min-width: 900px)").matches) {
  var sb = document.getElementById("sidebar");
  if (sb) {
    sb.classList.add("open");
    document.body.classList.add("sidebar-open");
    if (sidebarToggle) sidebarToggle.style.display = "none";
  }
}



/* ================= LEARNING CARD WHOLE CLICK ================= */
(function () {
    const learningCardEl = document.querySelector(".learning-card");
    if (learningCardEl && !learningCardEl.dataset.wired) {
        learningCardEl.dataset.wired = "1";
        learningCardEl.style.cursor = "pointer";
        learningCardEl.addEventListener("click", () => {
            currentPage = "tools";
            if (typeof activateToolsNav === "function") activateToolsNav();
            hideAllPages();
            const header = document.querySelector(".header");
            const welcome = document.querySelector(".welcome-card");
            const toolsSec = document.querySelector(".tools-section");
            const learning = document.querySelector(".learning-card");
            if (header) header.style.display = "none";
            if (welcome) welcome.style.display = "none";
            if (toolsSec) toolsSec.style.display = "none";
            if (learning) learning.style.display = "none";
            if (toolsPage) toolsPage.classList.add("show");
            if (typeof setActiveSidebar === "function") setActiveSidebar("tools");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
})();



/* ================= AVATAR SYSTEM (simple, no crop/zoom) ================= */
(function () {
    const avatarPage = document.getElementById("avatarPage");
    const avatarBack = document.getElementById("avatarBack");
    const sidebarAvatarBtn = document.getElementById("sidebarAvatarBtn");
    const sidebarAvatarImg = document.getElementById("sidebarAvatarImg");
    const previewImg = document.getElementById("avatarPreviewImg");
    const fileInput = document.getElementById("avatarFileInput");
    const saveBtn = document.getElementById("avatarSaveBtn");
    const avatarGrid = document.getElementById("avatarGrid");
    const accountNameInput = document.getElementById("accountNameInput");

    let selectedSrc = localStorage.getItem("mathmateAvatar") || "assets/avatars/avatar1.png";
    const storedAccountName = () => { try { return (localStorage.getItem("mathmateName") || "").slice(0, 50); } catch { return ""; } };
    function updateAccountName(name) {
        const clean = String(name || "").trim().slice(0, 50);
        const nameEl = document.getElementById("welcomeUserName");
        if (nameEl) nameEl.textContent = clean ? (currentLang === "en" ? `, ${clean}!` : `، ${clean}!`) : "";
    }
    updateAccountName(storedAccountName());

    function setPreview(src) {
        selectedSrc = src;
        if (previewImg) previewImg.src = src;
        document.querySelectorAll(".avatar-option").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-src") === src);
        });
    }

    function applyAvatarEverywhere(src) {
        if (sidebarAvatarImg) sidebarAvatarImg.src = src;
        const p = document.querySelector(".profile-icon");
        if (p) {
            p.innerHTML = "";
            const im = document.createElement("img");
            im.src = src;
            im.alt = "";
            p.appendChild(im);
        }
    }

    function openAvatarPage() {
        hideAllPages();
        document.querySelector(".header") && (document.querySelector(".header").style.display = "none");
        document.querySelector(".welcome-card") && (document.querySelector(".welcome-card").style.display = "none");
        document.querySelector(".tools-section") && (document.querySelector(".tools-section").style.display = "none");
        document.querySelector(".learning-card") && (document.querySelector(".learning-card").style.display = "none");
        if (avatarPage) avatarPage.classList.add("show");
        if (typeof isMobileSidebar === "function" && isMobileSidebar() && typeof closeSidebar === "function") closeSidebar();
        const saved = localStorage.getItem("mathmateAvatar") || "assets/avatars/avatar1.png";
        if (accountNameInput) accountNameInput.value = storedAccountName();
        setPreview(saved);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (sidebarAvatarBtn) {
        sidebarAvatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openAvatarPage();
        });
    }
    if (avatarBack) {
        avatarBack.addEventListener("click", () => {
            if (avatarPage) avatarPage.classList.remove("show");
            if (typeof goHome === "function") goHome();
        });
    }
    if (avatarGrid) {
        avatarGrid.querySelectorAll(".avatar-option").forEach((btn) => {
            btn.addEventListener("click", () => {
                const src = btn.getAttribute("data-src");
                if (src) setPreview(src);
            });
        });
    }
    if (fileInput) {
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
                void mmAlert(translateKey("alert_select_image"));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(String(reader.result));
            };
            reader.readAsDataURL(file);
            fileInput.value = "";
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (!selectedSrc) {
                void mmAlert((i18n[currentLang] && i18n[currentLang].avatar_fail) || "ذخیره آواتار ممکن نشد.");
                return;
            }
            try {
                localStorage.setItem("mathmateAvatar", selectedSrc);
                const nextName = accountNameInput ? accountNameInput.value.trim().slice(0, 50) : storedAccountName();
                localStorage.setItem("mathmateName", nextName);
                if (accountNameInput) accountNameInput.value = nextName;
                updateAccountName(nextName);
                applyAvatarEverywhere(selectedSrc);
                void mmAlert((i18n[currentLang] && i18n[currentLang].avatar_saved) || "اطلاعات حساب ذخیره شد!");
            } catch (err) {
                // localStorage quota for large dataURLs
                void mmAlert((i18n[currentLang] && i18n[currentLang].avatar_fail) || "ذخیره آواتار ممکن نشد.");
            }
        });
    }

    // Load on startup
    const saved = localStorage.getItem("mathmateAvatar");
    if (saved) applyAvatarEverywhere(saved);
})();

/* ================= MOBILE INSTALL BANNER ================= */
(function () {
    const banner = document.getElementById("mobileInstallBanner");
    const closeBtn = document.getElementById("mibClose");
    if (!banner || !closeBtn) return;

    const mibI18n = {
        fa: {
            title: "همیار ریاضی",
            sub: "همراه همه‌فن‌حریف ریاضی",
            myket: "دانلود از مایکت",
            bazaar: "دانلود از بازار"
        },
        en: {
            title: "MathMate",
            sub: "Your all-in-one math companion",
            myket: "Download from Myket",
            bazaar: "Download from Bazaar"
        }
    };

    function applyMibLang() {
        const lang = (document.documentElement.lang === "en") ? "en" : "fa";
        const t = mibI18n[lang];
        banner.querySelectorAll("[data-i18n-mib]").forEach((el) => {
            const key = el.getAttribute("data-i18n-mib");
            if (t[key]) el.textContent = t[key];
        });
    }

    function isMobileView() {
        return window.matchMedia("(max-width: 899px)").matches;
    }

    function isAndroidDevice() {
        try {
            const ua = navigator.userAgent || navigator.vendor || '';
            return /Android/i.test(ua);
        } catch (_) {
            return false;
        }
    }

    function showBanner() {
        if (!isMobileView() || !isAndroidDevice()) return;
        applyMibLang();
        banner.setAttribute("aria-hidden", "false");
        // force reflow then show
        banner.style.display = "block";
        requestAnimationFrame(() => {
            banner.classList.remove("hiding");
            banner.classList.add("show");
        });
    }

    function hideBanner() {
        banner.classList.add("hiding");
        banner.classList.remove("show");
        banner.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            if (!banner.classList.contains("show")) {
                banner.style.display = "none";
                banner.classList.remove("hiding");
            }
        }, 380);
    }

    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideBanner();
    });

    // Show every visit on mobile (until user closes for this page load)
    function tryShow() {
        if (!isMobileView()) return;
        setTimeout(showBanner, 400);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryShow);
    } else {
        tryShow();
    }

    // Re-apply text when language changes
    const origApply = window.applyLanguage;
    if (typeof applyLanguage === "function") {
        const _apply = applyLanguage;
        window.applyLanguage = function (lang) {
            _apply(lang);
            applyMibLang();
        };
        // also hook existing listeners already bound to applyLanguage - they call the local name
    }
    document.getElementById("langFa")?.addEventListener("click", () => setTimeout(applyMibLang, 50));
    document.getElementById("langEn")?.addEventListener("click", () => setTimeout(applyMibLang, 50));

    window.addEventListener("resize", () => {
        if (!isMobileView()) {
            banner.classList.remove("show", "hiding");
            banner.style.display = "none";
            banner.setAttribute("aria-hidden", "true");
        }
    });
})();

/* ================= SIDEBAR BODY SCROLL LOCK (mobile) ================= */
(function () {
    let lockedScrollY = 0;
    const body = document.body;

    function lockBody() {
        if (!window.matchMedia("(max-width: 899px)").matches) return;
        lockedScrollY = window.scrollY || window.pageYOffset || 0;
        body.style.top = `-${lockedScrollY}px`;
        body.classList.add("sidebar-open");
    }

    function unlockBody() {
        body.style.top = "";
        const y = lockedScrollY;
        // class removal handled by existing closeSidebar; restore scroll
        requestAnimationFrame(() => {
            window.scrollTo(0, y);
        });
    }

    // Patch existing open/close if present
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const closeBtn = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggle) {
        toggle.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 899px)").matches) {
                setTimeout(() => {
                    if (sidebar && sidebar.classList.contains("open")) lockBody();
                }, 0);
            }
        }, true);
    }
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            unlockBody();
        }, true);
    }
    if (overlay) {
        overlay.addEventListener("click", () => {
            unlockBody();
        }, true);
    }

    // Observe class changes on sidebar for open/close from other code paths
    if (sidebar && typeof MutationObserver !== "undefined") {
        const obs = new MutationObserver(() => {
            if (!window.matchMedia("(max-width: 899px)").matches) return;
            if (sidebar.classList.contains("open")) {
                if (!body.style.top) lockBody();
            } else {
                if (body.style.top) {
                    unlockBody();
                    body.classList.remove("sidebar-open");
                }
            }
        });
        obs.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
    }
})();

/* ================= Integrated MathMate games ================= */
(function(){
'use strict';
const gameRoot=document.getElementById('mathmateGamesRoot');
if(!gameRoot)return;
const $=(s,root=gameRoot)=>root.querySelector(s), $$=(s,root=gameRoot)=>Array.from(root.querySelectorAll(s));
const STORE='mathmateArcade_v1';
// The optional AradVF font is loaded through @font-face in style.css when present.
const games=[
 {id:'sudoku',name:'سودوکو',en:'Sudoku',desc:'جدول را کامل کن؛ هر عدد فقط یک‌بار در هر سطر، ستون و مربع.',enDesc:'Fill the grid. Each digit appears once per row, column, and box.',icon:'sudoku',level:'فکری',enLevel:'Logic',cover:'cover-sudoku',kind:'numbers',art:'sudoku',time:'۵–۲۰ دقیقه'},
 {id:'quick',name:'پاسخ سریع',en:'Quick Answer',desc:'سؤال‌های تازه، گزینه‌های متنوع و زمان محدود؛ هر دور یک چالش جدید.',enDesc:'Fresh questions, varied choices, and a timer. Every round is a new challenge.',icon:'quick',level:'سرعتی',enLevel:'Speed',cover:'cover-quick',kind:'timer',art:'quick',time:'۱–۳ دقیقه'},
 {id:'2048',name:'ادغام اعداد',en:'Number Merge',desc:'کاشی‌ها را به چپ، راست، بالا یا پایین بکش و عددهای برابر را ادغام کن.',enDesc:'Swipe or drag the board to merge matching tiles and build larger numbers.',icon:'2048',level:'تمرکزی',enLevel:'Focus',cover:'cover-2048',kind:'puzzle',art:'2048',time:'۳–۱۰ دقیقه'},
 {id:'puzzle',name:'معمای عددی',en:'Number Puzzle',desc:'از میان اعداد و عملگرها، راه رسیدن به عدد هدف را پیدا کن.',enDesc:'Choose numbers and operators to reach the target number.',icon:'puzzle',level:'منطقی',enLevel:'Logic',cover:'cover-puzzle',kind:'logic',art:'puzzle',time:'۲–۵ دقیقه'},
 {id:'missing',name:'عدد گمشده',en:'Missing Number',desc:'الگو را کشف کن و گزینه درست را برای خانه خالی انتخاب کن.',enDesc:'Find the pattern and choose the missing number.',icon:'missing',level:'الگوشناسی',enLevel:'Patterns',cover:'cover-missing',kind:'brain',art:'missing',time:'۲–۵ دقیقه'},
 {id:'memory',name:'حافظه ریاضی',en:'Math Memory',desc:'کارت‌های عبارت و جواب را جفت کن؛ با حرکت کمتر امتیاز بیشتر بگیر.',enDesc:'Match each equation with its answer using as few moves as you can.',icon:'memory',level:'حافظه',enLevel:'Memory',cover:'cover-memory',kind:'memory',art:'memory',time:'۲–۵ دقیقه'}
];
const dictionary={
 fa:{workspace:'فضای بازی',home:'خانه',allGames:'همه بازی‌ها',records:'رکوردهای من',littleSteps:'قدم‌به‌قدم قوی‌تر شو!',promoText:'هر بازی، یک فرصت تازه برای یادگیری است.',help:'راهنما',offlineReady:'آماده بازی آفلاین',offline:'آفلاین',mathmate:'MathMateGames',arcade:'بازی‌های همیار ریاضی',madeForCurious:'ساخته‌شده برای ذهن‌های کنجکاو',localData:'رکوردها فقط روی همین دستگاه ذخیره می‌شوند.',greeting:'سلام، قهرمان ریاضی!',heroTitle:'بازی کن؛ یاد بگیر؛ رکورد بزن.',heroDesc:'یک چالش انتخاب کن و مهارت ریاضی‌ات را با بازی‌های کوتاه، سرگرم‌کننده و مرحله‌ای تقویت کن.',startPlay:'شروع بازی',explore:'دیدن همه بازی‌ها',dailyChallenge:'چالش امروز',dailyText:'فقط یک دور بازی کن و رکوردت را بهتر کن.',gamesForYou:'بازی‌ها برای تو',gamesSubtitle:'از معماهای آرام تا چالش‌های سرعتی؛ انتخاب با توست.',seeAll:'همه بازی‌ها ←',played:'بازی انجام‌شده',bestScore:'بهترین رکورد',totalPoints:'مجموع امتیاز',play:'بازی کن',minutes:'دقیقه',continue:'ادامه بازی',back:'بازگشت',newGame:'بازی جدید',difficulty:'سختی',easy:'آسان',medium:'متوسط',hard:'سخت',expert:'حرفه‌ای',time:'زمان',score:'امتیاز',moves:'حرکت',hint:'راهنمایی',check:'بررسی',erase:'پاک‌کردن',notes:'یادداشت',pause:'توقف',resume:'ادامه',reset:'شروع دوباره',question:'سؤال',level:'مرحله',streak:'پشت‌سرهم',best:'بهترین',again:'یک دور دیگر',homeBtn:'بازگشت به خانه',goodJob:'آفرین!',finish:'پایان بازی',target:'عدد هدف',tryIt:'بررسی جواب',newPuzzle:'معمای تازه',recordsTitle:'رکوردهای من',recordsDesc:'پیشرفت و بهترین نتیجه‌های ذخیره‌شده روی این دستگاه.',helpTitle:'راهنمای بازی‌ها',helpDesc:'قوانین بازی‌ها و روش کنترل را در یک نگاه ببین.',search:'جست‌وجوی بازی…',filterAll:'همه دسته‌ها',noResults:'بازی‌ای پیدا نشد؛ عبارت دیگری را امتحان کن.',loading:'در حال آماده‌سازی…',round:'دور',targetReached:'به عدد هدف رسیدی!',correct:'درست بود!',wrong:'این بار نه؛ دوباره امتحان کن.',started:'بازی شروع شد!',paused:'بازی متوقف شد',win:'پیروز شدی!',gameOver:'بازی تمام شد',accuracy:'دقت',mistakes:'اشتباه',bestRecord:'بهترین رکورد',confirmReset:'بازی از اول شروع شود؟',clearRecords:'پاک‌کردن همه رکوردها',settings:'تنظیمات',noRecords:'هنوز رکوردی ثبت نشده؛ یک بازی انجام بده!',rules:'قوانین',controls:'کنترل‌ها',localSave:'ذخیره‌سازی محلی',language:'زبان',appearance:'ظاهر',light:'روشن',dark:'تاریک',pressKeys:'از کلیدهای صفحه‌کلید استفاده کن.',chooseGame:'یک بازی را برای شروع انتخاب کن.'},
 en:{workspace:'PLAY SPACE',home:'Home',allGames:'All games',records:'My records',littleSteps:'Get better, one step at a time!',promoText:'Every game is a new chance to learn.',help:'Help',offlineReady:'Offline ready',offline:'Offline',mathmate:'MathMateGames',arcade:'MathMate Games',madeForCurious:'Made for curious minds',localData:'Scores are saved on this device only.',greeting:'Hello, math champion!',heroTitle:'Play. Learn. Beat your best.',heroDesc:'Choose a challenge and sharpen your math skills with short, fun games that level up with you.',startPlay:'Start playing',explore:'Explore games',dailyChallenge:'Today’s challenge',dailyText:'Play one round and try to beat your best.',gamesForYou:'Games for you',gamesSubtitle:'From thoughtful puzzles to fast challenges — you choose.',seeAll:'All games →',played:'Games played',bestScore:'Best score',totalPoints:'Total points',play:'Play',minutes:'min',continue:'Continue',back:'Back',newGame:'New game',difficulty:'Difficulty',easy:'Easy',medium:'Medium',hard:'Hard',expert:'Expert',time:'Time',score:'Score',moves:'Moves',hint:'Hint',check:'Check',erase:'Erase',notes:'Notes',pause:'Pause',resume:'Resume',reset:'Restart',question:'Question',level:'Level',streak:'Streak',best:'Best',again:'Play again',homeBtn:'Back home',goodJob:'Well done!',finish:'Game over',target:'Target',tryIt:'Check answer',newPuzzle:'New puzzle',recordsTitle:'My records',recordsDesc:'Your progress and best scores saved on this device.',helpTitle:'Game guide',helpDesc:'Rules and controls, all in one place.',search:'Search games…',filterAll:'All categories',noResults:'No games found. Try another search.',loading:'Getting ready…',round:'Round',targetReached:'Target reached!',correct:'Correct!',wrong:'Not quite — try again.',started:'Game started!',paused:'Game paused',win:'You won!',gameOver:'Game over',accuracy:'Accuracy',mistakes:'Mistakes',bestRecord:'Best record',confirmReset:'Restart this game?',clearRecords:'Clear all records',settings:'Settings',noRecords:'No records yet. Play a game to get started!',rules:'Rules',controls:'Controls',localSave:'Local storage',language:'Language',appearance:'Appearance',light:'Light',dark:'Dark',pressKeys:'Use your keyboard controls.',chooseGame:'Choose a game to begin.'}
};
function safeGetLocal(key,fallback){try{return localStorage.getItem(key)||fallback;}catch(e){return fallback;}}
function safeSetLocal(key,value){try{localStorage.setItem(key,value);}catch(e){/* Storage can be unavailable in private or file contexts; the game still runs. */}}
let lang=safeGetLocal('mmArcadeLang','fa')==='en'?'en':'fa';let theme=safeGetLocal('mmArcadeTheme','light')==='dark'?'dark':'light';
let stats=loadStats();for(const key of Object.keys(stats.best||{}))if(!games.some(g=>g.id===key))delete stats.best[key];for(const key of Object.keys(stats.games||{}))if(!games.some(g=>g.id===key))delete stats.games[key];if(Array.isArray(stats.recent))stats.recent=stats.recent.filter(x=>games.some(g=>g.id===x.id));let currentView='home';let activeGame=null;let activeCleanup=null;let toastTimer=null;
function loadStats(){
 const empty={played:0,points:0,best:{},games:{},recent:[]};
 try{
  const raw=localStorage.getItem(STORE); if(!raw) return empty;
  const parsed=JSON.parse(raw); if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) return empty;
  const best=parsed.best&&typeof parsed.best==='object'&&!Array.isArray(parsed.best)?parsed.best:{};
  const gameStats=parsed.games&&typeof parsed.games==='object'&&!Array.isArray(parsed.games)?parsed.games:{};
  const recent=Array.isArray(parsed.recent)?parsed.recent.filter(x=>x&&typeof x==='object'&&games.some(g=>g.id===x.id)).slice(0,40):[];
  const played=Math.max(0,Math.floor(Number(parsed.played)||0));
  const points=Math.max(0,Math.floor(Number(parsed.points)||0));
  // Preserve previously saved totals and records, including valid imported/legacy stats.
  const cleanBest={}; for(const [id,value] of Object.entries(best)){if(games.some(g=>g.id===id)&&Number.isFinite(Number(value))&&Number(value)>=0)cleanBest[id]=Math.floor(Number(value));}
  const cleanGames={}; for(const [id,value] of Object.entries(gameStats)){if(games.some(g=>g.id===id)&&value&&typeof value==='object')cleanGames[id]={plays:Math.max(0,Math.floor(Number(value.plays)||0)),score:Math.max(0,Math.floor(Number(value.score)||0))};}
  return {played,points,best:cleanBest,games:cleanGames,recent};
 }catch(e){return empty;}
}
function saveStats(){safeSetLocal(STORE,JSON.stringify(stats));}
function t(key){return (dictionary[lang]||dictionary.fa)[key]||dictionary.fa[key]||key;}
function gameById(id){return games.find(g=>g.id===id);}
function fmt(n){return new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(n);}
function syncHostSettings(){
 const nextTheme=document.body.classList.contains('dark')?'dark':'light';
 const match=document.body.className.match(/(?:^|\s)(theme-instagram|theme-pink-purple|theme-blue-purple|theme-gold-black)(?:\s|$)/);
 const nextColor=(match&&match[1]||'theme-instagram').replace('theme-','');
 const fs=['small','normal','large'].includes(safeGetLocal('mathmateFontSize','normal'))?safeGetLocal('mathmateFontSize','normal'):'normal';
 const nextLang=document.documentElement.lang==='en'?'en':'fa';
 const wasInitialized=gameRoot.dataset.fontSize!=null;
 const changed=theme!==nextTheme||lang!==nextLang||gameRoot.dataset.colorTheme!==nextColor||gameRoot.dataset.fontSize!==fs;
 theme=nextTheme;lang=nextLang;gameRoot.classList.toggle('dark',theme==='dark');gameRoot.classList.toggle('no-animations',document.body.classList.contains('no-animations'));
 gameRoot.dataset.colorTheme=nextColor;gameRoot.dataset.fontSize=fs;gameRoot.dataset.language=nextLang;gameRoot.dir=nextLang==='en'?'ltr':'rtl';
 if(changed&&wasInitialized&&typeof currentView!=='undefined'&&currentView){renderView(currentView,activeGame);renderShell();}
}
function setTheme(){syncHostSettings();}
window.addEventListener('mathmate:settings-changed',()=>{syncHostSettings();});
function setLanguage(next){lang=next;renderView(currentView,activeGame);renderShell();}
function applyI18n(){ $$('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(t(key))el.textContent=t(key);}); }
function renderShell(){applyI18n();const crumb=$('#crumbCurrent');if(crumb)crumb.textContent=currentView==='home'?t('home'):currentView==='catalog'?t('allGames'):currentView==='records'?t('records'):currentView==='help'?t('help'):((gameById(activeGame)||{}).name||(lang==='fa'?'بازی':'Game'));const languageButton=$('#languageToggle');if(languageButton)languageButton.textContent=lang==='fa'?'FA':'EN';const menuButton=$('#mobileMenu');if(menuButton)menuButton.setAttribute('aria-label',lang==='fa'?'باز کردن منو':'Open menu');$$('.nav-item').forEach(b=>b.classList.toggle('active',(currentView==='home'&&b.dataset.action==='home')||(currentView==='catalog'&&b.dataset.action==='catalog')||(currentView==='records'&&b.dataset.action==='records')));syncHostSettings();}
function toast(message,type=''){const region=$('#toastRegion');const el=document.createElement('div');el.className='toast '+type;el.textContent=message;region.appendChild(el);setTimeout(()=>{el.remove();},2600);}
function bestFor(id){return Number((stats.best||{})[id]||0);}
function completeGame(id,score,extra={}){const old=bestFor(id);stats.played=(stats.played||0)+1;stats.points=(stats.points||0)+Math.max(0,Math.round(score));stats.best=stats.best||{};stats.best[id]=Math.max(old,Math.round(score));stats.games=stats.games||{};stats.games[id]=stats.games[id]||{plays:0,score:0};stats.games[id].plays++;stats.games[id].score=Math.max(stats.games[id].score||0,Math.round(score));stats.recent=stats.recent||[];stats.recent.unshift({id,score:Math.round(score),date:new Date().toISOString(),...extra});stats.recent=stats.recent.slice(0,40);saveStats();}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function resolveSiteAsset(rel){try{return new URL(String(rel||'').replace(/^\//,''), document.baseURI||window.location.href).href;}catch(_){return rel;}}
function iconSvg(name, cls=''){if(name==='2048')return `<img class="custom-icon ${cls} game-icon-2048" src="${resolveSiteAsset('assets/icons/2048.svg')}" alt="" aria-hidden="true">`;if(name==='puzzle')return `<img class="custom-icon ${cls} game-icon-puzzle" src="${resolveSiteAsset('assets/icons/question-mark.svg')}" alt="" aria-hidden="true">`;if(name==='memory')return `<img class="custom-icon ${cls} game-icon-memory" src="${resolveSiteAsset('assets/icons/brain.svg')}" alt="" aria-hidden="true">`;if(name==='missing')return `<img class="custom-icon ${cls} game-icon-missing" src="${resolveSiteAsset('assets/icons/lost-number.svg')}" data-fallback-src="${resolveSiteAsset('assets/icons/number-123.svg')}" alt="" aria-hidden="true">`;const paths={
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 sudoku:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>',
 quick:'<path d="M13 2 5 13h6l-1 9 9-12h-6z"/>',
 '2048':'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M7 5.5v3M5.5 7h3M15.5 15.5h3"/>',
 puzzle:'<path d="M8 3h3a2 2 0 1 1 4 0h3v6a2 2 0 1 1 0 4v3h-6a2 2 0 1 0-4 0v-3H5v-3a2 2 0 1 1 0-4h3z"/>',
 missing:'<path d="M4 5h16M4 12h5m6 0h5M4 19h16"/><circle cx="12" cy="12" r="2.2"/>',
 memory:'<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/><path d="M6 8h2M16 8h2"/>',
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>',
 catalog:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 records:'<path d="M5 4h14v17l-7-4-7 4z"/><path d="M8 8h8M8 11h8"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.6 1.7c-1.2 1.1-2.1 1.4-2.1 3M12 17.5v.1"/>',
 moon:'<path d="M20.5 14.3A8.8 8.8 0 0 1 9.7 3.5 9 9 0 1 0 20.5 14.3Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/>',
 coin:'<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.6-.8-1.5-1.2-3-1.2-1.6 0-2.7.8-2.7 2s.9 1.8 2.7 2.1 2.7.9 2.7 2.1-1.1 2.1-2.8 2.1c-1.4 0-2.5-.5-3.2-1.5M12 5.5v13"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.3-3"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 play:'<path d="m8 5 11 7-11 7z"/>',
 star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 chevronDown:'<path d="m6 9 6 6 6-6"/>' ,
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 x:'<path d="m6 6 12 12M18 6 6 18"/>',
 pencil:'<path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4z"/><path d="m14.8 5.7 3.5 3.5"/>',
 erase:'<path d="m4 12 7-7h8l2 2v7l-7 7H6z"/><path d="m9 10 6 6m0-6-6 6"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
 sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
};return `<svg class="custom-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.star}</svg>`;}
const HISTORY_KEY='mmArcadeHistory_v2';
function readHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')}catch{return {};}}
function hasSeen(scope,key){return (readHistory()[scope]||[]).includes(String(key));}
function rememberSeen(scope,key,max=600){const h=readHistory();h[scope]=h[scope]||[];const k=String(key);if(!h[scope].includes(k))h[scope].push(k);if(h[scope].length>max)h[scope]=h[scope].slice(-max);safeSetLocal(HISTORY_KEY,JSON.stringify(h));}
function uniqueGenerated(scope,factory,keyer,maxAttempts=120){for(let i=0;i<maxAttempts;i++){const value=factory(),key=String(keyer(value));if(!hasSeen(scope,key)){rememberSeen(scope,key);return value;}}const value=factory();rememberSeen(scope,`${keyer(value)}|${Date.now()}|${Math.random()}`);return value;}

function artMarkup(art){switch(art){case'sudoku':return `<div class="art-sudoku">${['3','','8','', '7','','2','','','6','','4','','1','','','','','8','','','','5','','','','9','','','','','1','','','6','','2','','','','','7','','','','5','','8','','',''].slice(0,9).map(x=>`<span>${x}</span>`).join('')}</div>`;case'quick':return `<div class="art-quick"><div class="art-equation">8 × 7 = ?</div><div class="art-options"><span>48</span><span>56</span><span>64</span></div></div>`;case'2048':return `<div class="art-2048"><span>2</span><span>4</span><span>8</span><span>16</span></div>`;case'puzzle':return `<div class="art-puzzle"><span>7</span><span>×</span><span>6</span><span>42</span></div>`;case'missing':return `<div class="art-missing"><span>2</span><span>4</span><span>8</span><span>?</span></div>`;default:return `<div class="art-memory"><span>×</span><span>12</span><span>?</span></div>`;}}
function renderCard(g){const played=(stats.games||{})[g.id]?.plays||0;return `<article class="game-card" data-game-card="${g.id}"><div class="game-cover ${g.cover}"><span class="cover-tag">${lang==='fa'?g.level:g.enLevel}</span>${artMarkup(g.art)}</div><h3>${lang==='fa'?g.name:g.en}</h3><p>${lang==='fa'?g.desc:g.enDesc}</p><div class="game-card-footer"><span class="game-meta">${iconSvg('clock')} ${lang==='fa'?g.time:g.time.replace('دقیقه','min')} <b>·</b> ${fmt(played)} ${lang==='fa'?'بار':'plays'}</span><button class="play-button" data-play="${g.id}">${t('play')} ${iconSvg('arrow')}</button></div></article>`;}
function heroMarkup(){return `<section class="hero"><div class="hero-main"><div class="eyebrow"><span></span> MathMateGames · بازی‌های همیار ریاضی</div><h1>${t('heroTitle')}</h1><p>${t('heroDesc')}</p><div class="hero-buttons"><button class="button button-primary" data-play="quick">${t('startPlay')} ${iconSvg('arrow')}</button></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orb"></div><div class="cube">∑</div><div class="planet">${iconSvg('star')}</div><div class="tiny-star">${iconSvg('coin')}</div></div></div><div class="stat-stack"><div class="stat-card"><div class="stat-icon violet">${iconSvg('records')}</div><div class="stat-copy"><span>${t('played')}</span><strong>${fmt(stats.played||0)}</strong><small>${lang==='fa'?'همه بازی‌ها':'Across all games'}</small></div></div><div class="stat-card"><div class="stat-icon mint">${iconSvg('coin')}</div><div class="stat-copy"><span>${t('totalPoints')}</span><strong>${fmt(stats.points||0)}</strong><small>${lang==='fa'?'امتیاز جمع‌شده':'Points collected'}</small></div></div><div class="stat-card"><div class="stat-icon gold">${iconSvg('star')}</div><div class="stat-copy"><span>${t('bestScore')}</span><strong>${fmt(Math.max(0,...Object.values(stats.best||{}).map(Number)))}</strong><small>${lang==='fa'?'بهترین نتیجه ثبت‌شده':'Personal best'}</small></div></div></div></section>`;}
function renderHome(){return `${heroMarkup()}<section><div class="section-heading"><div><h2>${t('gamesForYou')}</h2><p>${t('gamesSubtitle')}</p></div></div><div class="game-grid">${games.map(renderCard).join('')}</div></section><section class="quick-strip"><div class="strip-card"><div class="strip-icon">${iconSvg('target')}</div><div class="strip-copy"><strong>${t('dailyChallenge')}</strong><span>${t('dailyText')}</span></div><button class="button button-soft button-small" data-play="quick">${t('play')}</button></div><div class="strip-card"><div class="strip-icon">${iconSvg('trophy')}</div><div class="strip-copy"><strong>${t('recordsTitle')}</strong><span>${lang==='fa'?'رکوردهای هر بازی را مقایسه کن.':'Compare your best in every game.'}</span></div><div class="strip-value">${fmt(stats.played||0)}</div></div></section>`;}
function renderCatalog(){return `<div class="view-head"><div class="view-title"><div class="big-icon">${iconSvg('catalog')}</div><div><h1>${t('allGames')}</h1><p>${t('gamesSubtitle')}</p></div></div><span class="difficulty-chip">${iconSvg('star')}  ${fmt(games.length)} ${lang==='fa'?'بازی':'games'}</span></div><div class="filters-row"><label class="search-field"><span class="search-symbol">${iconSvg('search')}</span><input id="gameSearch" type="search" placeholder="${t('search')}" aria-label="${t('search')}"></label><select id="gameFilter" class="select-control" aria-label="${t('filterAll')}"><option value="all">${t('filterAll')}</option><option value="numbers">${lang==='fa'?'اعداد و محاسبات':'Numbers'}</option><option value="timer">${lang==='fa'?'سرعتی':'Speed'}</option><option value="puzzle">${lang==='fa'?'پازل':'Puzzle'}</option><option value="logic">${lang==='fa'?'منطقی':'Logic'}</option><option value="brain">${lang==='fa'?'الگوها':'Patterns'}</option><option value="memory">${lang==='fa'?'حافظه':'Memory'}</option></select></div><div class="game-grid" id="catalogGrid">${games.map(renderCard).join('')}</div>`;}
function renderRecords(){const played=stats.played||0,points=stats.points||0,best=Math.max(0,...Object.values(stats.best||{}).map(Number));const rows=games.map(g=>{const r=(stats.games||{})[g.id]||{plays:0,score:0};return `<tr><td><div class="record-game"><span class="record-game-icon">${iconSvg(g.icon)}</span>${lang==='fa'?g.name:g.en}</div></td><td>${fmt(r.plays||0)}</td><td><strong>${fmt(bestFor(g.id))}</strong></td><td>${fmt(r.score||0)}</td></tr>`}).join('');return `<div class="view-head"><div class="view-title"><div class="big-icon">${iconSvg('records')}</div><div><h1>${t('recordsTitle')}</h1><p>${t('recordsDesc')}</p></div></div><button class="button button-secondary button-small" id="clearRecords">${iconSvg('trash')} ${t('clearRecords')}</button></div><div class="records-overview"><div class="record-highlight"><span>${t('played')}</span><strong>${fmt(played)}</strong></div><div class="record-highlight"><span>${t('totalPoints')}</span><strong>${fmt(points)}</strong></div><div class="record-highlight"><span>${t('bestScore')}</span><strong>${fmt(best)}</strong></div></div><div class="records-card" style="padding:0;overflow:auto"><table class="record-table"><thead><tr><th>${lang==='fa'?'بازی':'Game'}</th><th>${lang==='fa'?'دفعات':'Plays'}</th><th>${t('best')}</th><th>${t('score')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;}
function renderHelp(){return `<div class="view-head"><div class="view-title"><div class="big-icon">${iconSvg('help')}</div><div><h1>${t('helpTitle')}</h1><p>${t('helpDesc')}</p></div></div></div><div class="help-grid"><div class="help-card"><h3>${iconSvg('sudoku')} ${lang==='fa'?'سودوکو':'Sudoku'}</h3><p>${lang==='fa'?'خانه‌ای را انتخاب کن و با اعداد ۱ تا ۹ آن را پر کن. هر عدد باید در هر سطر، ستون و مربع ۳×۳ فقط یک‌بار باشد. با انتخاب خانهٔ خالی، عدد مناسب را وارد کن؛ برای پاک‌کردن از Backspace استفاده کن.':'Select a cell and fill digits 1–9. Each digit must appear once in each row, column and 3×3 box. Number keys and Backspace are supported.'}</p></div><div class="help-card"><h3>${iconSvg('quick')} ${lang==='fa'?'پاسخ سریع':'Quick Answer'}</h3><p>${lang==='fa'?'هر دور سؤال‌ها و گزینه‌ها به‌شکل تصادفی تولید می‌شوند. گزینه‌ها را کلیک کن یا با کلیدهای ۱ تا ۴ انتخاب کن. با پاسخ درست امتیاز می‌گیری و سختی به‌تدریج افزایش می‌یابد.':'Each round generates randomized questions and options. Click an answer or press 1–4. Correct answers earn points and the difficulty gradually rises.'}</p></div><div class="help-card"><h3>${iconSvg('2048')} ${lang==='fa'?'ادغام اعداد':'Number Merge'}</h3><p>${lang==='fa'?'صفحه را به چپ، راست، بالا یا پایین بکش؛ کاشی‌های هم‌عدد با هم ادغام می‌شوند.':'Swipe or drag the board in any direction to merge matching tiles.'}</p></div><div class="help-card"><h3>${iconSvg('puzzle')} ${lang==='fa'?'معمای عددی':'Number Puzzle'}</h3><p>${lang==='fa'?'دو عدد و یک عملگر انتخاب کن تا حاصل دقیقاً برابر عدد هدف شود. هر معما با اعداد تازه ساخته می‌شود.':'Pick two numbers and an operator to match the target. Every puzzle is generated with fresh numbers.'}</p></div><div class="help-card"><h3>${iconSvg('missing')} ${lang==='fa'?'عدد گمشده':'Missing Number'}</h3><p>${lang==='fa'?'الگوی دنباله را کشف و یکی از چهار گزینه را انتخاب کن. الگوهایی مثل جمع ثابت، ضرب، مربع‌ها و فیبوناچی به کار می‌روند.':'Find the sequence pattern and select one of four answers. Patterns include addition, multiplication, squares and Fibonacci.'}</p></div><div class="help-card"><h3>${iconSvg('memory')} ${lang==='fa'?'حافظه ریاضی':'Math Memory'}</h3><p>${lang==='fa'?'کارت‌ها را دو تا دو تا برگردان و هر عبارت را با جوابش جفت کن. تعداد حرکت‌ها کمتر باشد، بهتر است.':'Flip two cards at a time and match equations to their answers. Fewer moves are better.'}</p></div><div class="help-card"><h3>${iconSvg('records')} ${t('localSave')}</h3><p>${lang==='fa'?'این نسخه برای آزمایش مستقل ساخته شده و آفلاین اجرا می‌شود. رکوردها در فضای ذخیره‌سازی همین مرورگر می‌مانند؛ پاک‌کردن داده‌های مرورگر می‌تواند آن‌ها را حذف کند.':'This independent preview runs offline. Scores stay in this browser’s local storage; clearing browser data may erase them.'}</p></div></div>`;}
function baseView(g){return `<div class="view-head"><div class="view-title"><div class="big-icon" style="background:${g.id==='quick'?'#e6faf3':g.id==='sudoku'?'#ededff':'var(--primary-soft)'}">${iconSvg(g.icon)}</div><div><h1>${lang==='fa'?g.name:g.en}</h1><p>${lang==='fa'?g.desc:g.enDesc}</p></div></div><button class="back-button" data-action="home">${lang==='fa'?'→':'←'} ${t('back')}</button></div>`;}
function stopCurrent(){if(typeof activeCleanup==='function'){try{activeCleanup();}catch(e){console.warn(e)}}activeCleanup=null;}
function closeCustomSelects(except=null){$$('.select-control-wrap.is-open').forEach(w=>{if(w!==except){w.classList.remove('is-open');const b=$('.select-control-trigger',w);if(b)b.setAttribute('aria-expanded','false');}});}
function enhanceSelects(root=gameRoot){$$('select:not([data-enhanced])',root).forEach((select,index)=>{if(select.closest('.select-control-wrap'))return;const wrap=document.createElement('div');wrap.className='select-control-wrap';select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.dataset.enhanced='true';select.classList.add('select-native-hidden');select.setAttribute('aria-hidden','true');select.tabIndex=-1;const label=select.closest('label');const labelText=label?Array.from(label.childNodes).filter(n=>n!==wrap&&n!==select).map(n=>n.textContent||'').join(' ').trim():'';const trigger=document.createElement('button');trigger.type='button';trigger.className='select-control select-control-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',select.getAttribute('aria-label')||labelText||select.options[select.selectedIndex]?.textContent||'Select an option');const menu=document.createElement('div');menu.className='select-control-menu';menu.id='select-menu-'+Math.random().toString(36).slice(2,9);menu.setAttribute('role','listbox');menu.setAttribute('aria-label',trigger.getAttribute('aria-label'));trigger.setAttribute('aria-controls',menu.id);const value=document.createElement('span');value.className='select-control-value';trigger.appendChild(value);const chevron=document.createElement('span');chevron.className='select-control-chevron';chevron.innerHTML=iconSvg('chevronDown');trigger.appendChild(chevron);function sync(){const option=select.options[select.selectedIndex];value.textContent=option?option.textContent:'';menu.querySelectorAll('[role=option]').forEach(b=>{const selected=b.dataset.value===select.value;b.setAttribute('aria-selected',String(selected));b.classList.toggle('is-selected',selected);});}Array.from(select.options).forEach(option=>{const item=document.createElement('button');item.type='button';item.className='select-control-option';item.setAttribute('role','option');item.dataset.value=option.value;item.textContent=option.textContent;item.disabled=option.disabled;item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();wrap.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});});menu.appendChild(item);});wrap.appendChild(trigger);wrap.appendChild(menu);select.addEventListener('change',sync);function open(){closeCustomSelects(wrap);wrap.classList.add('is-open');trigger.setAttribute('aria-expanded','true');}function close(returnFocus=false){wrap.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');if(returnFocus)trigger.focus({preventScroll:true});}trigger.addEventListener('click',()=>{if(wrap.classList.contains('is-open'))close();else open();});wrap.addEventListener('keydown',e=>{const options=Array.from(menu.querySelectorAll('[role=option]:not(:disabled)'));if(!options.length)return;if(e.key==='Escape'){e.preventDefault();close(true);return;}if(e.key==='Tab'){close();return;}if(e.target===trigger&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();open();const idx=options.findIndex(b=>b.dataset.value===select.value);options[Math.max(0,idx)].focus();return;}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&options.includes(e.target)){e.preventDefault();let i=options.indexOf(e.target);if(e.key==='ArrowDown')i=(i+1)%options.length;else if(e.key==='ArrowUp')i=(i-1+options.length)%options.length;else if(e.key==='Home')i=0;else i=options.length-1;options[i].focus();}});sync();});}
function renderView(view,gameId){stopCurrent();currentView=view;activeGame=gameId||null;let html='';if(view==='home')html=renderHome();else if(view==='catalog')html=renderCatalog();else if(view==='records')html=renderRecords();else if(view==='help')html=renderHelp();else{const g=gameById(gameId);if(!g){currentView='home';html=renderHome();}else{html=baseView(g)+`<div id="gameMount"></div>`;}}
$('#content').innerHTML=html;renderShell();wireView();if(gameId&&['sudoku','quick','2048','puzzle','missing','memory'].includes(gameId)){launchGame(gameId);}enhanceSelects($('#content'));$('#content').focus({preventScroll:true});}
/* Site-wide custom selects (glass + animated, same UX as Darsyar priority) */
(function wireSiteSelects(){
  function closeAll(except){
    document.querySelectorAll('.select-control-wrap.is-open').forEach(w => {
      if (w === except) return;
      w.classList.remove('is-open');
      const t = w.querySelector('.select-control-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  function enhanceOne(select){
    if (!select || select.dataset.enhanced === 'true' || select.closest('.select-control-wrap') || select.closest('.ds-priority-wrap')) return;
    if (select.options.length === 0) return;
    const wrap = document.createElement('div');
    wrap.className = 'select-control-wrap';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.dataset.enhanced = 'true';
    select.classList.add('select-native-hidden');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-control select-control-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const value = document.createElement('span');
    value.className = 'select-control-value';
    trigger.appendChild(value);
    const chevron = document.createElement('span');
    chevron.className = 'select-control-chevron';
    chevron.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    trigger.appendChild(chevron);
    const menu = document.createElement('div');
    menu.className = 'select-control-menu';
    menu.setAttribute('role', 'listbox');
    function sync(){
      const option = select.options[select.selectedIndex];
      value.textContent = option ? option.textContent : '';
      menu.querySelectorAll('[role=option]').forEach(b => {
        const on = b.dataset.value === select.value;
        b.setAttribute('aria-selected', String(on));
        b.classList.toggle('is-selected', on);
      });
    }
    function rebuildMenu(){
      menu.innerHTML = '';
      Array.from(select.options).forEach(option => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'select-control-option';
        item.setAttribute('role', 'option');
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        item.disabled = option.disabled;
        item.addEventListener('click', () => {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          wrap.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        });
        menu.appendChild(item);
      });
      sync();
    }
    rebuildMenu();
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    select.addEventListener('change', sync);
    trigger.addEventListener('click', () => {
      if (wrap.classList.contains('is-open')) {
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        closeAll(wrap);
        rebuildMenu();
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
    select.__mmRebuildCustomMenu = rebuildMenu;
  }
  function enhanceAll(){
    document.querySelectorAll('select').forEach(enhanceOne);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAll, { once: true });
  else enhanceAll();
  setTimeout(enhanceAll, 500);
  window.addEventListener('mathmate:settings-changed', () => setTimeout(enhanceAll, 100));
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.select-control-wrap')) closeAll();
  }, true);
  window.__mmEnhanceSiteSelects = enhanceAll;
})();

function wireView(){ $$('[data-play]',$('#content')).forEach(b=>b.addEventListener('click',()=>renderView('game',b.dataset.play)));$$('[data-action]',$('#content')).forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.action;if(action==='home')renderView('home');else if(action==='catalog')renderView('catalog');else if(action==='records')renderView('records');else if(action==='help')renderView('help');}));const sb=$('#gameSearch'),filter=$('#gameFilter');if(sb){const perform=()=>{const q=sb.value.toLowerCase().trim(),cat=filter.value;let visible=0;$$('[data-game-card]',$('#catalogGrid')).forEach(card=>{const g=gameById(card.dataset.gameCard);const txt=[g.name,g.en,g.desc,g.enDesc].join(' ').toLowerCase();const ok=(!q||txt.includes(q))&&(cat==='all'||g.kind===cat);card.style.display=ok?'':'none';if(ok)visible++;});let empty=$('#catalogEmpty');if(!visible){if(!empty){empty=document.createElement('div');empty.id='catalogEmpty';empty.className='empty-state';empty.textContent=t('noResults');$('#catalogGrid').after(empty);}}else if(empty)empty.remove();};sb.addEventListener('input',perform);filter.addEventListener('change',perform);}
const clear=$('#clearRecords');if(clear)clear.addEventListener('click',()=>{mmConfirm(lang==='fa'?'همه رکوردها پاک شوند؟':'Clear all records?').then(ok=>{if(!ok)return;stats={played:0,points:0,best:{},games:{},recent:[]};saveStats();renderView('records');toast(lang==='fa'?'رکوردها پاک شدند.':'Records cleared.');});});}
function launchGame(id){switch(id){case'sudoku':startSudoku();break;case'quick':startQuick();break;case'2048':start2048();break;case'puzzle':startNumberPuzzle();break;case'missing':startMissing();break;case'memory':startMemory();break;}}

// SUDOKU
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sudokuSafe(board,r,c,n){for(let i=0;i<9;i++){if(board[r*9+i]===n||board[i*9+c]===n)return false;}const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(board[(br+y)*9+bc+x]===n)return false;return true;}
function fillSudoku(board,pos=0){if(pos>=81)return true;const r=Math.floor(pos/9),c=pos%9;if(board[pos])return fillSudoku(board,pos+1);const nums=shuffle([1,2,3,4,5,6,7,8,9]);for(const n of nums){if(sudokuSafe(board,r,c,n)){board[pos]=n;if(fillSudoku(board,pos+1))return true;board[pos]=0;}}return false;}
function countSudokuSolutions(board,limit=2){let count=0;function solve(){if(count>=limit)return;let best=-1,cands=null;for(let p=0;p<81;p++){if(!board[p]){const r=Math.floor(p/9),c=p%9,ns=[];for(let n=1;n<=9;n++)if(sudokuSafe(board,r,c,n))ns.push(n);if(ns.length===0)return;if(best<0||ns.length<cands.length){best=p;cands=ns;if(ns.length===1)break;}}}if(best<0){count++;return;}for(const n of cands){board[best]=n;solve();board[best]=0;if(count>=limit)return;}}solve();return count;}
function createSudoku(difficulty){return uniqueGenerated('sudoku:'+difficulty,()=>{const full=Array(81).fill(0);fillSudoku(full);const puzzle=full.slice();const target={easy:34,medium:43,hard:51,expert:56}[difficulty]||43;let blanks=0;for(const p of shuffle(Array.from({length:81},(_,i)=>i))){if(blanks>=target)break;const old=puzzle[p];puzzle[p]=0;if(countSudokuSolutions(puzzle.slice(),2)===1)blanks++;else puzzle[p]=old;}return {solution:full,initial:puzzle,board:puzzle.slice(),notes:Array.from({length:81},()=>new Set()),selected:-1,notesMode:false,mistakes:0,hints:0,difficulty,start:Date.now(),done:false,message:''};},x=>x.initial.join(''),20); }
let sudoku=null,sudokuClock=null;
function startSudoku(){const mount=$('#gameMount');mount.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><div class="toolbar-group"><label class="game-status"><span class="difficulty-chip">${t('difficulty')}</span><select class="select-control" id="sudokuDifficulty"><option value="easy">${t('easy')}</option><option value="medium" selected>${t('medium')}</option><option value="hard">${t('hard')}</option><option value="expert">${t('expert')}</option></select></label></div></div><div class="sudoku-wrap"><div class="sudoku-grid" id="sudokuGrid" role="grid" aria-label="Sudoku grid"></div><div class="sudoku-pad" id="sudokuPad"></div><div class="sudoku-actions"><button class="button button-secondary button-small" id="sudokuErase"><img class="sudoku-backspace-icon" src="assets/icons/backspace.svg" alt="" aria-hidden="true"> ${t('erase')}</button><button class="button button-soft button-small" id="sudokuHint">${iconSvg('sparkles')} ${t('hint')}</button><button class="button button-primary button-small" id="sudokuCheck">${iconSvg('check')} ${t('check')}</button><button class="button button-secondary button-small" id="sudokuNew">${iconSvg('refresh')} ${t('newGame')}</button></div><div class="inline-message" id="sudokuMessage">${lang==='fa'?'یک خانه را انتخاب کن و عدد مناسب را وارد کن.':'Select a cell and enter a digit.'}</div></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'چطور بازی کنیم؟':'How to play'}</h3><div class="info-row"><span>${lang==='fa'?'خانه‌های خالی':'Empty cells'}</span><strong id="sudokuEmpty">—</strong></div><div class="info-row"><span>${t('mistakes')}</span><strong id="sudokuMistakes2">0</strong></div><div class="info-row"><span>${t('hint')}</span><strong id="sudokuHints">0</strong></div><div class="hint-box">${lang==='fa'?'در هر سطر، ستون و مربع ۳×۳ باید اعداد ۱ تا ۹ بدون تکرار قرار بگیرند. برای وارد کردن پاسخ، یک خانهٔ خالی را انتخاب کن و عدد مناسب را وارد کن.':'Every row, column and 3×3 box must contain digits 1–9 without repetition. Select an empty cell and enter the appropriate digit.'}</div></aside></div>`;
 sudoku=createSudoku($('#sudokuDifficulty').value);renderSudoku();$('#sudokuDifficulty').addEventListener('change',()=>{sudoku=createSudoku($('#sudokuDifficulty').value);renderSudoku();});$('#sudokuNew').addEventListener('click',()=>{sudoku=createSudoku($('#sudokuDifficulty').value);renderSudoku();});$('#sudokuErase').addEventListener('click',()=>sudokuInput(0));$('#sudokuHint').addEventListener('click',()=>{if(sudoku.done)return;if(sudoku.selected<0){setSudokuMessage(lang==='fa'?'اول یک خانه خالی انتخاب کن.':'Select an empty cell first.','error');return;}const p=sudoku.selected;if(sudoku.initial[p]){setSudokuMessage(lang==='fa'?'این خانه از ابتدا پر بوده است.':'That cell is a given.');return;}sudoku.board[p]=sudoku.solution[p];sudoku.notes[p].clear();sudoku.hints++;sudokuRenderPartial();$('#sudokuHints').textContent=fmt(sudoku.hints);checkSudokuWin();});$('#sudokuCheck').addEventListener('click',()=>{if(sudoku.done)return;let empty=sudoku.board.filter(n=>!n).length;let wrong=sudoku.board.some((n,i)=>n&&n!==sudoku.solution[i]);if(empty===0&&!wrong){finishSudoku();}else if(wrong){sudoku.mistakes++;$('#sudokuMistakes') && ($('#sudokuMistakes').textContent=fmt(sudoku.mistakes));$('#sudokuMistakes2').textContent=fmt(sudoku.mistakes);setSudokuMessage(lang==='fa'?'چند عدد درست نیست؛ خانه‌های قرمز را بررسی کن.':'Some entries are incorrect. Check highlighted cells.','error');renderSudoku();}else setSudokuMessage(lang==='fa'?`${fmt(empty)} خانه باقی مانده است.`:`${empty} cells remaining.`);});const keyHandler=e=>{if(currentView!=='game'||activeGame!=='sudoku'||!sudoku)return;if(/^[1-9]$/.test(e.key)){e.preventDefault();sudokuInput(Number(e.key));}else if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){e.preventDefault();sudokuInput(0);}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(sudoku.selected<0)sudoku.selected=0;else{let r=Math.floor(sudoku.selected/9),c=sudoku.selected%9;if(e.key==='ArrowUp')r=(r+8)%9;if(e.key==='ArrowDown')r=(r+1)%9;if(e.key==='ArrowLeft')c=(c+8)%9;if(e.key==='ArrowRight')c=(c+1)%9;sudoku.selected=r*9+c;}renderSudoku();}};document.addEventListener('keydown',keyHandler);sudokuClock=setInterval(()=>{if(sudoku&&!sudoku.done){const s=Math.floor((Date.now()-sudoku.start)/1000);const mm=String(Math.floor(s/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');const el=$('#sudokuTime');if(el)el.textContent=mm+':'+ss;}},1000);activeCleanup=()=>{document.removeEventListener('keydown',keyHandler);clearInterval(sudokuClock);sudoku=null;};}
function renderSudoku(){if(!sudoku)return;const grid=$('#sudokuGrid');if(!grid)return;grid.innerHTML='';const selectedNum=sudoku.selected>=0?sudoku.board[sudoku.selected]:0;for(let p=0;p<81;p++){const r=Math.floor(p/9),c=p%9,n=sudoku.board[p];const btn=document.createElement('button');btn.className='sudoku-cell';btn.setAttribute('role','gridcell');btn.setAttribute('aria-label',`row ${r+1}, column ${c+1}, ${n||'empty'}`);if(sudoku.initial[p])btn.classList.add('given');if(sudoku.selected>=0){const sr=Math.floor(sudoku.selected/9),sc=sudoku.selected%9;if(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3)))btn.classList.add('related');if(sudoku.selected===p)btn.classList.add('selected');}if(n&&selectedNum&&n===selectedNum)btn.classList.add('same-number');if(n&&n!==sudoku.solution[p])btn.classList.add('conflict');if(n){btn.textContent=numeric(n);}btn.addEventListener('click',()=>{sudoku.selected=p;renderSudoku();});grid.appendChild(btn);}const pad=$('#sudokuPad');pad.innerHTML='';for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='number-key';b.textContent=numeric(n);b.addEventListener('click',()=>sudokuInput(n));pad.appendChild(b);}$('#sudokuEmpty').textContent=fmt(sudoku.board.filter(x=>x===0).length);$('#sudokuMistakes') && ($('#sudokuMistakes').textContent=fmt(sudoku.mistakes));$('#sudokuMistakes2').textContent=fmt(sudoku.mistakes);$('#sudokuHints').textContent=fmt(sudoku.hints);}
function numeric(n){return lang==='fa'?String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(n);}
function sudokuRenderPartial(){renderSudoku();setSudokuMessage(lang==='fa'?'یک خانه با راهنمایی پر شد.':'A cell was filled with a hint.','success');}
function sudokuInput(n){if(!sudoku||sudoku.done||sudoku.selected<0)return;const p=sudoku.selected;if(sudoku.initial[p]){setSudokuMessage(lang==='fa'?'این عدد از ابتدا در جدول بوده است.':'This given number cannot be changed.');return;}if(n===0){sudoku.board[p]=0;sudoku.notes[p].clear();}else{sudoku.board[p]=n;sudoku.notes[p].clear();if(n!==sudoku.solution[p]){sudoku.mistakes++;$('#sudokuMistakes') && ($('#sudokuMistakes').textContent=fmt(sudoku.mistakes));$('#sudokuMistakes2').textContent=fmt(sudoku.mistakes);}}renderSudoku();checkSudokuWin();}
function setSudokuMessage(msg,kind=''){const el=$('#sudokuMessage');if(el){el.textContent=msg;el.className='inline-message '+kind;}}
function checkSudokuWin(){if(sudoku&&sudoku.board.every((v,i)=>v===sudoku.solution[i]))finishSudoku();}
function finishSudoku(){if(sudoku.done)return;sudoku.done=true;const sec=Math.round((Date.now()-sudoku.start)/1000);const score=Math.max(50,Math.round(1200-(sec*1.2)-(sudoku.mistakes*60)-(sudoku.hints*80)));completeGame('sudoku',score,{seconds:sec});setSudokuMessage(lang==='fa'?`عالی! جدول کامل شد. امتیاز: ${fmt(score)}`:`Great! Puzzle solved. Score: ${score}`,'success');toast(t('win'),'success');$('#sudokuNew').textContent=t('again');}

// QUICK ANSWER
let quick=null,quickTick=null,quickTimeout=null;
function createQuestion(level){
  // level: easy ~0-2, medium ~3-5, hard ~6+
  const easy = level < 3;
  const medium = level >= 3 && level < 6;
  const hard = level >= 6;
  let type;
  if (easy) type = ['+','-'];
  else if (medium) type = ['+','-','×','paren','signed'];
  else type = ['+','-','×','÷','pow','sqrt','signed','mix'];
  const op = type[Math.floor(Math.random()*type.length)];
  let a,b,c,answer,question;
  if (op === '+') {
    a = ri(2, easy ? 20 : medium ? 80 : 150);
    b = ri(2, easy ? 15 : medium ? 50 : 120);
    answer = a + b;
    question = `${a} + ${b} = ?`;
  } else if (op === '-') {
    a = ri(5, easy ? 30 : medium ? 100 : 180);
    b = ri(1, a);
    answer = a - b;
    question = `${a} − ${b} = ?`;
  } else if (op === '×') {
    a = ri(2, easy ? 12 : medium ? 12 : 25);
    b = ri(2, easy ? 12 : medium ? 12 : 25);
    answer = a * b;
    question = `${a} × ${b} = ?`;
  } else if (op === '÷') {
    b = ri(2, 15);
    answer = ri(2, 15);
    a = b * answer;
    question = `${a} ÷ ${b} = ?`;
  } else if (op === 'pow') {
    a = ri(2, hard ? 12 : 10);
    answer = a * a;
    question = `${a}² = ?`;
  } else if (op === 'sqrt') {
    answer = ri(2, 15);
    a = answer * answer;
    question = `√${a} = ?`;
  } else if (op === 'signed') {
    // positives and negatives
    a = ri(3, medium ? 40 : 80) * (Math.random() < 0.5 ? 1 : -1);
    b = ri(2, medium ? 30 : 60) * (Math.random() < 0.5 ? 1 : -1);
    if (Math.random() < 0.5) {
      answer = a + b;
      question = `${a} + (${b}) = ?`;
    } else {
      answer = a - b;
      question = `${a} − (${b}) = ?`;
    }
  } else if (op === 'paren') {
    a = ri(2, 20);
    b = ri(2, 15);
    c = ri(2, 12);
    if (Math.random() < 0.5) {
      answer = (a + b) * c;
      question = `(${a} + ${b}) × ${c} = ?`;
    } else {
      answer = a * b + c;
      question = `${a} × ${b} + ${c} = ?`;
    }
  } else { // mix hard
    a = ri(2, 12) * (Math.random() < 0.4 ? -1 : 1);
    b = ri(2, 10);
    c = ri(2, 8);
    const kind = ri(0, 3);
    if (kind === 0) {
      answer = a * a + b;
      question = `${a}² + ${b} = ?`;
    } else if (kind === 1) {
      answer = (a + b) * c;
      question = `(${a} + ${b}) × ${c} = ?`;
    } else if (kind === 2) {
      const root = ri(2, 12);
      answer = root;
      question = `√${root * root} − 0 = ?`;
    } else {
      answer = a - b * c;
      question = `${a} − ${b} × ${c} = ?`;
    }
  }
  return {question, answer, op};
}
function makeChoices(answer,level){const vals=new Set([answer]);const allowNeg=level>=3;while(vals.size<4){let d=ri(1,Math.max(5,level*4+5))*(Math.random()<.5?-1:1);let v=answer+d;if(allowNeg||v>=0)vals.add(v);}return shuffle(Array.from(vals));}
function quickTimeLimit(level){const difficulty=Number(level);return difficulty>=6?5:difficulty>=3?10:20;}
function updateQuickTimeLabel(){const label=$('#quickTimeLimit');if(!label)return;const selected=Number($('#quickDifficulty')?.value??quick?.level??3);label.textContent=`${quickTimeLimit(selected)} ${lang==='fa'?'ثانیه':'sec'}`;}
function startQuick(){const mount=$('#gameMount');mount.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><div class="game-status"><span class="mini-stat">${iconSvg('quick')} ${t('score')} <strong id="quickScore">0</strong></span><span class="mini-stat">${iconSvg('star')} ${t('streak')} <strong id="quickStreak">0</strong></span></div><div class="toolbar-group"><label class="difficulty-chip">${t('difficulty')} <select class="select-control" id="quickDifficulty"><option value="0">${t('easy')}</option><option value="3" selected>${t('medium')}</option><option value="6">${t('hard')}</option></select></label><button class="button button-secondary button-small" id="quickNew">${iconSvg('refresh')} ${t('newGame')}</button></div></div><div id="quickStage"></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'قانون چالش':'Challenge rules'}</h3><div class="info-row"><span>${lang==='fa'?'زمان هر سؤال':'Time per question'}</span><strong id="quickTimeLimit">10 ${lang==='fa'?'ثانیه':'sec'}</strong></div><div class="info-row"><span>${lang==='fa'?'پاسخ درست':'Correct answer'}</span><strong>+10</strong></div><div class="info-row"><span>${lang==='fa'?'سؤال در هر دور':'Questions per round'}</span><strong>10</strong></div><div class="hint-box">${lang==='fa'?'هر سؤال و گزینه‌ها هنگام نمایش به‌صورت تازه ساخته می‌شوند. با ادامه‌دادن، سؤال‌ها دشوارتر می‌شوند. برای پاسخ از کلیدهای ۱ تا ۴ هم می‌توانی استفاده کنی.':'Questions and choices are generated fresh as you play. Questions get harder as you progress. You can also answer with keys 1–4.'}</div></aside></div>`;
quick={score:0,streak:0,level:Number($('#quickDifficulty').value),questionNo:0,asked:new Set(),locked:false,ended:false,history:[],remaining:quickTimeLimit(Number($('#quickDifficulty').value)),start:Date.now()};updateQuickTimeLabel();$('#quickDifficulty').addEventListener('change',()=>{quick.level=Number($('#quickDifficulty').value);updateQuickTimeLabel();nextQuickQuestion(true);});$('#quickNew').addEventListener('click',()=>{quick.score=0;quick.streak=0;quick.questionNo=0;quick.asked.clear();quick.history=[];quick.ended=false;quick.remaining=quickTimeLimit(Number($('#quickDifficulty')?.value||quick.level));quick.start=Date.now();updateQuickScore();updateQuickTimeLabel();nextQuickQuestion(true);});renderQuickPrompt();const keyHandler=e=>{if(currentView!=='game'||activeGame!=='quick'||!quick||quick.locked||quick.ended)return;if(['1','2','3','4'].includes(e.key)){const ix=Number(e.key)-1;const b=$$('[data-answer-index]')[ix];if(b)b.click();}};document.addEventListener('keydown',keyHandler);activeCleanup=()=>{clearInterval(quickTick);clearTimeout(quickTimeout);document.removeEventListener('keydown',keyHandler);quick=null;};}
function renderQuickPrompt(){if(!quick)return;let q,choices,packKey;let attempts=0;do{q=createQuestion(quick.level+Math.floor(quick.questionNo/5));choices=makeChoices(q.answer,quick.level+Math.floor(quick.questionNo/5));packKey=q.question+'|'+choices.slice().sort((a,b)=>a-b).join(',');attempts++;}while((quick.asked.has(q.question)||hasSeen('quick-questions',q.question)||hasSeen('quick-question-packs',packKey))&&attempts<250);quick.asked.add(q.question);rememberSeen('quick-question-packs',packKey,5000);rememberSeen('quick-questions',q.question,5000);quick.questionNo++;quick.current=q;quick.choices=choices;quick.remaining=quickTimeLimit(quick.level);quick.locked=false;quick.history.push(null);const stage=$('#quickStage');stage.innerHTML=`<div class="question-stage"><div class="question-topline"><span class="question-count">${t('question')} ${fmt(quick.questionNo)}</span><span class="question-timer">${iconSvg('clock')} <strong id="quickTimer">${quickTimeLimit(quick.level)}</strong>s</span></div><div class="timer-track"><div class="timer-fill" id="quickTimerFill"></div></div><h2 class="question-text">${q.question}</h2><div class="answer-grid">${quick.choices.map((v,i)=>`<button class="answer-option" data-answer-index="${i}"><span class="option-letter">${['A','B','C','D'][i]}</span>${fmt(v)}</button>`).join('')}</div><div class="question-progress" id="quickProgress"></div><div class="inline-message" id="quickMessage" style="margin-top:17px">${lang==='fa'?'یک گزینه را انتخاب کن.':'Choose an answer.'}</div></div>`;$$('[data-answer-index]',stage).forEach(b=>b.addEventListener('click',()=>answerQuick(Number(b.dataset.answerIndex))));renderQuickProgress();clearInterval(quickTick);quickTick=setInterval(()=>{if(!quick||quick.locked||quick.ended)return;quick.remaining-=.1;const tm=$('#quickTimer'),fill=$('#quickTimerFill');if(tm)tm.textContent=Math.max(0,Math.ceil(quick.remaining));if(fill)fill.style.width=Math.max(0,quick.remaining/quickTimeLimit(quick.level)*100)+'%';if(quick.remaining<=0){quick.locked=true;quick.streak=0;quick.history[quick.history.length-1]=false;quickMessage(lang==='fa'?'زمان تمام شد!':'Time is up!','error');quick.answers=(quick.answers||0)+1;updateQuickScore();renderQuickProgress();quickTimeout=setTimeout(()=>{if(quick&&!quick.ended)advanceQuick();},700);}},100);}
function answerQuick(index){if(!quick||quick.locked||quick.ended)return;quick.locked=true;clearInterval(quickTick);const value=quick.choices[index],correct=value===quick.current.answer;const buttons=$$('[data-answer-index]');buttons.forEach((b,i)=>{b.disabled=true;if(quick.choices[i]===quick.current.answer)b.classList.add('correct');if(i===index&&!correct)b.classList.add('wrong');});if(correct){quick.score+=10+Math.min(quick.streak,10);quick.streak++;quick.history[quick.history.length-1]=true;quickMessage(`${t('correct')} +${10+Math.min(quick.streak-1,10)}`,'success');}else{quick.streak=0;quick.history[quick.history.length-1]=false;quickMessage(`${t('wrong')} ${lang==='fa'?'پاسخ درست:':'Correct:'} ${fmt(quick.current.answer)}`,'error');}quick.answers=(quick.answers||0)+1;updateQuickScore();renderQuickProgress();quickTimeout=setTimeout(()=>{if(quick&&!quick.ended)advanceQuick();},650);}
function quickMessage(m,kind){const el=$('#quickMessage');if(el){el.textContent=m;el.className='inline-message '+kind;}}
function updateQuickScore(){if($('#quickScore'))$('#quickScore').textContent=fmt(quick?.score||0);if($('#quickStreak'))$('#quickStreak').textContent=fmt(quick?.streak||0);}
function renderQuickProgress(){const el=$('#quickProgress');if(!el||!quick)return;el.innerHTML=quick.history.slice(-12).map(x=>`<span class="progress-dot ${x===true?'done':x===false?'missed':''}"></span>`).join('');}
function advanceQuick(){if(!quick||quick.ended)return;if(quick.questionNo>=10){finishQuick();return;}nextQuickQuestion();}
function finishQuick(){if(!quick||quick.ended)return;quick.ended=true;clearInterval(quickTick);clearTimeout(quickTimeout);const correct=quick.history.filter(v=>v===true).length;completeGame('quick',quick.score,{questions:quick.questionNo,correct});const stage=$('#quickStage');stage.innerHTML=`<div class="result-panel"><div class="result-medal">${iconSvg('trophy')}</div><h2>${t('finish')}</h2><p>${lang==='fa'?'ده سؤال را پشت سر گذاشتی. رکوردت ذخیره شد.':'You completed ten questions. Your score has been saved.'}</p><div class="result-stats"><div class="result-stat"><strong>${fmt(quick.score)}</strong><span>${t('score')}</span></div><div class="result-stat"><strong>${fmt(correct)} / 10</strong><span>${t('accuracy')}</span></div><div class="result-stat"><strong>${fmt(Math.round(correct/10*100))}%</strong><span>${lang==='fa'?'پاسخ درست':'Correct'}</span></div></div><button class="button button-primary" id="quickAgain">${iconSvg('refresh')} ${t('again')}</button></div>`;$('#quickAgain').addEventListener('click',()=>{quick.score=0;quick.streak=0;quick.level=Number($('#quickDifficulty')?.value||0);quick.questionNo=0;quick.asked.clear();quick.history=[];quick.ended=false;quick.remaining=quickTimeLimit(Number($('#quickDifficulty')?.value||quick.level));quick.start=Date.now();updateQuickScore();updateQuickTimeLabel();nextQuickQuestion(true);});}
function nextQuickQuestion(reset=false){clearTimeout(quickTimeout);if(!quick)return;quick.level=Number($('#quickDifficulty')?.value||quick.level);renderQuickPrompt();}

// Number Merge — 3×3, 4×4, or 5×5 with keyboard, mouse drag, and touch swipe
let game2048=null;
function start2048(){const m=$('#gameMount');m.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><div class="game-status"><span class="mini-stat">${t('score')} <strong id="mergeScore">0</strong></span><span class="mini-stat">${t('best')} <strong id="mergeBest">${fmt(bestFor('2048'))}</strong></span></div><div class="toolbar-group"><label class="game-status merge-size-label"><span>${lang==='fa'?'اندازه جدول':'Board size'}</span><select class="select-control" id="mergeSize"><option value="3">${lang==='fa'?'کوچک ۳×۳':'Small 3×3'}</option><option value="4" selected>${lang==='fa'?'متوسط ۴×۴':'Medium 4×4'}</option><option value="5">${lang==='fa'?'بزرگ ۵×۵':'Large 5×5'}</option></select></label><button class="button button-primary button-small" id="mergeNew">${iconSvg('refresh')} ${t('newGame')}</button></div></div><div class="board-2048-wrap"><div class="board-2048" id="mergeBoard" tabindex="0" role="application" aria-label="Number merge game board"></div><div class="inline-message" id="mergeMessage">${lang==='fa'?'صفحه را به چپ، راست، بالا یا پایین بکش؛ کاشی‌های هم‌عدد ادغام می‌شوند.':'Swipe or drag the board in any direction.'}</div><div class="toolbar-group merge-arrows"><button class="button button-secondary button-small" data-merge="up" aria-label="Up">${iconSvg('arrow','arrow-up')}</button><button class="button button-secondary button-small" data-merge="left" aria-label="Left">${iconSvg('arrow','arrow-left')}</button><button class="button button-secondary button-small" data-merge="down" aria-label="Down">${iconSvg('arrow','arrow-down')}</button><button class="button button-secondary button-small" data-merge="right" aria-label="Right">${iconSvg('arrow')}</button></div></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'چطور بازی کنیم؟':'How to play'}</h3><div class="info-row"><span>${lang==='fa'?'هدف جدول':'Board target'}</span><strong id="mergeTarget">2048</strong></div><div class="info-row"><span>${lang==='fa'?'کنترل':'Controls'}</span><strong>${lang==='fa'?'کشیدن / کلیدها':'Drag / arrows'}</strong></div><div class="hint-box">${lang==='fa'?'کاشی را در یک جهت بکش یا سوایپ کن. دو عدد هم‌اندازه با هم ادغام می‌شوند. با انتخاب جدول ۳×۳، ۴×۴ یا ۵×۵ سختی و هدف بازی تغییر می‌کند.':'Swipe or drag the board in any direction. Matching tiles merge; 3×3, 4×4, or 5×5 boards offer different challenges.'}</div></aside></div>`;game2048={size:4,board:Array(16).fill(0),score:0,over:false,won:false};reset2048();$('#mergeNew').addEventListener('click',reset2048);$('#mergeSize').addEventListener('change',()=>{game2048.size=Number($('#mergeSize').value);reset2048();});$$('[data-merge]').forEach(b=>b.addEventListener('click',()=>move2048(b.dataset.merge)));const keyHandler=e=>{if(currentView!=='game'||activeGame!=='2048')return;const d={'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right','w':'up','s':'down','a':'left','d':'right','W':'up','S':'down','A':'left','D':'right'}[e.key];if(d&&!e.target.matches('input,select,textarea')){e.preventDefault();move2048(d);}};document.addEventListener('keydown',keyHandler);let pointer=null;const boardEl=$('#mergeBoard');boardEl.addEventListener('pointerdown',e=>{const tile=e.target.closest('.tile-2048');pointer={x:e.clientX,y:e.clientY,id:e.pointerId,from:tile?Number(tile.dataset.index):-1};try{boardEl.setPointerCapture(e.pointerId)}catch{}});boardEl.addEventListener('pointerup',e=>{if(!pointer)return;const start=pointer;const dx=e.clientX-start.x,dy=e.clientY-start.y;pointer=null;const moved=Math.max(Math.abs(dx),Math.abs(dy));const endTile=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.tile-2048');const to=endTile?Number(endTile.dataset.index):-1;if(start.from>=0&&to>=0&&to!==start.from&&moved>14&&moveDraggedTile2048(start.from,to))return;if(moved>18)move2048(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});boardEl.addEventListener('pointercancel',()=>pointer=null);activeCleanup=()=>{document.removeEventListener('keydown',keyHandler);game2048=null;};}
function reset2048(){if(!game2048)return;const requested=Number($('#mergeSize')?.value||game2048.size||4);game2048.size=requested;game2048.board=Array(requested*requested).fill(0);game2048.score=0;game2048.over=false;game2048.won=false;for(let tries=0;tries<160;tries++){game2048.board=Array(requested*requested).fill(0);add2048Tile();add2048Tile();const sig=game2048.board.join(',');if(!hasSeen('merge-start:'+requested,sig)){rememberSeen('merge-start:'+requested,sig,200);break;}}const message=$('#mergeMessage');if(message)message.textContent=lang==='fa'?'صفحه را به چپ، راست، بالا یا پایین بکش؛ کاشی‌های هم‌عدد ادغام می‌شوند.':'Swipe or drag the board in any direction to merge matching tiles.';render2048();}
function add2048Tile(){if(!game2048)return;const empty=game2048.board.map((v,i)=>v?null:i).filter(v=>v!==null);if(empty.length)game2048.board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;}
function moveDraggedTile2048(from,to){if(!game2048||game2048.over)return false;const n=game2048.size,r1=Math.floor(from/n),c1=from%n,r2=Math.floor(to/n),c2=to%n;if(Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return false;const a=game2048.board[from],b=game2048.board[to];if(!a)return false;if(b!==0&&b!==a)return false;if(b===a){game2048.board[to]=b*2;game2048.score+=b*2;game2048.board[from]=0;}else{game2048.board[to]=a;game2048.board[from]=0;}add2048Tile();if(!canMove2048(game2048.board)){game2048.over=true;completeGame('2048',game2048.score,{size:n});}render2048();return true;}
function move2048(dir){if(!game2048||game2048.over)return;const n=game2048.size,b=game2048.board.slice();let gain=0;for(let line=0;line<n;line++){let idx=[];for(let j=0;j<n;j++){const r=(dir==='up'||dir==='down')?j:line,c=(dir==='left'||dir==='right')?j:line;idx.push(r*n+c);}if(dir==='down'||dir==='right')idx.reverse();let arr=idx.map(i=>b[i]).filter(Boolean),out=[];for(let k=0;k<arr.length;k++){if(arr[k]===arr[k+1]){out.push(arr[k]*2);gain+=arr[k]*2;k++;}else out.push(arr[k]);}while(out.length<n)out.push(0);idx.forEach((p,j)=>b[p]=out[j]);}if(b.every((v,i)=>v===game2048.board[i]))return;game2048.board=b;game2048.score+=gain;add2048Tile();const target=2048;if(b.some(v=>v>=target)&&!game2048.won){game2048.won=true;toast(lang==='fa'?`به ${fmt(target)} رسیدی! عالی بود!`:`You reached ${target}! Amazing!`,'success');}if(!canMove2048(game2048.board)){game2048.over=true;completeGame('2048',game2048.score,{size:n});$('#mergeMessage').textContent=lang==='fa'?`حرکتی باقی نمانده! امتیاز: ${fmt(game2048.score)}`:`No moves left. Score: ${game2048.score}`;}render2048();}
function canMove2048(b){const n=game2048.size;if(b.some(v=>!v))return true;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const p=r*n+c;if(c<n-1&&b[p]===b[p+1])return true;if(r<n-1&&b[p]===b[p+n])return true;}return false;}
function render2048(){if(!game2048)return;const el=$('#mergeBoard');if(!el)return;el.style.setProperty('--merge-size',game2048.size);el.dataset.size=String(game2048.size);el.innerHTML=game2048.board.map((v,i)=>`<div class="tile-2048 ${v?'':'empty'}" data-index="${i}" ${v?`data-value="${v}"`:''} draggable="false">${v?fmt(v):''}</div>`).join('');$('#mergeScore').textContent=fmt(game2048.score);if($('#mergeBest'))$('#mergeBest').textContent=fmt(Math.max(bestFor('2048'),game2048.score));if($('#mergeTarget'))$('#mergeTarget').textContent='2048';if(game2048.over)$('#mergeMessage').textContent=lang==='fa'?`بازی تمام شد؛ برای تلاش دوباره «بازی جدید» را بزن. امتیاز: ${fmt(game2048.score)}`:`Game over. Start a new game to try again. Score: ${game2048.score}`;}

// Number Puzzle
let numPuzzle=null;
function newNumberPuzzle(){return uniqueGenerated('number-puzzles',()=>{let a=ri(2,18),b=ri(2,18),op=['+','−','×'][ri(0,2)];if(op==='×'){a=ri(2,12);b=ri(2,12);}while(b===a)b=ri(2,18);if(op==='−'&&a<b)[a,b]=[b,a];const target=op==='+'?a+b:op==='−'?a-b:a*b;let nums=[a,b];while(nums.length<4){const v=ri(2,30);if(!nums.includes(v))nums.push(v);}return {target,nums:shuffle(nums),a,b,op,selected:[],operator:null,tries:0,solved:false,history:[]};},x=>`${x.target}|${x.nums.slice().sort((a,b)=>a-b).join(',')}`,500);}
function startNumberPuzzle(){const m=$('#gameMount');m.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><span class="difficulty-chip">${iconSvg('puzzle')} ${lang==='fa'?'معمای تصادفی':'Random puzzle'}</span><button class="button button-secondary button-small" id="numberNew">${iconSvg('refresh')} ${t('newPuzzle')}</button></div><div id="numberMount"></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'روش حل':'How to solve'}</h3><div class="info-row"><span>${t('target')}</span><strong id="numberTargetSmall">—</strong></div><div class="info-row"><span>${t('moves')}</span><strong id="numberTries">0 / 3</strong></div><div class="hint-box">${lang==='fa'?'دو کاشی عددی را انتخاب کن و یک عملگر بزن. اگر نتیجه با عدد هدف برابر شود، معما حل شده است. عمل تقسیم در این نسخه لازم نیست؛ جمع، تفریق و ضرب کافی است.':'Choose two number tiles and an operator. If the result matches the target, you solved the puzzle. Addition, subtraction, and multiplication are supported.'}</div></aside></div>`;numPuzzle=newNumberPuzzle();renderNumberPuzzle();$('#numberNew').addEventListener('click',()=>{numPuzzle=newNumberPuzzle();renderNumberPuzzle();});activeCleanup=()=>{numPuzzle=null;};}
function renderNumberPuzzle(){if(!numPuzzle)return;$('#numberTargetSmall').textContent=fmt(numPuzzle.target);$('#numberTries').textContent=`${numPuzzle.tries} / 3`;const mount=$('#numberMount');mount.innerHTML=`<div class="puzzle-workspace"><div class="target-card"><span>${t('target')}</span><strong>${fmt(numPuzzle.target)}</strong><div>${lang==='fa'?'با دو عدد و یک عملگر به این جواب برس':'Reach this result using two numbers and one operator'}</div></div><div class="puzzle-step"><h3>${lang==='fa'?'۱. عدد اول را انتخاب کن':'1. Choose first number'}</h3><div class="number-picker">${numPuzzle.nums.map((n,i)=>`<button class="pick-tile ${numPuzzle.selected.includes(i)?'selected':''}" data-num-index="${i}" ${numPuzzle.solved||numPuzzle.tries>=3?'disabled':''}>${fmt(n)}</button>`).join('')}</div></div><div class="puzzle-step"><h3>${lang==='fa'?'۲. عملگر را انتخاب کن':'2. Choose operator'}</h3><div class="operator-picker">${['+','−','×'].map(o=>`<button class="pick-tile ${numPuzzle.operator===o?'selected':''}" data-operator="${o}" ${numPuzzle.solved||numPuzzle.tries>=3?'disabled':''}>${o}</button>`).join('')}</div></div><button class="button button-primary" id="numberTry" ${numPuzzle.solved||numPuzzle.tries>=3?'disabled':''}>${t('tryIt')} ${iconSvg('arrow')}</button><div class="inline-message number-message ${numPuzzle.solved?'success':numPuzzle.tries>=3?'error':''}" style="grid-column:1/-1" id="numberMessage">${numPuzzle.solved?t('targetReached'):numPuzzle.tries>=3?(lang==='fa'?`پاسخ ممکن بود: ${numPuzzle.a} ${numPuzzle.op} ${numPuzzle.b} = ${numPuzzle.target}`:`One solution: ${numPuzzle.a} ${numPuzzle.op} ${numPuzzle.b} = ${numPuzzle.target}`):(lang==='fa'?'دو عدد و یک عملگر انتخاب کن.':'Pick two numbers and an operator.')}</div></div>`;$$('[data-num-index]',mount).forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.numIndex);if(numPuzzle.selected.includes(i))numPuzzle.selected=numPuzzle.selected.filter(x=>x!==i);else if(numPuzzle.selected.length<2)numPuzzle.selected.push(i);else numPuzzle.selected=[numPuzzle.selected[1],i];renderNumberPuzzle();}));$$('[data-operator]',mount).forEach(b=>b.addEventListener('click',()=>{numPuzzle.operator=b.dataset.operator;renderNumberPuzzle();}));$('#numberTry').addEventListener('click',tryNumberPuzzle);}
function tryNumberPuzzle(){if(numPuzzle.solved||numPuzzle.tries>=3)return;if(numPuzzle.selected.length!==2||!numPuzzle.operator){toast(lang==='fa'?'دو عدد و یک عملگر انتخاب کن.':'Choose two numbers and an operator.');return;}const a=numPuzzle.nums[numPuzzle.selected[0]],b=numPuzzle.nums[numPuzzle.selected[1]];let value=numPuzzle.operator==='+'?a+b:numPuzzle.operator==='−'?a-b:a*b;numPuzzle.tries++;if(value===numPuzzle.target){numPuzzle.solved=true;const score=Math.max(30,100-(numPuzzle.tries-1)*20);completeGame('puzzle',score);toast(t('targetReached'),'success');}else{const m=$('#numberMessage');if(m){m.textContent=`${fmt(a)} ${numPuzzle.operator} ${fmt(b)} = ${fmt(value)} ${lang==='fa'?'؛ دوباره امتحان کن.':'— try again.'}`;m.className='inline-message error';}}renderNumberPuzzle();}

// Missing number
let missing=null;
function sequenceQuestion(level=0){return uniqueGenerated('missing-sequences',()=>{const templates=[()=>{let a=ri(1,Math.min(40,15+level*3)),d=ri(2,Math.min(20,9+level));return {seq:[a,a+d,a+d*2,a+d*3,null],answer:a+d*4,rule:lang==='fa'?`هر بار ${d} تا اضافه می‌شود`:`Add ${d} each time`};},()=>{let a=ri(2,Math.min(15,7+Math.floor(level/2))),m=ri(2,level<6?4:5);return {seq:[a,a*m,a*m*m,a*m*m*m,null],answer:a*m**4,rule:lang==='fa'?`هر بار در ${m} ضرب می‌شود`:`Multiply by ${m} each time`};},()=>{let n=ri(2,Math.min(25,8+level*2));return {seq:[n*n,(n+1)**2,(n+2)**2,(n+3)**2,null],answer:(n+4)**2,rule:lang==='fa'?'مربع عددهای پیاپی':'Consecutive squares'};},()=>{let a=ri(1,level<4?5:10),b=ri(2,level<4?8:14);return {seq:[a,b,a+b,a+2*b,null],answer:2*a+3*b,rule:lang==='fa'?'هر عدد از جمع دو عدد قبلی ساخته می‌شود':'Fibonacci-like pattern'};}];let obj=templates[ri(0,templates.length-1)]();const ans=new Set([obj.answer]);while(ans.size<4){let d=ri(1,Math.max(5,Math.round(obj.answer*.3)));let v=obj.answer+(Math.random()<.5?-d:d);if(v>=0&&v!==obj.answer)ans.add(v);}obj.choices=shuffle(Array.from(ans));obj.answered=false;return obj;},obj=>obj.seq.join(',')+'='+obj.answer,800);}
function startMissing(){const m=$('#gameMount');m.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><div class="game-status"><span class="mini-stat">${t('score')} <strong id="missingScore">0</strong></span><span class="mini-stat">${t('question')} <strong id="missingNo">1</strong></span></div><button class="button button-secondary button-small" id="missingNew">${iconSvg('refresh')} ${t('newGame')}</button></div><div id="missingStage"></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'الگوها را کشف کن':'Spot the pattern'}</h3><div class="info-row"><span>${lang==='fa'?'پاسخ درست':'Correct answer'}</span><strong>+10</strong></div><div class="info-row"><span>${lang==='fa'?'سختی':'Difficulty'}</span><strong>${lang==='fa'?'مرحله‌ای':'Adaptive'}</strong></div><div class="hint-box">${lang==='fa'?'به فاصله میان عددها، ضرب‌های تکراری یا مربع اعداد دقت کن. با پیشرفت، الگوها دشوارتر می‌شوند.':'Look for repeated differences, multiplication, or square numbers. Patterns become harder as you progress.'}</div></aside></div>`;missing={score:0,no:0,level:0,correct:0,wrong:0};nextMissing();$('#missingNew').addEventListener('click',()=>{missing={score:0,no:0,level:0,correct:0,wrong:0};nextMissing();});activeCleanup=()=>{missing=null;};}
function nextMissing(){if(!missing)return;if(missing.no>=10){finishMissing();return;}missing.q=sequenceQuestion(missing.level);missing.no++;$('#missingScore').textContent=fmt(missing.score);$('#missingNo').textContent=fmt(missing.no);const q=missing.q,m=$('#missingStage');m.innerHTML=`<div class="question-stage"><p class="question-count">${lang==='fa'?'جای خالی را پیدا کن':'Find the missing number'}</p><div class="sequence-grid">${q.seq.map(v=>`<div class="sequence-tile ${v===null?'missing':''}">${v===null?'?':fmt(v)}</div>`).join('')}</div><div class="sequence-answers">${q.choices.map((v,i)=>`<button class="sequence-answer" data-missing-answer="${i}">${fmt(v)}</button>`).join('')}</div><div class="inline-message" id="missingMessage" style="margin-top:18px">${lang==='fa'?'کدام عدد باید جای علامت سؤال قرار بگیرد؟':'Which number belongs in place of the question mark?'}</div><button class="button button-primary" id="missingNext" style="margin-top:13px;display:none">${lang==='fa'?'سؤال بعدی':'Next question'} →</button></div>`;$$('[data-missing-answer]',m).forEach(b=>b.addEventListener('click',()=>answerMissing(Number(b.dataset.missingAnswer))));$('#missingNext').addEventListener('click',nextMissing);}
function finishMissing(){if(!missing)return;completeGame('missing',missing.score,{questions:missing.no,correct:missing.correct,wrong:missing.wrong});const stage=$('#missingStage');stage.innerHTML=`<div class="result-panel"><div class="result-medal">${iconSvg('trophy')}</div><h2>${t('finish')}</h2><p>${lang==='fa'?'ده الگو را حل کردی؛ نتیجه‌ات ذخیره شد.':'You completed ten patterns. Your score has been saved.'}</p><div class="result-stats"><div class="result-stat"><strong>${fmt(missing.score)}</strong><span>${t('score')}</span></div><div class="result-stat"><strong>${fmt(missing.correct)} / 10</strong><span>${t('accuracy')}</span></div><div class="result-stat"><strong>${fmt(missing.wrong)}</strong><span>${t('mistakes')}</span></div></div><button class="button button-primary" id="missingAgain">${iconSvg('refresh')} ${t('again')}</button></div>`;$('#missingAgain').addEventListener('click',()=>{missing={score:0,no:0,level:0,correct:0,wrong:0};nextMissing();});}
function answerMissing(index){if(!missing||missing.q.answered)return;const q=missing.q,ans=q.choices[index],ok=ans===q.answer;q.answered=true;$$('[data-missing-answer]').forEach((b,i)=>{b.disabled=true;if(q.choices[i]===q.answer)b.classList.add('correct');if(i===index&&!ok)b.classList.add('wrong');});const msg=$('#missingMessage');if(ok){missing.score+=10+Math.min(10,missing.level);missing.correct++;missing.level++;msg.textContent=lang==='fa'?`آفرین! ${q.rule}؛ +${10+Math.min(10,missing.level-1)} امتیاز`:`Correct! ${q.rule}; +${10+Math.min(10,missing.level-1)} points`;msg.className='inline-message success';}else{missing.wrong++;missing.level=Math.max(0,missing.level-1);msg.textContent=lang==='fa'?`پاسخ درست ${fmt(q.answer)} بود. ${q.rule}.`:`The answer was ${q.answer}. ${q.rule}.`;msg.className='inline-message error';}$('#missingScore').textContent=fmt(missing.score);$('#missingNext').style.display='inline-flex';$('#missingNext').textContent=missing.no>=10?t('finish'):(lang==='fa'?'سؤال بعدی':'Next question')+' →'; }

// Memory match
let memory=null,memoryTick=null;
function makeMemoryDeck(){const pairs=[];const ops=['+','−','×','÷'];let attempts=0;while(pairs.length<6&&attempts<400){attempts++;let a=ri(3,30),b=ri(2,16),op=ops[ri(0,3)],val;if(op==='−'&&a<b)[a,b]=[b,a];if(op==='÷'){b=ri(2,12);val=ri(2,15);a=b*val;}else val=op==='+'?a+b:op==='−'?a-b:a*b;const expr=`${a} ${op} ${b}`,key=`${expr}=${val}`;if(pairs.some(p=>p.key===key)||hasSeen('memory-pairs',key))continue;rememberSeen('memory-pairs',key,3000);pairs.push({expr,val:String(val),key});}while(pairs.length<6){let a=ri(3,2000),b=ri(2,1000),expr=`${a} + ${b}`,val=String(a+b),key=`${expr}=${val}`;if(!hasSeen('memory-pairs',key)){rememberSeen('memory-pairs',key,3000);pairs.push({expr,val,key});}}return shuffle(pairs.flatMap((p,i)=>[{id:i,text:p.expr,kind:'expr'},{id:i,text:p.val,kind:'value'}]));}
function startMemory(){const m=$('#gameMount');m.innerHTML=`<div class="game-layout"><section class="game-main-card"><div class="game-toolbar"><div class="game-status"><span class="mini-stat">${t('moves')} <strong id="memoryMoves">0</strong></span><span class="mini-stat">${iconSvg('clock')} <strong id="memoryTime">00:00</strong></span></div><button class="button button-secondary button-small" id="memoryNew">${iconSvg('refresh')} ${t('newGame')}</button></div><div id="memoryStage"></div></section><aside class="info-panel"><h3 class="panel-title">${lang==='fa'?'جفت‌ها را پیدا کن':'Find the pairs'}</h3><div class="info-row"><span>${lang==='fa'?'جفت‌های کارت':'Card pairs'}</span><strong>۶</strong></div><div class="info-row"><span>${lang==='fa'?'حرکت کمتر':'Fewer moves'}</span><strong>${lang==='fa'?'امتیاز بیشتر':'Higher score'}</strong></div><div class="hint-box">${lang==='fa'?'هر عبارت را با عدد جوابش جفت کن. کارت‌ها را یکی‌یکی برگردان و جای آن‌ها را به خاطر بسپار.':'Match every equation card with its answer. Flip cards one at a time and remember where they are.'}</div></aside></div>`;memory={deck:makeMemoryDeck(),flipped:[],matched:new Set(),moves:0,start:Date.now(),locked:false,done:false};renderMemory();$('#memoryNew').addEventListener('click',()=>{memory={deck:makeMemoryDeck(),flipped:[],matched:new Set(),moves:0,start:Date.now(),locked:false,done:false};renderMemory();});memoryTick=setInterval(()=>{if(memory&&!memory.done){let s=Math.floor((Date.now()-memory.start)/1000);const el=$('#memoryTime');if(el)el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}},1000);activeCleanup=()=>{clearInterval(memoryTick);memory=null;};}
function renderMemory(){if(!memory)return;const stage=$('#memoryStage');stage.innerHTML=`<div class="memory-grid">${memory.deck.map((c,i)=>{let face=memory.flipped.includes(i)||memory.matched.has(c.id);return `<button class="memory-card ${face?'flipped':''} ${memory.matched.has(c.id)?'matched':''}" data-memory="${i}" ${memory.matched.has(c.id)||memory.locked||memory.done?'disabled':''} aria-label="${face?esc(c.text):'Hidden card'}">${face?esc(c.text):''}</button>`;}).join('')}</div><div class="inline-message" id="memoryMessage">${memory.done?(lang==='fa'?'همه جفت‌ها پیدا شدند!':'All pairs found!'):(lang==='fa'?'عبارت را با جوابش جفت کن.':'Match each equation to its answer.')}</div>`;$('#memoryMoves').textContent=fmt(memory.moves);$$('[data-memory]',stage).forEach(b=>b.addEventListener('click',()=>flipMemory(Number(b.dataset.memory))));}
function flipMemory(i){if(!memory||memory.locked||memory.done||memory.flipped.includes(i))return;const card=memory.deck[i];if(memory.matched.has(card.id))return;memory.flipped.push(i);renderMemory();if(memory.flipped.length===2){memory.moves++;$('#memoryMoves').textContent=fmt(memory.moves);const [ia,ib]=memory.flipped,a=memory.deck[ia],b=memory.deck[ib];memory.locked=true;if(a.id===b.id){memory.matched.add(a.id);memory.flipped=[];memory.locked=false;renderMemory();if(memory.matched.size===6){memory.done=true;const seconds=(Date.now()-memory.start)/1000,score=Math.max(20,Math.round(300-memory.moves*8-seconds));completeGame('memory',score,{moves:memory.moves,seconds:Math.round(seconds)});$('#memoryMessage').textContent=lang==='fa'?`همه جفت‌ها پیدا شدند! امتیاز: ${fmt(score)}`:`All pairs matched! Score: ${score}`;$('#memoryMessage').className='inline-message success';toast(t('win'),'success');}}else{setTimeout(()=>{if(!memory)return;memory.flipped=[];memory.locked=false;renderMemory();},850);}}}

// MISSING SMALL UTILS
function ri(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

// Interactions are deliberately scoped to the game area; site navigation and settings belong to the host app.
gameRoot.addEventListener('pointerdown',e=>{if(!e.target.closest('.select-control-wrap'))closeCustomSelects();},true);
// The final requested missing-number icon is lost-number.svg; number-123.svg is a safe fallback.
gameRoot.addEventListener('error', event => {
 const img = event.target;
 if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-icon-missing')) return;
 const fallback = img.dataset.fallbackSrc;
 if (fallback && !img.dataset.fallbackTried) {
  img.dataset.fallbackTried = '1';
  img.src = fallback;
 }
}, true);
gameRoot.addEventListener('pointerdown',e=>{const button=e.target.closest('button');if(!button||e.pointerType==='mouse')return;button.classList.remove('is-pressed');void button.offsetWidth;button.classList.add('is-pressed');clearTimeout(button._pressTimer);button._pressTimer=setTimeout(()=>button.classList.remove('is-pressed'),180);},true);
gameRoot.addEventListener('pointerup',()=>$$('button.is-pressed').forEach(b=>{clearTimeout(b._pressTimer);b.classList.remove('is-pressed');}),{passive:true});
gameRoot.addEventListener('pointercancel',()=>$$('button.is-pressed').forEach(b=>b.classList.remove('is-pressed')),{passive:true});
const hostSettingsObserver=new MutationObserver(()=>{syncHostSettings();});
hostSettingsObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
hostSettingsObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
const hostedGamePage=document.getElementById('gamesPage');
if(hostedGamePage){const hostedPageObserver=new MutationObserver(()=>{if(!hostedGamePage.classList.contains('show')&&currentView==='game'){stopCurrent();renderView('home');}});hostedPageObserver.observe(hostedGamePage,{attributes:true,attributeFilter:['class']});}
window.addEventListener('storage',e=>{if(['mathmateTheme','mathmateColorTheme','mathmateFontSize','mathmateLang','mathmateAnimations'].includes(e.key))syncHostSettings();});
syncHostSettings();renderView('home');
})();


/* ================= DARSYAR POLISH BRIDGE =================
 * Adds responsive search and greeting/calendar layout enhancements to the bundled
 * Darsyar open Shadow DOM app; no iframe or independent settings system is used.
 */
(function initDarsyarPolishBridge() {
    const mount = document.getElementById('darsyarMount');
    if (!mount) return;
    let currentRoot = null;
    let rootObserver = null;

    const bridgeStyles = `
      /* Thin, rounded scrollbars in the Darsyar open Shadow DOM (Windows 11-inspired). */
      :host, * { scrollbar-width:thin; scrollbar-color:rgba(127,139,154,.58) transparent; }
      .darsyar-app[data-mode="dark"], .darsyar-app[data-theme="dark"], .darsyar-app.dark,
      .darsyar-app[data-mode="dark"] *, .darsyar-app[data-theme="dark"] *, .darsyar-app.dark * { scrollbar-color:rgba(174,184,198,.48) transparent; }
      *::-webkit-scrollbar { width:8px; height:8px; }
      *::-webkit-scrollbar-track { background:transparent; border-radius:999px; }
      *::-webkit-scrollbar-thumb { background-color:rgba(127,139,154,.52); border:2px solid transparent; background-clip:padding-box; border-radius:999px; min-height:28px; }
      *::-webkit-scrollbar-thumb:hover { background-color:rgba(99,102,241,.72); }
      .darsyar-app[data-mode="dark"] *::-webkit-scrollbar-thumb,
      .darsyar-app[data-theme="dark"] *::-webkit-scrollbar-thumb,
      .darsyar-app.dark *::-webkit-scrollbar-thumb { background-color:rgba(174,184,198,.48); }
      .mm-site-icon { width:18px !important; height:18px !important; flex:0 0 18px !important; display:inline-block !important; object-fit:contain !important; vertical-align:middle !important; }
      /* Enlarge only the Darsyar book illustration and keep it inside its parent tile. */
      img.ds-icon.ds-asset-icon[src$="/book.svg"] { width:28px !important; height:28px !important; max-width:100% !important; max-height:100% !important; flex:0 1 28px !important; object-fit:contain !important; }
      /* Theme follows the main MathMate site: black in light mode, white in dark mode. */
      img.mm-site-icon-trash, img[src$="/trash.svg"], img[src$="/download.svg"], img[src$="/upload.svg"] { filter:brightness(0) !important; }
      :host-context(body.dark) img.mm-site-icon-trash,
      :host-context(body.dark) img[src$="/trash.svg"],
      :host-context(body.dark) img[src$="/download.svg"],
      :host-context(body.dark) img[src$="/upload.svg"] { filter:brightness(0) invert(1) !important; }
      /* Use high-contrast monochrome icons consistently in Darsyar light/dark modes. */
      .mm-site-icon-edit { filter:brightness(0) !important; }
      .ds-icon.ds-icon-task, .ds-icon.ds-icon-calendar { color:#111 !important; filter:brightness(0) !important; }
      .darsyar-app[data-mode="dark"] .mm-site-icon-edit,
      .darsyar-app[data-theme="dark"] .mm-site-icon-edit,
      .darsyar-app.dark .mm-site-icon-edit,
      :host([data-mode="dark"]) .mm-site-icon-edit,
      :host(.dark) .mm-site-icon-edit,
      :host-context(body.dark) .mm-site-icon-edit { filter:brightness(0) invert(1) !important; }
      .darsyar-app[data-mode="dark"] .ds-icon.ds-icon-task,
      .darsyar-app[data-mode="dark"] .ds-icon.ds-icon-calendar,
      .darsyar-app[data-theme="dark"] .ds-icon.ds-icon-task,
      .darsyar-app[data-theme="dark"] .ds-icon.ds-icon-calendar,
      .darsyar-app.dark .ds-icon.ds-icon-task,
      .darsyar-app.dark .ds-icon.ds-icon-calendar,
      :host([data-mode="dark"]) .ds-icon.ds-icon-task,
      :host([data-mode="dark"]) .ds-icon.ds-icon-calendar,
      :host(.dark) .ds-icon.ds-icon-task,
      :host(.dark) .ds-icon.ds-icon-calendar,
      :host-context(body.dark) .ds-icon.ds-icon-task,
      :host-context(body.dark) .ds-icon.ds-icon-calendar { color:#fff !important; filter:brightness(0) invert(1) !important; }
      /* The old design-system date footer is not part of the compact calendar UI. */
      .mm-date-picker-footer { display:none !important; }
      .mm-search-results-panel { box-sizing:border-box; display:block; position:fixed !important; inset:auto auto auto auto; left:12px; top:80px; width:min(420px,calc(100vw - 16px)); max-width:calc(100vw - 16px); min-width:0; margin:0; padding:10px; border:1px solid var(--border,rgba(100,116,139,.35)); border-radius:16px; background:#ffffff !important; background-color:#ffffff !important; background-image:none !important; color:var(--text,var(--text-color,#1f2937)); -webkit-backdrop-filter:none !important; backdrop-filter:none !important; opacity:1 !important; box-shadow:0 18px 44px rgba(15,23,42,.22), 0 2px 10px rgba(15,23,42,.1); max-height:min(52vh,420px); overflow:auto; overscroll-behavior:contain; z-index:2147483000; contain:layout paint; }
      .darsyar-app[data-mode="dark"] .mm-search-results-panel, .darsyar-app[data-theme="dark"] .mm-search-results-panel, .darsyar-app.dark .mm-search-results-panel { background:#20202b !important; background-color:#20202b !important; background-image:none !important; color:#f3f4f6 !important; }
      .darsyar-app:not([data-mode="dark"]) .mm-search-results-panel { background:#ffffff !important; background-color:#ffffff !important; background-image:none !important; }
      .mm-search-results-panel[hidden] { display:none !important; }
      .mm-search-results-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 8px 9px; font-size:12px; color:var(--text-light,#64748b); }
      .mm-search-results-head strong { color:var(--text,var(--text-color,#1f2937)); font-size:13px; }
      .mm-search-result { display:flex; flex-direction:column; gap:4px; width:100%; min-width:0; box-sizing:border-box; text-align:right; padding:10px 11px; border:1px solid transparent; border-radius:12px; background:transparent; color:inherit; font:inherit; cursor:default; }
      button.mm-search-result { cursor:pointer; }
      .mm-search-result + .mm-search-result { margin-top:3px; }
      .mm-search-result:hover { background:var(--primary-light,rgba(99,102,241,.08)); border-color:var(--border,rgba(100,116,139,.2)); }
      .mm-search-result-target { outline:2px solid var(--primary-color,#6366f1) !important; outline-offset:3px !important; transition:outline-color .2s ease; }
      .mm-search-result-title { font-size:13px; line-height:1.6; font-weight:800; overflow-wrap:anywhere; }
      .mm-search-result-detail { font-size:11px; line-height:1.7; color:var(--text-light,#64748b); white-space:normal; overflow-wrap:anywhere; }
      .mm-search-result-kind { align-self:flex-start; padding:2px 7px; border-radius:999px; background:var(--primary-light,rgba(99,102,241,.09)); color:var(--primary-color,#6366f1); font-size:10px; font-weight:700; }
      .mm-search-results-empty { margin:0; padding:15px 10px; text-align:center; color:var(--text-light,#64748b); font-size:12px; line-height:1.8; }
      .mm-greeting-feature {
        box-sizing:border-box; width:100%; min-width:0; max-width:none;
        margin:0 0 18px !important; padding:clamp(20px,3vw,34px) !important;
        border-radius:24px !important; min-height:clamp(170px,20vw,250px);
        display:flex; flex-direction:column; justify-content:center;
        gap:10px; overflow-wrap:anywhere;
        background:linear-gradient(130deg,var(--card-bg,#fff),var(--primary-light,rgba(99,102,241,.08))) !important;
        border:1px solid var(--border,rgba(0,0,0,.08)) !important;
        box-shadow:var(--card-shadow,0 12px 32px rgba(0,0,0,.07)) !important;
      }
      .mm-greeting-feature :is(h1,h2,h3) { font-size:clamp(1.35rem,2.4vw,2rem) !important; line-height:1.55 !important; }
      .mm-greeting-feature :is(p,span) { line-height:1.9; }
      .mm-calendar-feature { min-width:0; width:100%; max-width:none; }
      .mm-calendar-feature :is(.calendar-grid,[class*="calendar-grid"],[role="grid"]) { min-width:0; width:100%; }
      @media(max-width:700px) {
        .mm-mobile-search-wrap {
          box-sizing:border-box; width:100% !important; max-width:100% !important;
          min-width:0 !important; display:flex !important; align-items:center; gap:8px;
          max-height:0 !important; height:auto !important; margin-block:0 !important;
          padding-block:0 !important; border-width:0 !important; overflow:hidden !important;
          opacity:0; visibility:hidden; transform:translateY(-7px);
          transition:max-height .24s ease,opacity .18s ease,transform .24s ease,margin .24s ease,padding .24s ease;
        }
        .mm-mobile-search-wrap.mm-mobile-search-open {
          max-height:110px !important; margin-block:8px 12px !important;
          padding:10px !important; border:1px solid var(--border,rgba(0,0,0,.1)) !important;
          border-radius:15px !important; opacity:1; visibility:visible; transform:translateY(0);
        }
        .mm-mobile-search-wrap :is(input,textarea) { flex:1 1 auto; min-width:0; width:100%; max-width:100%; }
        .mm-mobile-search-trigger[aria-expanded="true"] { color:var(--primary-color,var(--primary,#6366f1)); }
        :host { min-width:0; }
        :is(main,[class*="dashboard" i],[class*="page-content" i],[class*="workspace" i]) { min-width:0; max-width:100%; }
        .mm-greeting-feature { border-radius:20px !important; padding:19px !important; min-height:160px; }
      }
      .mm-dashboard-home-icon { width:20px!important; height:20px!important; flex:0 0 20px!important; object-fit:contain; filter:brightness(0)!important; }
      .darsyar-app[data-mode="dark"] .mm-dashboard-home-icon { filter:brightness(0) invert(1)!important; }
      body.dark .mm-dashboard-home-icon { filter:brightness(0) invert(1)!important; }
      .mm-bridge-date-input { cursor:pointer!important; border-radius:14px!important; padding:11px 14px!important; min-height:44px; line-height:1.5; }
      .mm-flexible-study-time { display:grid; gap:6px; margin:8px 0; color:var(--text,var(--text-color,#334155)); font-size:12px; }
      .mm-flexible-study-time input { width:100%; box-sizing:border-box; min-width:0; border-radius:12px; padding:10px 12px; border:1px solid var(--border,rgba(0,0,0,.12)); background:var(--input-bg,rgba(255,255,255,.7)); color:inherit; font:inherit; }
      .mm-study-planner { box-sizing:border-box; grid-column:1/-1; align-self:stretch; width:100%; min-width:0; margin:22px 0; padding:clamp(16px,2.6vw,26px); border:1px solid var(--border,rgba(0,0,0,.09)); border-radius:26px; color:var(--text,#1f2937); background:color-mix(in srgb,var(--card-bg,#fff) 78%,transparent); -webkit-backdrop-filter:blur(18px) saturate(145%); backdrop-filter:blur(18px) saturate(145%); box-shadow:var(--card-shadow,0 12px 32px rgba(0,0,0,.07)); animation:mm-planner-enter .3s cubic-bezier(.2,.8,.2,1) both; }
      .mm-study-planner * { box-sizing:border-box; }
      .mm-planner-head { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:18px; }
      .mm-planner-head h2 { margin:3px 0 6px; font-size:clamp(19px,2vw,26px); line-height:1.5; }
      .mm-planner-head p,.mm-planner-section-title span { margin:0; color:var(--text-light,#64748b); font-size:12px; line-height:1.8; }
      .mm-planner-kicker { color:var(--primary-color,var(--primary,#6366f1)); font-size:11px; font-weight:800; }
      .mm-planner-mark { display:grid; place-items:center; width:46px; height:46px; flex:0 0 46px; border-radius:16px; color:var(--primary-color,#6366f1); background:var(--primary-light,rgba(99,102,241,.12)); font-size:23px; }
      .mm-planner-tabs { display:flex; flex-wrap:wrap; gap:8px; padding:5px; border-radius:16px; background:var(--input-bg,rgba(255,255,255,.42)); margin-bottom:16px; }
      .mm-planner-tabs button,.mm-note-actions button,.mm-item-actions button,.mm-table-action,.mm-secondary-btn,.mm-date-month-nav button { appearance:none; font:inherit; cursor:pointer; border:1px solid var(--border,rgba(0,0,0,.10)); border-radius:12px; padding:9px 13px; color:var(--text,#1f2937); background:var(--card-bg,rgba(255,255,255,.7)); transition:transform .18s ease,background .18s ease,border-color .18s ease; }
      .mm-planner-tabs button:hover,.mm-note-actions button:hover,.mm-item-actions button:hover,.mm-table-action:hover,.mm-secondary-btn:hover { transform:translateY(-1px); }
      .mm-planner-tabs button.active,.mm-primary-btn { color:white!important; background:var(--gradient-hero,linear-gradient(135deg,#6366f1,#8b5cf6))!important; border-color:transparent!important; }
      .mm-planner-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:14px; }
      .mm-planner-stats article,.mm-planner-card { min-width:0; border:1px solid var(--border,rgba(0,0,0,.08)); border-radius:19px; background:color-mix(in srgb,var(--card-bg,#fff) 78%,transparent); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); }
      .mm-planner-stats article { display:grid; gap:6px; padding:15px; }
      .mm-planner-stats article span { color:var(--text-light,#64748b); font-size:12px; }
      .mm-planner-stats article strong { font-size:26px; font-variant-numeric:tabular-nums; }
      .mm-planner-card { padding:16px; margin-top:12px; }
      .mm-planner-section-title { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:13px; }
      .mm-planner-section-title h3 { font-size:15px; margin:0; }
      .mm-planner-chart { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:8px; min-height:140px; align-items:end; padding-top:8px; }
      .mm-chart-column { display:flex; min-width:0; min-height:130px; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; }
      .mm-chart-count { color:var(--text-light,#64748b); font-size:11px; }
      .mm-chart-track { width:min(100%,32px); height:82px; border-radius:10px; display:flex; align-items:flex-end; overflow:hidden; background:var(--input-bg,rgba(99,102,241,.08)); }
      .mm-chart-track i { width:100%; min-height:4px; border-radius:10px; background:var(--gradient-hero,linear-gradient(180deg,#8b5cf6,#6366f1)); transition:height .24s ease; }
      .mm-chart-column small { font-size:10px; color:var(--text-light,#64748b); }
      .mm-planner-table-wrap { width:100%; overflow-x:auto; border-radius:13px; }
      .mm-planner-table { border-collapse:collapse; width:100%; min-width:560px; font-size:12px; }
      .mm-planner-table th,.mm-planner-table td { border-bottom:1px solid var(--border,rgba(0,0,0,.08)); padding:10px 8px; text-align:right; vertical-align:middle; }
      .mm-planner-table th { color:var(--text-light,#64748b); font-weight:700; }
      .mm-planner-table td strong,.mm-planner-table td small { display:block; }
      .mm-planner-table td small { margin-top:3px; color:var(--text-light,#64748b); font-size:10px; }
      .mm-type-pill { display:inline-block; padding:4px 7px; border-radius:999px; font-size:10px; background:var(--primary-light,rgba(99,102,241,.12)); }
      .mm-type-pill.exam { background:rgba(245,158,11,.15); }
      .mm-table-action { padding:5px 8px; font-size:10px; }
      .mm-planner-empty { margin:0; padding:14px; border-radius:13px; color:var(--text-light,#64748b); background:var(--input-bg,rgba(255,255,255,.4)); font-size:12px; line-height:1.9; }
      .mm-planner-form { display:grid; gap:12px; }
      .mm-planner-form label { display:grid; gap:6px; font-size:12px; font-weight:700; }
      .mm-planner-form input,.mm-planner-form textarea { width:100%; min-width:0; border:1px solid var(--border,rgba(0,0,0,.12)); border-radius:12px; padding:11px 12px; color:var(--text,#1f2937); background:var(--input-bg,rgba(255,255,255,.5)); font:inherit; font-weight:400; outline-offset:3px; }
      .mm-planner-form input:focus,.mm-planner-form textarea:focus { outline:2px solid var(--primary-light,rgba(99,102,241,.18)); border-color:var(--primary-color,#6366f1); }
      .mm-planner-form textarea { resize:vertical; line-height:1.8; }
      .mm-form-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .mm-form-actions,.mm-item-actions,.mm-note-actions { display:flex; flex-wrap:wrap; gap:7px; }
      .mm-primary-btn { appearance:none; border:0; border-radius:13px; padding:11px 16px; font:inherit; font-weight:800; cursor:pointer; width:fit-content; }
      .mm-secondary-btn { width:fit-content; }
      .mm-item-actions button,.mm-note-actions button { padding:7px 9px; font-size:11px; }
      .mm-note-actions .danger,.mm-item-actions .danger { color:#b91c1c; }
      .mm-notes-list,.mm-planner-item-list { display:grid; gap:9px; }
      .mm-note-card,.mm-planner-item { display:flex; justify-content:space-between; gap:14px; padding:13px; border:1px solid var(--border,rgba(0,0,0,.08)); border-radius:15px; background:var(--input-bg,rgba(255,255,255,.38)); min-width:0; }
      .mm-note-card>div:first-child,.mm-planner-item-main { min-width:0; flex:1; }
      .mm-note-card h4,.mm-planner-item strong { margin:0 0 5px; font-size:13px; overflow-wrap:anywhere; }
      .mm-note-card p,.mm-planner-item p { margin:0 0 7px; line-height:1.9; font-size:12px; white-space:pre-wrap; overflow-wrap:anywhere; }
      .mm-note-card small,.mm-planner-item small,.mm-planner-item-main span { display:block; color:var(--text-light,#64748b); font-size:10px; line-height:1.8; }
      .mm-planner-item.done { opacity:.68; }
      .mm-planner-item.done strong { text-decoration:line-through; }
      .mm-date-picker-overlay { position:fixed; inset:0; z-index:2147483000; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(15,23,42,.42); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); opacity:0; visibility:hidden; transition:opacity .2s ease,visibility .2s ease; }
      .mm-date-picker-overlay[hidden] { display:none!important; }
      .mm-date-picker-overlay.is-open { opacity:1; visibility:visible; }
      .mm-date-picker-dialog { width:min(100%,420px); max-height:min(90vh,720px); overflow:auto; padding:20px; border:1px solid var(--border,rgba(255,255,255,.35)); border-radius:26px; background:color-mix(in srgb,var(--card-bg,#fff) 86%,transparent); color:var(--text,#1f2937); box-shadow:0 24px 70px rgba(0,0,0,.25); -webkit-backdrop-filter:blur(24px) saturate(150%); backdrop-filter:blur(24px) saturate(150%); transform:translateY(12px) scale(.98); transition:transform .22s cubic-bezier(.2,.8,.2,1); outline:none; }
      .mm-date-picker-overlay.is-open .mm-date-picker-dialog { transform:translateY(0) scale(1); }
      .mm-date-picker-dialog .mm-date-picker-top,
      .mm-date-picker-dialog .mm-date-picker-top > div,
      .mm-date-picker-dialog .mm-date-picker-top h3,
      .mm-date-picker-dialog .mm-date-picker-top p {
        background:transparent !important; border:none !important; box-shadow:none !important;
        -webkit-backdrop-filter:none !important; backdrop-filter:none !important;
      }
      .mm-date-picker-dialog .mm-date-picker-top h3 { padding:0; margin:0 0 6px; }
      .mm-date-picker-dialog .mm-date-picker-top p { padding:0; margin:0; }
      .mm-date-picker-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
      .mm-date-picker-top h3 { margin:0 0 4px; font-size:18px; }
      .mm-date-picker-top p { margin:0; color:var(--text-light,#64748b); font-size:11px; }
      .mm-date-close { width:36px; height:36px; padding:0; border:none; background:transparent; border-radius:10px; cursor:pointer; color:inherit; display:flex; align-items:center; justify-content:center; transition:transform .35s cubic-bezier(.4,0,.2,1), background .2s ease; }
      .mm-date-close img, .mm-date-close svg { width:20px; height:20px; display:block; pointer-events:none; }
      /* The close asset is an image, so explicitly recolor it for both color schemes. */
      .mm-date-close img { filter:brightness(0) !important; }
      .darsyar-app[data-mode="dark"] .mm-date-close img,
      .darsyar-app[data-theme="dark"] .mm-date-close img,
      .darsyar-app.dark .mm-date-close img,
      :host([data-mode="dark"]) .mm-date-close img,
      :host(.dark) .mm-date-close img,
      :host-context(body.dark) .mm-date-close img { filter:brightness(0) invert(1) !important; }
      .mm-date-close:hover { background:rgba(0,0,0,.06); transform:rotate(90deg); }
      .darsyar-app[data-mode="dark"] .mm-date-close:hover,
      .darsyar-app[data-theme="dark"] .mm-date-close:hover { background:rgba(255,255,255,.08); }
      .mm-date-picker-top { background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; }
      .mm-date-picker-top > div { background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; }
      .mm-date-month-nav { display:grid; grid-template-columns:40px 1fr 40px; align-items:center; gap:10px; margin-bottom:14px; text-align:center; }
      .mm-date-month-nav button { width:38px; height:38px; padding:0; font-size:22px; border:1px solid var(--border,rgba(0,0,0,.1)); border-radius:11px; background:var(--input-bg,rgba(255,255,255,.45)); color:inherit; cursor:pointer; }
      .mm-date-month-nav strong { font-size:14px; font-weight:800; padding:0 6px; }
      .mm-date-weekdays,.mm-date-days { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px; }
      .mm-date-weekdays { margin-bottom:8px; }
      .mm-date-weekdays span { display:grid; place-items:center; color:var(--text-light,#64748b); min-height:28px; font-size:11px; font-weight:700; }
      .mm-date-day,.mm-date-empty { min-width:0; aspect-ratio:1; display:grid; place-items:center; border-radius:11px; }
      .mm-date-day { border:1px solid transparent; background:var(--input-bg,rgba(255,255,255,.45)); color:inherit; font:inherit; font-size:12px; cursor:pointer; transition:transform .16s ease,background .16s ease; }
      .mm-date-day:hover { transform:translateY(-1px); border-color:var(--primary-color,#6366f1); }
      .mm-date-day.selected { background:var(--gradient-hero,linear-gradient(135deg,#6366f1,#8b5cf6)); color:#fff; }
      .mm-date-day.today:not(.selected) { border-color:var(--primary-color,#6366f1); font-weight:800; }
      .mm-date-today {
        appearance:none !important;
        display:flex !important; align-items:center; justify-content:center;
        box-sizing:border-box; width:auto !important; min-width:124px; max-width:100%; min-height:42px;
        margin:16px auto 0 !important; padding:10px 22px !important;
        font-family:"Arad",sans-serif !important;
        font-size:13px !important; font-weight:800 !important; line-height:1.45;
        color:var(--primary-color,#6366f1) !important;
        background:var(--primary-light,rgba(99,102,241,.10)) !important;
        border:1px solid var(--primary-color,#6366f1) !important;
        border-radius:999px !important;
        box-shadow:none !important; cursor:pointer;
        text-align:center; white-space:nowrap;
        -webkit-backdrop-filter:none !important; backdrop-filter:none !important;
        transition:background-color .18s ease, border-color .18s ease, opacity .18s ease;
      }
      .mm-date-today:hover { background:var(--primary-light,rgba(99,102,241,.16)) !important; border-radius:999px !important; filter:none; opacity:.9; transform:none; }
      .mm-date-today:focus-visible { outline:2px solid var(--primary-color,#6366f1); outline-offset:3px; }
      .mm-bridge-date-input { cursor:pointer!important; border-radius:14px!important; padding:11px 14px!important; min-height:44px; line-height:1.5; }
      :is([role="dialog"],[class*="date-picker" i],[class*="datepicker" i],[class*="date-modal" i],[class*="calendar-modal" i],[role="listbox"]) { border-radius:22px; -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px); }
      :is(section,article,[class*="card" i],[class*="panel" i],[class*="section" i]) { border-radius:20px; background-color:color-mix(in srgb,var(--card-bg,#fff) 76%,transparent); border-color:var(--border,rgba(255,255,255,.26)); -webkit-backdrop-filter:blur(14px) saturate(135%); backdrop-filter:blur(14px) saturate(135%); transition:background-color .22s ease,border-color .22s ease,box-shadow .22s ease,opacity .24s ease,transform .24s ease; }
      :is([role="dialog"],[class*="modal" i],[class*="dropdown" i],[class*="popover" i],[role="listbox"]) { border-radius:22px!important; -webkit-backdrop-filter:blur(18px) saturate(140%); backdrop-filter:blur(18px) saturate(140%); }
      :is([role="dialog"],[class*="modal" i].open,[class*="modal" i].show,[class*="dropdown" i].open,[class*="popover" i].open) { animation:mm-overlay-enter .24s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes mm-overlay-enter { from { opacity:0; transform:translateY(7px) scale(.99); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes mm-planner-enter { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
      @media(max-width:700px) { .mm-study-planner { padding:15px; border-radius:20px; } .mm-planner-stats { grid-template-columns:1fr; } .mm-planner-stats article { grid-template-columns:1fr auto; align-items:center; } .mm-planner-stats article strong { font-size:22px; } .mm-planner-card { padding:12px; } .mm-form-two { grid-template-columns:1fr; } .mm-note-card,.mm-planner-item { flex-direction:column; } .mm-note-actions,.mm-item-actions { justify-content:flex-start; } .mm-date-picker-dialog { padding:15px; border-radius:21px; } }
      @media(prefers-reduced-motion:reduce) { .mm-mobile-search-wrap,.mm-greeting-feature,.mm-study-planner,.mm-date-picker-overlay,.mm-date-picker-dialog,.mm-date-day,:is([role="dialog"],[class*="modal" i].open,[class*="modal" i].show,[class*="dropdown" i].open,[class*="popover" i].open) { transition:none!important; animation:none!important; } }
    `;

    function nodeText(el) {
        return `${el?.textContent || ''}`.replace(/\s+/g, ' ').trim();
    }
    function replaceDarsyarIcons(root) {
        if (!root || !root.querySelectorAll) return;
        const replace = (selector, path, kind) => {
            root.querySelectorAll(selector).forEach(icon => {
                if (icon.matches('img[data-mm-asset-icon="' + kind + '"]')) return;
                const image = document.createElement('img');
                image.src = path;
                image.alt = '';
                image.setAttribute('aria-hidden', 'true');
                image.dataset.mmAssetIcon = kind;
                image.className = 'mm-site-icon mm-site-icon-' + kind;
                icon.replaceWith(image);
            });
        };
        // Trash / edit actions use assets icons; keep generic note icons as note.svg.
        replace('.ds-icon.ds-icon-trash', 'assets/icons/trash.svg', 'trash');
        replace('.ds-icon.ds-icon-edit, [data-action="edit-note"] .ds-icon, [data-action="edit-note"] img', 'assets/icons/edit.svg', 'edit');
        replace('.ds-icon.ds-icon-note', 'assets/icons/note.svg', 'note');
    }

    function findGreeting(root) {
        const patterns = [
            /عصر\s*بخیر/, /فرصت تازه.*یادگیری/, /دوست من/,
            /good evening/, /fresh opportunity.*learn/, /friend/
        ];
        const all = [...root.querySelectorAll('*')];
        return all.find(el => {
            if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return false;
            const text = nodeText(el).toLowerCase();
            return text && text.length < 420 && patterns.some(pattern => pattern.test(text)) &&
                ![...el.children].some(child => patterns.some(pattern => pattern.test(nodeText(child).toLowerCase())));
        }) || null;
    }
    function findCalendar(root) {
        const candidates = [...root.querySelectorAll('[id*="calendar" i],[class*="calendar" i],[data-view*="calendar" i],[aria-label*="تقویم"],[aria-label*="calendar" i]')];
        if (!candidates.length) return null;
        // Prefer a true outer calendar panel over an individual day/cell.
        return candidates.find(el => /calendar|تقویم/i.test(`${el.id} ${el.className} ${el.getAttribute('data-view') || ''}`) &&
            (el.matches('section,article,[class*="card" i],[class*="panel" i],[class*="section" i]') || el.children.length > 2)) || candidates[0];
    }
    function markGreetingAndCalendar(root) {
        const greetingText = findGreeting(root);
        const calendar = findCalendar(root);
        if (!greetingText || !calendar) return;
        let greeting = greetingText;
        for (let i = 0; i < 4 && greeting.parentElement && greeting.parentElement !== root; i++) {
            const parent = greeting.parentElement;
            if (/(welcome|greet|hero|motivat|daily|quote|intro|welcome|سلام|خوش.?آمد)/i.test(`${parent.id} ${parent.className}`)) { greeting = parent; break; }
            if (parent.children.length > 5) break;
            greeting = parent;
        }
        let calendarPanel = calendar;
        for (let i = 0; i < 3 && calendarPanel.parentElement && calendarPanel.parentElement !== root; i++) {
            const parent = calendarPanel.parentElement;
            if (/(calendar.*(card|panel|section)|((card|panel|section).*calendar)|تقویم)/i.test(`${parent.id} ${parent.className}`)) { calendarPanel = parent; break; }
            if (parent.children.length > 5) break;
            calendarPanel = parent;
        }
        // Never style/reorder a broad container that also contains the calendar.
        if (greeting.contains(calendarPanel)) {
            let safeGreeting = greetingText;
            while (safeGreeting.parentElement && safeGreeting.parentElement !== root && !safeGreeting.parentElement.contains(calendarPanel)) {
                safeGreeting = safeGreeting.parentElement;
            }
            greeting = safeGreeting;
        }
        if (calendarPanel.contains(greeting)) return;
        greeting.classList.add('mm-greeting-feature');
        calendarPanel.classList.add('mm-calendar-feature');
        if (greeting !== calendarPanel && calendarPanel.parentElement && greeting.parentElement === calendarPanel.parentElement) {
            calendarPanel.parentElement.insertBefore(greeting, calendarPanel);
        } else if (greeting !== calendarPanel) {
            // Reorder only when both pieces belong to a compact common layout container.
            let common = greeting.parentElement;
            while (common && common !== root && !common.contains(calendarPanel)) common = common.parentElement;
            if (common && common !== root && common.contains(greeting) && common.contains(calendarPanel) && common.children.length <= 8) {
                const directChild = node => {
                    let branch = node;
                    while (branch && branch.parentElement && branch.parentElement !== common) branch = branch.parentElement;
                    return branch && branch.parentElement === common ? branch : null;
                };
                const greetingBranch = directChild(greeting);
                const calendarBranch = directChild(calendarPanel);
                if (greetingBranch && calendarBranch && greetingBranch !== calendarBranch) common.insertBefore(greetingBranch, calendarBranch);
            }
        }
    }
    function setupMobileSearch(root) {
        const isMobile = () => window.matchMedia('(max-width: 700px)').matches;
        const inputs = [...root.querySelectorAll('input,textarea')].filter(input => {
            const clue = `${input.type || ''} ${input.placeholder || ''} ${input.getAttribute('aria-label') || ''} ${input.title || ''} ${input.name || ''} ${input.id || ''} ${input.className || ''}`;
            return /search|جست.?جو|جستجو|جست.?وجو/i.test(clue) || input.type === 'search';
        });
        const buttons = [...root.querySelectorAll('button,[role="button"],a[aria-label],a[title]')].filter(button => {
            const icon = button.querySelector('svg,img,[data-icon]');
            const clue = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.title || ''} ${button.id || ''} ${button.className || ''} ${icon?.getAttribute('aria-label') || ''} ${icon?.getAttribute('data-lucide') || ''} ${icon?.getAttribute('data-icon') || ''} ${icon?.getAttribute('class') || ''} ${icon?.getAttribute('src') || ''} ${button.querySelector('img')?.alt || ''}`;
            const hasSearchGlyph = Boolean(button.querySelector('svg[data-lucide="search"],svg[class*="search" i],img[src*="search" i],[data-icon="search"]'));
            return hasSearchGlyph || /search|جست.?جو|جستجو|جست.?وجو|search-toggle|mobile-search/i.test(clue);
        });
        if (!inputs.length || !buttons.length) return;
        inputs.forEach(input => {
            if (input.dataset.mmSearchReady === '1') return;
            // Prefer a search form/wrapper, otherwise the nearest small parent.
            let wrapper = input.closest('form,[class*="search-wrap" i],[class*="search-box" i],[class*="search-container" i],[class*="search-field" i],[class*="searchbar" i]') || input.parentElement;
            if (!wrapper || wrapper === root) return;
            if (wrapper.parentElement && wrapper.children.length <= 1 && wrapper.parentElement.matches('form,[class*="search" i]')) wrapper = wrapper.parentElement;
            wrapper.classList.add('mm-mobile-search-wrap');
            wrapper.dataset.mmSearchReady = '1';
            input.dataset.mmSearchReady = '1';
            const trigger = buttons.find(button => {
                if (button === input || wrapper.contains(button)) return false;
                const context = button.closest('header,nav,[class*="topbar" i],[class*="toolbar" i],[class*="header" i],[class*="search" i]');
                const inputContext = input.closest('header,nav,[class*="topbar" i],[class*="toolbar" i],[class*="header" i],[class*="search" i]');
                return context && inputContext ? context === inputContext : button.parentElement === wrapper.parentElement;
            }) || buttons[0];
            if (trigger && trigger.dataset.mmSearchTrigger !== '1') {
                trigger.classList.add('mm-mobile-search-trigger');
                trigger.dataset.mmSearchTrigger = '1';
                trigger.setAttribute('aria-expanded', 'false');
                trigger.addEventListener('click', () => {
                    if (!isMobile()) return;
                    // Let the app's original click handler run; then keep the field's state in sync.
                    window.requestAnimationFrame(() => {
                        wrapper.classList.add('mm-mobile-search-open');
                        trigger.setAttribute('aria-expanded', 'true');
                        input.focus({ preventScroll: true });
                    });
                });
            }
            wrapper.dataset.mmSearchTriggerId = trigger?.id || '';
        });
        const closeSearch = event => {
            if (!isMobile()) return;
            const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
            root.querySelectorAll('.mm-mobile-search-wrap.mm-mobile-search-open').forEach(wrapper => {
                const trigger = buttons.find(button => button.dataset.mmSearchTrigger === '1' &&
                    (wrapper.dataset.mmSearchTriggerId ? button.id === wrapper.dataset.mmSearchTriggerId : true));
                const resultPanel = wrapper.nextElementSibling?.matches?.('.mm-search-results-panel') ? wrapper.nextElementSibling : null;
                if (path.includes(wrapper) || (trigger && path.includes(trigger)) || (resultPanel && path.includes(resultPanel))) return;
                if (event?.type === 'keydown' && event.key !== 'Escape') return;
                wrapper.classList.remove('mm-mobile-search-open');
                if (resultPanel) resultPanel.hidden = true;
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
        };
        if (!root.__mmSearchCloseWired) {
            root.__mmSearchCloseWired = true;
            root.addEventListener('pointerdown', event => closeSearch(event), true);
            root.addEventListener('keydown', event => { if (event.key === 'Escape') closeSearch(event); }, true);
            document.addEventListener('pointerdown', event => {
                if (!mount.contains(event.target) && !event.composedPath().includes(mount)) {
                    root.querySelectorAll('.mm-mobile-search-wrap.mm-mobile-search-open').forEach(wrapper => {
                        wrapper.classList.remove('mm-mobile-search-open');
                        buttons.filter(b => b.dataset.mmSearchTrigger === '1').forEach(b => b.setAttribute('aria-expanded', 'false'));
                    });
                }
            }, true);
        }
    }
    function inferDarsyarSearchCategory(hint) {
        const text = normalizeSearchText(hint);
        if (/(note|notes|یادداشت)/i.test(text)) return 'یادداشت';
        if (/(exam|test|امتحان|آزمون)/i.test(text)) return 'امتحان';
        if (/(task|homework|assignment|تکلیف|وظیفه)/i.test(text)) return 'تکلیف';
        if (/(class|lesson|course|subject|کلاس|درس|موضوع)/i.test(text)) return 'کلاس و درس';
        if (/(focus|pomodoro|concentration|تمرکز)/i.test(text)) return 'تمرکز';
        if (/(schedule|planner|calendar|program|برنامه)/i.test(text)) return 'برنامه';
        return '';
    }
    function searchTermsFromObject(object) {
        const entries = Object.entries(object || {}).filter(([, value]) => typeof value === 'string' || typeof value === 'number');
        const titleEntry = entries.find(([key, value]) => typeof value === 'string' && /(^(title|name|label|heading|topic|subject|taskname|examname|notetitle|classname|lessonname)$|عنوان|نام|موضوع)/i.test(key));
        const detailEntries = entries.filter(([key]) => /(body|content|description|details|text|note|memo|topic|title|name|subject|label|lesson|class|date|time|deadline|due|عنوان|متن|توضیح|درس|یادداشت|تاریخ|موعد)/i.test(key));
        const allText = entries.map(([key, value]) => `${key}: ${value}`).join(' ');
        const title = String(titleEntry?.[1] ?? entries.find(([key, value]) => typeof value === 'string' && !/^(id|uuid|key|color|theme|mode|status)$/i.test(key))?.[1] ?? '').trim();
        const detail = detailEntries.map(([, value]) => String(value)).filter(value => value && value !== title).join(' · ').slice(0, 320);
        return { title: title.slice(0, 180), detail, allText };
    }
    function collectStoredDarsyarSearchRecords(query) {
        const records = [];
        const seen = new Set();
        const q = normalizeSearchText(query);
        const add = record => {
            const title = String(record.title || '').trim();
            const detail = String(record.detail || '').trim();
            if (!title && !detail) return;
            if (!normalizeSearchText(`${title} ${detail} ${record.searchText || ''}`).includes(q)) return;
            const signature = `${record.category}|${normalizeSearchText(title)}|${normalizeSearchText(detail).slice(0,100)}`;
            if (seen.has(signature)) return;
            seen.add(signature);
            records.push({ ...record, title: title || 'مورد ذخیره‌شده', detail });
        };
        const shouldInspectRawKey = key => /(darsyar|task|homework|assignment|exam|note|class|lesson|focus|study|schedule|planner|calendar|تمرکز|تکلیف|امتحان|یادداشت|کلاس|درس|برنامه)/i.test(key);
        const walk = (value, hint, path, depth) => {
            if (depth > 8 || value == null) return;
            if (Array.isArray(value)) {
                value.forEach((item, index) => walk(item, hint, `${path}[${index}]`, depth + 1));
                return;
            }
            if (typeof value !== 'object') return;
            const objectHint = `${hint} ${value.type || ''} ${value.kind || ''} ${value.category || ''} ${value.entityType || ''} ${value.module || ''}`;
            const category = inferDarsyarSearchCategory(objectHint);
            if (category) {
                const parts = searchTermsFromObject(value);
                add({ category, title: parts.title, detail: parts.detail, searchText: parts.allText, source: 'storage', path });
            }
            Object.entries(value).forEach(([key, child]) => {
                if (child && typeof child === 'object') walk(child, `${objectHint} ${key}`, `${path}.${key}`, depth + 1);
            });
        };
        try {
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (!key) continue;
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                try { walk(JSON.parse(raw), key, key, 0); }
                catch (_) { if (shouldInspectRawKey(key) && normalizeSearchText(raw).includes(q)) add({ category: inferDarsyarSearchCategory(key) || 'درس‌یار', title: key, detail: raw.slice(0,240), source: 'storage', path: key }); }
            }
        } catch (_) { /* Still search what is currently rendered in the workspace. */ }
        try {
            for (let i = 0; i < sessionStorage.length; i += 1) {
                const key = sessionStorage.key(i);
                if (!key) continue;
                const raw = sessionStorage.getItem(key);
                if (!raw) continue;
                try { walk(JSON.parse(raw), key, `session:${key}`, 0); } catch (_) { /* Ignore opaque session values. */ }
            }
        } catch (_) { /* Session storage may be blocked. */ }
        return records;
    }
    function collectRenderedDarsyarSearchRecords(root, query) {
        const q = normalizeSearchText(query);
        const candidates = [...root.querySelectorAll('article,li,tr,[role="listitem"],[class*="task" i],[class*="note" i],[class*="exam" i],[class*="class" i],[class*="lesson" i],[class*="focus" i],[data-type]')];
        const records = [];
        const seen = new Set();
        candidates.forEach(el => {
            if (el.closest('.mm-search-results-panel') || el.matches('input,textarea,button,select') || !el.getClientRects().length) return;
            const text = String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (text.length < 3 || text.length > 900 || !normalizeSearchText(text).includes(q)) return;
            // Avoid large wrappers that duplicate every child result.
            if ([...el.children].some(child => child.matches?.('article,li,tr,[role="listitem"],[class*="task" i],[class*="note" i],[class*="exam" i]'))) return;
            const hint = `${el.className || ''} ${el.id || ''} ${el.getAttribute('data-type') || ''} ${el.getAttribute('aria-label') || ''} ${text.slice(0,160)}`;
            const category = inferDarsyarSearchCategory(hint) || 'درس‌یار';
            const heading = el.querySelector('h1,h2,h3,h4,strong,[class*="title" i]');
            const title = String(heading?.textContent || text.split(/\s+[·|—-]\s+/)[0] || text).trim().slice(0,180);
            const detail = text === title ? '' : text.slice(0,320);
            const signature = `${category}|${normalizeSearchText(title)}|${normalizeSearchText(detail).slice(0,100)}`;
            if (seen.has(signature)) return;
            seen.add(signature);
            records.push({ category, title, detail, source: 'dom', element: el });
        });
        return records;
    }
    function positionDarsyarSearchPanel(input, panel) {
        if (!input?.isConnected || !panel || panel.hidden) return;

        // In flex layouts the input can shrink to its intrinsic width. Prefer the
        // visible search wrapper when it is wider than the input element itself.
        const inputRect = input.getBoundingClientRect();
        const fieldWrap = input.closest('.ds-search-wrap, [class*="search-wrap" i], [class*="search-field" i]');
        const wrapRect = fieldWrap?.getBoundingClientRect?.();
        const anchorRect = wrapRect && wrapRect.width > inputRect.width ? wrapRect : inputRect;

        const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1024);
        const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 768);
        const width = Math.max(1, Math.min(anchorRect.width, viewportWidth - 16));
        const left = Math.max(8, Math.min(anchorRect.left, viewportWidth - width - 8));
        const top = Math.max(0, Math.round(anchorRect.bottom + 6));
        const maxHeight = Math.max(60, Math.min(420, viewportHeight - top - 8));
        const darsyarApp = input.closest('.darsyar-app');
        const isDark = darsyarApp?.dataset.mode === 'dark' || darsyarApp?.dataset.theme === 'dark' ||
            darsyarApp?.classList.contains('dark') || document.body.classList.contains('dark');
        const solidBackground = isDark ? '#20202b' : '#ffffff';

        panel.style.position = 'fixed';
        panel.style.boxSizing = 'border-box';
        panel.style.width = `${Math.round(width)}px`;
        panel.style.minWidth = `${Math.round(width)}px`;
        panel.style.maxWidth = `${Math.round(width)}px`;
        panel.style.left = `${Math.round(left)}px`;
        panel.style.right = 'auto';
        panel.style.top = `${top}px`;
        panel.style.bottom = 'auto';
        panel.style.transform = 'none';
        panel.style.margin = '0';
        panel.style.maxHeight = `${maxHeight}px`;
        panel.style.overflowY = 'auto';
        panel.style.overflowX = 'hidden';
        panel.style.setProperty('background', solidBackground, 'important');
        panel.style.setProperty('background-color', solidBackground, 'important');
        panel.style.setProperty('background-image', 'none', 'important');
        panel.style.setProperty('opacity', '1', 'important');
        panel.style.setProperty('backdrop-filter', 'none', 'important');
        panel.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        panel.style.zIndex = '2147483000';
        panel.dir = darsyarApp?.dir || document.documentElement.dir || 'rtl';
    }

    function darsyarSearchCategoryNavPattern(category) {
        if (/یادداشت|note/i.test(category || '')) return /^(?:یادداشت(?:‌ها| ها)?|notes?)$/i;
        if (/تکلیف|وظیفه|homework|assignment|task/i.test(category || '')) return /^(?:تکلیف(?:‌ها| ها)?|تکالیف|وظایف|کارها|tasks?|homework|assignments?)$/i;
        if (/امتحان|آزمون|exam|test/i.test(category || '')) return /^(?:امتحان(?:‌ها| ها)?|آزمون(?:‌ها| ها)?|exams?|tests?)$/i;
        if (/کلاس|درس|class|lesson|course|subject/i.test(category || '')) return /^(?:کلاس(?:‌ها| ها)?|درس(?:‌ها| ها)?|کلاس و درس|classes|lessons?|courses?|subjects?)$/i;
        if (/تمرکز|focus|pomodoro/i.test(category || '')) return /^(?:تمرکز|focus|pomodoro)$/i;
        if (/برنامه|تقویم|schedule|planner|calendar/i.test(category || '')) return /^(?:برنامه(?:‌ها| ها)?|تقویم|برنامه‌ریزی|planner|schedule|calendar)$/i;
        return null;
    }
    function focusDarsyarSearchRecord(root, record) {
        if (!root || !record) return;
        const title = normalizeSearchText(record.title || '');
        if (!title) return;
        const candidates = [...root.querySelectorAll('article,li,tr,[role="listitem"],[class*="task" i],[class*="note" i],[class*="exam" i],[class*="class" i],[class*="lesson" i],[class*="focus" i]')]
            .filter(el => !el.closest('.mm-search-results-panel') && el.getClientRects().length)
            .map(el => ({ el, text: normalizeSearchText(el.innerText || el.textContent || '') }))
            .filter(item => item.text.includes(title));
        const target = candidates
            .filter(item => !candidates.some(other => other.el !== item.el && item.el.contains(other.el) && other.text.includes(title)))
            .sort((a,b) => a.text.length - b.text.length)[0]?.el;
        if (!target) return false;
        target.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus?.({ preventScroll: true });
        target.classList.add('mm-search-result-target');
        window.setTimeout(() => target.classList.remove('mm-search-result-target'), 1600);
        return true;
    }
    function activateDarsyarSearchResult(root, record) {
        if (!record) return;
        if (record.element?.isConnected) {
            record.element.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            if (!record.element.hasAttribute('tabindex')) record.element.setAttribute('tabindex', '-1');
            record.element.focus?.({ preventScroll: true });
            record.element.classList.add('mm-search-result-target');
            window.setTimeout(() => record.element?.classList?.remove('mm-search-result-target'), 1600);
            return;
        }
        const pattern = darsyarSearchCategoryNavPattern(record.category);
        if (!pattern) return;
        // Find only actual navigation controls; don't click result cards or ordinary buttons.
        const nav = [...root.querySelectorAll('button,a,[role="tab"],[role="navigation"] a,[role="button"],[data-tab],[data-view]')]
            .filter(el => !el.closest('.mm-search-results-panel') && el.getClientRects().length)
            .find(el => {
                const labels = [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent,
                    el.getAttribute('data-tab'), el.getAttribute('data-view')]
                    .filter(Boolean).map(value => String(value).replace(/\s+/g,' ').trim());
                return labels.some(label => pattern.test(label));
            });
        if (nav) nav.click();
        // The app may render each category asynchronously after navigation; retry briefly
        // without altering or deleting any saved data.
        let attempts = 0;
        const seek = () => {
            if (focusDarsyarSearchRecord(root, record)) return;
            attempts += 1;
            if (attempts < 8) window.setTimeout(seek, 120);
        };
        window.requestAnimationFrame(() => window.setTimeout(seek, 80));
    }
    function setupDarsyarSearch(root) {
        if (!root || !root.querySelectorAll) return;
        const inputs = [...root.querySelectorAll('input,textarea')].filter(input => {
            const clue = `${input.type || ''} ${input.placeholder || ''} ${input.getAttribute('aria-label') || ''} ${input.title || ''} ${input.name || ''} ${input.id || ''} ${input.className || ''}`;
            return /search|جست.?جو|جستجو|جست.?وجو/i.test(clue) || input.type === 'search';
        });
        inputs.forEach(input => {
            if (input.dataset.mmDarsyarSearchResultsReady === '1') return;
            const wrapper = input.closest('[class*="search-wrap" i],[class*="search-box" i],[class*="search-container" i],[class*="search-field" i],[class*="searchbar" i],form') || input.parentElement;
            if (!wrapper?.parentElement) return;
            const panel = document.createElement('section');
            panel.className = 'mm-search-results-panel';
            panel.id = `mm-darsyar-search-results-${(root.__mmSearchIdCounter = (root.__mmSearchIdCounter || 0) + 1)}`;
            panel.hidden = true;
            panel.setAttribute('aria-live', 'polite');
            panel.setAttribute('aria-label', 'نتایج جست‌وجوی درس‌یار');
            panel.__mmSearchInput = input;
            wrapper.insertAdjacentElement('afterend', panel);
            input.dataset.mmDarsyarSearchResultsReady = '1';
            input.setAttribute('aria-controls', panel.id);
            const updateResults = () => renderDarsyarSearchResults(root, input, panel);
            input.addEventListener('focus', () => { if (!panel.hidden) positionDarsyarSearchPanel(input, panel); });
            input.addEventListener('input', updateResults);
            input.addEventListener('search', updateResults);
            input.addEventListener('keyup', updateResults);
            input.addEventListener('change', updateResults);
            input.addEventListener('keydown', event => {
                if (event.key === 'Escape') panel.hidden = true;
                if (event.key === 'Enter' && !panel.hidden) {
                    const first = panel.querySelector('button.mm-search-result');
                    if (first) { event.preventDefault(); first.click(); }
                }
            });
            panel.addEventListener('click', event => {
                const result = event.target.closest('[data-mm-search-result-index]');
                if (!result) return;
                const record = panel.__mmSearchResults?.[Number(result.dataset.mmSearchResultIndex)];
                if (!record) return;
                panel.hidden = true;
                if (root.querySelector('.darsyar-app') && record.typeKey) activateActualDarsyarSearchResult(root, input, record);
                else activateDarsyarSearchResult(root, record);
            });
        });
        if (!root.__mmSearchPanelPositionWired) {
            root.__mmSearchPanelPositionWired = true;
            const reposition = () => root.querySelectorAll('.mm-search-results-panel:not([hidden])').forEach(panel => positionDarsyarSearchPanel(panel.__mmSearchInput, panel));
            root.addEventListener('scroll', reposition, true);
            window.addEventListener('scroll', reposition, true);
            window.addEventListener('resize', reposition, { passive:true });
            window.addEventListener('mathmate:settings-changed', reposition);
            window.addEventListener('mathmate:host-settings', reposition);
        }
        if (!root.__mmSearchPanelCloseWired) {
            root.__mmSearchPanelCloseWired = true;
            root.addEventListener('pointerdown', event => {
                const path = event.composedPath?.() || [];
                root.querySelectorAll('.mm-search-results-panel:not([hidden])').forEach(panel => {
                    const input = panel.previousElementSibling?.querySelector?.('input,textarea');
                    if (path.includes(panel) || (input && path.includes(input))) return;
                    panel.hidden = true;
                });
            }, true);
        }
    }
    function collectActualDarsyarSearchRecords(query) {
        const q=normalizeSearchText(query), records=[];
        const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value==null?fallback:value;}catch(_){return fallback;}};
        const tasksRaw=readJson('mathmateDarsyarTasks',[]);
        const tasks=Array.isArray(tasksRaw)?tasksRaw:[];
        tasks.forEach((task,index)=>{
            if (!task || typeof task!=='object') return;
            const title=String(task.title||'').trim(); if(!title)return;
            const subject=String(task.subject||'').trim();
            const due=String(task.dueDate||'').trim();
            const detail=[subject,due,task.done?'done':'pending'].filter(Boolean).join(' · ');
            if(!normalizeSearchText(`${title} ${detail}`).includes(q))return;
            records.push({typeKey:'task',id:String(task.id||`legacy-task-${index}`),category:document.documentElement.lang==='en'?'Task':'تکلیف',title,detail,source:'storage'});
        });
        const notesRaw=readJson('mathmateDarsyarNotesList',null);
        const notes=Array.isArray(notesRaw)?notesRaw:[];
        notes.forEach((note,index)=>{
            if(!note || typeof note!=='object')return;
            const title=String(note.title||'').trim(), body=String(note.body||'').trim(); if(!title&&!body)return;
            if(!normalizeSearchText(`${title} ${body}`).includes(q))return;
            records.push({typeKey:'note',id:String(note.id||`legacy-note-${index}`),category:document.documentElement.lang==='en'?'Note':'یادداشت',title:title|| (document.documentElement.lang==='en'?'Untitled note':'یادداشت بدون عنوان'),detail:body,source:'storage'});
        });
        if(!Array.isArray(notesRaw)) {
            const legacy=String(localStorage.getItem('mathmateDarsyarNotes')||'').trim();
            if(legacy && normalizeSearchText(legacy).includes(q)) records.push({typeKey:'note',id:'legacy-1',category:document.documentElement.lang==='en'?'Note':'یادداشت',title:document.documentElement.lang==='en'?'My note':'یادداشت من',detail:legacy,source:'storage'});
        }
        // Stable IDs are the identity key: same-title independent tasks/notes remain distinct.
        const unique=new Map();
        records.forEach(record=>{const key=`${record.typeKey}:${record.id}`;if(!unique.has(key))unique.set(key,record);});
        return [...unique.values()];
    }
    function activateActualDarsyarSearchResult(root, input, record) {
        const app=root.querySelector('.darsyar-app');
        if(!app)return;
        const inputElement=input;
        if(inputElement){inputElement.value='';inputElement.dispatchEvent(new Event('input',{bubbles:true,composed:true}));}
        const view=record.typeKey==='note'?'notes':'tasks';
        const tab=root.querySelector(`.ds-tab[data-view="${view}"]`);
        if(tab)tab.click();
        const findTarget=()=>{
            const activePanel=root.querySelector(`.ds-panel[data-panel="${view}"]`);
            if(!activePanel)return null;
            const selector=record.typeKey==='note'?'article[data-note-id]':'article[data-task-id]';
            return [...activePanel.querySelectorAll(selector)].find(el=>el.dataset[record.typeKey==='note'?'noteId':'taskId']===record.id && el.getClientRects().length) || null;
        };
        let attempts=0;
        const seek=()=>{
            const target=findTarget();
            if(target){target.scrollIntoView?.({behavior:'smooth',block:'center',inline:'nearest'});if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus?.({preventScroll:true});target.classList.add('mm-search-result-target');window.setTimeout(()=>target.classList.remove('mm-search-result-target'),1800);return;}
            attempts++;
            if(attempts<5){window.setTimeout(seek,100);return;}
            const toast=root.querySelector('#dsToast');
            if(toast){toast.textContent=document.documentElement.lang==='en'?'This saved item is no longer available.':'این مورد دیگر در دسترس نیست.';toast.hidden=false;window.setTimeout(()=>{toast.hidden=true;},2600);}
        };
        requestAnimationFrame(()=>window.setTimeout(seek,60));
    }
    function renderDarsyarSearchResults(root, input, panel) {
        const query = String(input.value || '').trim();
        panel.replaceChildren();
        if (query.length < 2) {
            panel.hidden = !query;
            if (query) {
                const hint = document.createElement('p'); hint.className = 'mm-search-results-empty';
                hint.textContent = document.documentElement.lang==='en' ? 'Enter at least two characters to search.' : 'برای جست‌وجوی دقیق‌تر دست‌کم دو نویسه وارد کن.';
                panel.appendChild(hint);
                panel.hidden = false;
                positionDarsyarSearchPanel(input, panel);
            }
            panel.__mmSearchResults = [];
            return;
        }
        const actualApp=Boolean(root.querySelector('.darsyar-app'));
        const records=actualApp ? collectActualDarsyarSearchRecords(query) : (()=>{
            const fromStorage=collectStoredDarsyarSearchRecords(query), fromDom=collectRenderedDarsyarSearchRecords(root,query), merged=[], seen=new Set();
            [...fromDom,...fromStorage].forEach(record=>{
                const stableId=record.id || record.recordId || '';
                const signature=stableId ? `${record.category}:${stableId}` : `${record.category}|${normalizeSearchText(record.title)}|${normalizeSearchText(record.detail).slice(0,80)}`;
                if(seen.has(signature))return;seen.add(signature);merged.push(record);
            });
            return merged;
        })();
        const heading = document.createElement('div'); heading.className = 'mm-search-results-head';
        const headingStrong = document.createElement('strong'); headingStrong.textContent = document.documentElement.lang==='en' ? 'Search results' : 'نتایج جست‌وجو';
        const count = document.createElement('span'); count.textContent = `${records.length.toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'fa-IR')} نتیجه`;
        heading.append(headingStrong, count); panel.appendChild(heading);
        if (!records.length) {
            const empty = document.createElement('p'); empty.className = 'mm-search-results-empty';
            empty.textContent = document.documentElement.lang==='en' ? 'No results found. Try a task title, subject, or note text.' : 'نتیجه‌ای پیدا نشد. عنوان، متن یادداشت یا نام درس را امتحان کن.';
            panel.appendChild(empty);
            panel.__mmSearchResults = [];
            panel.hidden = false;
            positionDarsyarSearchPanel(input, panel);
            return;
        }
        const shown = records.slice(0, 15);
        panel.__mmSearchResults = shown;
        shown.forEach((record, index) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'mm-search-result';
            row.dataset.mmSearchResultIndex = String(index);
            const title = document.createElement('span'); title.className = 'mm-search-result-title'; title.textContent = record.title || 'مورد ذخیره‌شده';
            const kind = document.createElement('span'); kind.className = 'mm-search-result-kind'; kind.textContent = record.category || 'درس‌یار';
            row.append(title, kind);
            const detailText = String(record.detail || '').trim();
            if (detailText && normalizeSearchText(detailText) !== normalizeSearchText(record.title)) {
                const detail = document.createElement('span'); detail.className = 'mm-search-result-detail';
                detail.textContent = detailText.length > 230 ? `${detailText.slice(0,227)}…` : detailText;
                row.appendChild(detail);
            }
            panel.appendChild(row);
        });
        if (records.length > shown.length) {
            const more = document.createElement('p'); more.className = 'mm-search-results-empty';
            more.textContent = document.documentElement.lang==='en' ? `Showing 15 of ${records.length.toLocaleString('en-US')} results.` : `۱۵ مورد از ${records.length.toLocaleString('fa-IR')} نتیجه نمایش داده شده است.`;
            panel.appendChild(more);
        }
        panel.hidden = false;
        positionDarsyarSearchPanel(input, panel);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }
    function hideDuplicateDarsyarControls(root) {
        const hiddenLabels = /^(تنظیمات|حساب من|حساب کاربری|حساب|آواتار|my account|account settings|settings)(?:\s*\(?\d+\)?)?$/i;
        root.querySelectorAll('button,a,[role="button"],[role="tab"]').forEach(el => {
            if (el.closest('#mm-study-planner')) return;
            const label = `${nodeText(el)} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.replace(/\s+/g, ' ').trim();
            const normalized = label.split(/\s{2,}/)[0].trim();
            if (!hiddenLabels.test(nodeText(el)) && !hiddenLabels.test((el.getAttribute('aria-label') || '').trim()) && !hiddenLabels.test((el.getAttribute('title') || '').trim())) return;
            const target = el.closest('li,[role="listitem"],[role="presentation"]') || el;
            if (target.dataset.mmDuplicateHidden === '1') return;
            target.dataset.mmDuplicateHidden = '1';
            target.style.setProperty('display', 'none', 'important');
        });
    }
    function useHomeIconForDashboard(root) {
        const candidates = [...root.querySelectorAll('button,a,[role="button"],[role="tab"]')];
        const target = candidates.find(el => /^(پیشخوان|داشبورد|dashboard)(?:\s+.*)?$/i.test(nodeText(el)) || /^(پیشخوان|داشبورد|dashboard)(?:\s+.*)?$/i.test((el.getAttribute('aria-label') || '').trim()));
        if (!target || target.dataset.mmHomeIconReady === '1') return;
        const img = document.createElement('img');
        img.src = 'assets/icons/home.svg';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.className = 'mm-dashboard-home-icon';
        const oldIcon = target.querySelector('svg,img,i,[data-lucide],[data-icon]');
        if (oldIcon) oldIcon.replaceWith(img); else target.prepend(img);
        target.dataset.mmHomeIconReady = '1';
    }
    function setupFlexibleStudyTime(root) {
        root.querySelectorAll('input[type="time"]').forEach(input => {
            const clue = `${input.id} ${input.name} ${input.getAttribute('aria-label') || ''} ${input.closest('label')?.textContent || ''} ${input.parentElement?.textContent || ''}`;
            if (!/(مطالعه|study|reading|وقت مطالعه|زمان مطالعه)/i.test(clue)) return;
            input.step = '60';
            input.removeAttribute('max');
            input.min = '00:00';
            input.dataset.mmFlexibleTime = '1';
        });
        root.querySelectorAll('select').forEach(select => {
            if (select.dataset.mmFlexibleStudyTime === '1' || select.closest('#mm-study-planner')) return;
            const parentText = `${select.id} ${select.name} ${select.getAttribute('aria-label') || ''} ${select.closest('label')?.textContent || ''} ${select.parentElement?.textContent || ''}`;
            if (!/(زمان مطالعه|مدت مطالعه|وقت مطالعه|study time|study duration|reading time)/i.test(parentText)) return;
            if (!select.parentElement) return;
            select.dataset.mmFlexibleStudyTime = '1';
            const wrap = document.createElement('label');
            wrap.className = 'mm-flexible-study-time';
            wrap.innerHTML = '<span>زمان دلخواه (دقیقه)</span><input type="number" min="1" max="1440" step="1" inputmode="numeric" placeholder="مثلاً ۴۵" aria-label="زمان دلخواه به دقیقه">';
            select.insertAdjacentElement('afterend', wrap);
            const custom = wrap.querySelector('input');
            if (/^\d+$/.test(String(select.value || '')) && Number(select.value) > 0) custom.value = String(select.value);
            select.addEventListener('change', () => { if (/^\d+$/.test(String(select.value || '')) && Number(select.value) > 0) custom.value = String(select.value); });
            custom.addEventListener('change', () => {
                const value = Math.floor(Number(custom.value));
                if (!Number.isFinite(value) || value < 1 || value > 1440) { custom.setCustomValidity('زمان باید بین ۱ تا ۱۴۴۰ دقیقه باشد.'); custom.reportValidity(); return; }
                custom.setCustomValidity('');
                let option = [...select.options].find(item => String(item.value) === String(value));
                if (!option) { option = new Option(`${value} دقیقه`, String(value)); select.add(option); }
                select.value = String(value);
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }
    const plannerKey = 'mathmateDarsyarPlanner_v1';
    function loadPlannerData() {
        try {
            const parsed = JSON.parse(localStorage.getItem(plannerKey) || '{}');
            return { notes: Array.isArray(parsed.notes) ? parsed.notes : [], items: Array.isArray(parsed.items) ? parsed.items : [] };
        } catch (_) { return { notes: [], items: [] }; }
    }
    function savePlannerData(data) {
        try { localStorage.setItem(plannerKey, JSON.stringify(data)); } catch (_) { /* Keep the current screen usable if storage is unavailable. */ }
    }
    function isoToday() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function isIsoDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
    function localDateFromIso(value) {
        if (!isIsoDate(value)) return new Date(NaN);
        const [y,m,d] = value.split('-').map(Number);
        return new Date(y, m-1, d, 12, 0, 0, 0);
    }
    function prettyDate(value) {
        // Keep the date exactly as selected/stored instead of silently converting Gregorian to Jalali.
        return isIsoDate(value) ? String(value) : '—';
    }

    function addDateOverride(root, iso) {
        if (!root || !isIsoDate(iso)) return;
        if (!root.__mmDateDisplayOverrides) root.__mmDateDisplayOverrides = new Set();
        root.__mmDateDisplayOverrides.add(iso);
    }

    function collectStoredDateOverrides(root) {
        if (!root || root.__mmStoredDateOverridesScanned) return;
        root.__mmStoredDateOverridesScanned = true;
        const relevantKey = /(date|deadline|due|exam|task|موعد|تاریخ|تکلیف|امتحان)/i;
        const visit = (value, parentKey, found, depth) => {
            if (depth > 12 || value == null) return;
            if (typeof value === 'string') {
                if (relevantKey.test(parentKey || '') && isIsoDate(value)) found.add(value);
                return;
            }
            if (Array.isArray(value)) {
                value.forEach(item => visit(item, parentKey, found, depth + 1));
                return;
            }
            if (typeof value === 'object') {
                Object.entries(value).forEach(([key, item]) => visit(item, key, found, depth + 1));
            }
        };
        try {
            const found = root.__mmDateDisplayOverrides || (root.__mmDateDisplayOverrides = new Set());
            for (let i = 0; i < localStorage.length; i++) {
                const raw = localStorage.getItem(localStorage.key(i));
                if (!raw) continue;
                try { visit(JSON.parse(raw), '', found, 0); } catch (_) { /* Non-JSON values do not contain structured task data. */ }
            }
        } catch (_) { /* The current session can still track dates selected in the picker. */ }
    }

    function dateDisplayAliases(iso) {
        const date = parseIsoUtc(iso);
        const formats = [
            ['fa-IR-u-ca-persian', { day:'numeric', month:'long', timeZone:'UTC' }],
            ['fa-IR-u-ca-persian', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }],
            ['fa-IR-u-ca-gregory', { day:'numeric', month:'long', timeZone:'UTC' }],
            ['fa-IR-u-ca-gregory', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }],
            ['en-US-u-ca-gregory', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }],
            ['en-US-u-ca-gregory', { year:'numeric', month:'2-digit', day:'2-digit', timeZone:'UTC' }]
        ];
        const aliases = new Set();
        formats.forEach(([locale, options]) => {
            try { aliases.add(new Intl.DateTimeFormat(locale, options).format(date).trim()); } catch (_) { /* Unsupported calendar/locale. */ }
        });
        return [...aliases].filter(Boolean).sort((a, b) => b.length - a.length);
    }

    const dateModeStorageKey = 'mathmateDarsyarDateModeChoices_v1';
    function normalizeSearchText(value) {
        return String(value == null ? '' : value)
            .normalize('NFKC').toLocaleLowerCase('fa-IR')
            .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
            .replace(/[\u200c\u200d]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function readDateModeChoices() {
        try {
            const parsed = JSON.parse(localStorage.getItem(dateModeStorageKey) || '[]');
            return Array.isArray(parsed) ? parsed.filter(item => item && isIsoDate(item.iso) && ['persian','gregory','islamic-civil'].includes(item.mode)) : [];
        } catch (_) { return []; }
    }
    function nearestDateContext(input, preferred) {
        if (preferred && preferred.querySelectorAll) return preferred;
        const direct = input?.closest?.('form,[role="dialog"],[role="alertdialog"],[class*="modal" i],[class*="drawer" i],[class*="sheet" i]');
        if (direct) return direct;
        let current = input?.parentElement || null;
        for (let depth = 0; current && depth < 7; depth++, current = current.parentElement) {
            if (current.querySelectorAll && current.querySelectorAll('input,textarea,button').length >= 3) return current;
        }
        return input?.parentElement || null;
    }
    function dateContextMetadata(input, preferred) {
        const container = nearestDateContext(input, preferred);
        const fields = container ? [...container.querySelectorAll('input,textarea,select')] : [];
        const clueFor = field => normalizeSearchText(`${field.name || ''} ${field.id || ''} ${field.placeholder || ''} ${field.getAttribute('aria-label') || ''} ${field.closest('label')?.textContent || ''}`);
        const titleField = fields.find(field => field !== input && !/^(date|time|number|checkbox|radio|submit|button|hidden)$/i.test(field.type || '') && /(title|عنوان|نام تکلیف|نام امتحان|task name|homework|exam name|یادداشت|note title|نام)/i.test(clueFor(field)));
        const subjectField = fields.find(field => field !== input && /(subject|درس|موضوع)/i.test(clueFor(field)));
        const title = String(titleField?.value || '').trim().slice(0,180);
        const subject = String(subjectField?.value || '').trim().slice(0,120);
        const contextText = `${container?.textContent || ''} ${container?.className || ''} ${container?.getAttribute?.('data-type') || ''}`;
        const typeClue = normalizeSearchText(`${contextText} ${input?.name || ''} ${input?.id || ''}`);
        let category = 'item';
        if (/(exam|امتحان|آزمون)/i.test(typeClue)) category = 'exam';
        else if (/(task|homework|assignment|تکلیف|وظیفه)/i.test(typeClue)) category = 'task';
        return { container, title, subject, category };
    }
    function rememberDateModeChoice(input, preferredContainer) {
        const iso = input?.dataset?.mmIsoDate;
        const mode = input?.dataset?.mmDateMode;
        if (!isIsoDate(iso) || !['persian','gregory','islamic-civil'].includes(mode)) return null;
        const meta = dateContextMetadata(input, preferredContainer);
        const choice = { iso, mode, label: formatDateForMode(iso, mode), title: meta.title, subject: meta.subject, category: meta.category, updatedAt: Date.now() };
        try {
            let choices = readDateModeChoices();
            const signature = item => `${item.iso}|${item.category || ''}|${normalizeSearchText(item.title || '')}`;
            const key = signature(choice);
            choices = choices.filter(item => signature(item) !== key && !(item.iso === iso && !item.title && item.mode === mode));
            choices.push(choice);
            if (choices.length > 500) choices = choices.slice(-500);
            localStorage.setItem(dateModeStorageKey, JSON.stringify(choices));
        } catch (_) { /* Date selection must remain usable if local storage is disabled. */ }
        return choice;
    }
    function findDateModeChoice(iso, contextText) {
        const choices = readDateModeChoices().filter(item => item.iso === iso).sort((a,b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        if (!choices.length) return null;
        const context = normalizeSearchText(contextText);
        const matches = choices.find(item => item.title && context.includes(normalizeSearchText(item.title)));
        if (matches) return matches;
        if (choices.length === 1) return choices[0];
        const unlabelled = choices.filter(item => !item.title);
        return unlabelled.length === 1 ? unlabelled[0] : null;
    }
    function findDateModeChoiceForContext(contextText) {
        const context = normalizeSearchText(contextText);
        if (!context) return null;
        const titled = readDateModeChoices().filter(item => {
            const title = normalizeSearchText(item.title || '');
            return title.length >= 2 && context.includes(title);
        });
        const withSubject = titled.filter(item => {
            const subject = normalizeSearchText(item.subject || '');
            return !subject || context.includes(subject);
        });
        const choices = withSubject.length ? withSubject : (titled.length === 1 ? titled : []);
        // Prefer the most specific task/exam title, not a shorter title that happens to be inside it.
        choices.sort((a,b) => normalizeSearchText(b.title || '').length - normalizeSearchText(a.title || '').length || normalizeSearchText(b.subject || '').length - normalizeSearchText(a.subject || '').length || Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        if (!choices.length) return null;
        if (choices.length > 1 && normalizeSearchText(choices[0].title || '') === normalizeSearchText(choices[1].title || '') && choices[0].iso !== choices[1].iso && !normalizeSearchText(choices[0].subject || '')) return null;
        return choices[0];
    }
    function syncSelectedDateDisplays(root) {
        if (!root?.querySelectorAll) return;
        root.querySelectorAll('input[data-mm-date-picker-ready]').forEach(input => {
            const iso = isIsoDate(input.dataset.mmIsoDate) ? input.dataset.mmIsoDate : (isIsoDate(input.value) ? input.value : '');
            if (!iso) return;
            if (isIsoDate(input.value)) input.dataset.mmIsoDate = iso;
            const mode = document.documentElement.lang === 'en' ? 'gregory' : 'persian';
            input.dataset.mmDateMode = mode;
            input.dataset.mmDisplayDate = formatDateForMode(iso, mode);
            if (input.value !== input.dataset.mmDisplayDate) input.value = input.dataset.mmDisplayDate;
        });
    }
    function wireCanonicalDateSubmission(root) {
        if (root.__mmCanonicalDateSubmissionWired) return;
        root.__mmCanonicalDateSubmissionWired = true;
        const process = (container) => {
            if (!container?.querySelectorAll) return;
            const fields = [...container.querySelectorAll('input[data-mm-date-picker-ready]')].filter(input => isIsoDate(input.dataset.mmIsoDate) && input.dataset.mmDateMode);
            fields.forEach(input => {
                input.dataset.mmDisplayDate = input.dataset.mmDisplayDate || formatDateForMode(input.dataset.mmIsoDate, input.dataset.mmDateMode);
                const display = input.dataset.mmDisplayDate || input.value;
                const iso = input.dataset.mmIsoDate;
                input.value = iso; // App handlers receive the canonical sortable ISO date.
                queueMicrotask(() => {
                    if (input.isConnected && input.dataset.mmIsoDate === iso && display) input.value = display;
                });
                requestAnimationFrame(() => {
                    if (input.isConnected && input.dataset.mmIsoDate === iso && display) input.value = display;
                });
            });
        };
        root.addEventListener('submit', event => process(event.target), true);
        root.addEventListener('click', event => {
            const button = event.target.closest?.('button,input[type="submit"],input[type="image"]');
            if (!button) return;
            const form = button.form || button.closest('form');
            if (form && (button.type === 'submit' || button.matches('input[type="submit"],input[type="image"]'))) process(form);
        }, true);
    }

    function normalizeDueDateLabels(root) {
        if (!root || !root.querySelectorAll) return;
        collectStoredDateOverrides(root);
        root.querySelectorAll('input[data-mm-date-picker-ready][data-mm-iso-date]').forEach(input => addDateOverride(root, input.dataset.mmIsoDate));
        const monthNames = '(?:فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند|محرم|صفر|ربیع\\s*الاول|ربیع\\s*الثانی|جمادی\\s*الاول|جمادی\\s*الثانی|رجب|شعبان|رمضان|شوال|ذی\\s*القعده|ذی\\s*الحجه|ژانویه|فوریه|مارس|آوریل|مه|ژوئن|ژوئیه|اوت|سپتامبر|اکتبر|نوامبر|دسامبر|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)';
        const digits = '[0-9۰-۹٠-٩]';
        // A displayed Hijri date can include a calendar suffix; consume any old suffixes as part
        // of the same date token, so repeated mutation passes can never append another one.
        const hijriSuffix = '(?:ه[\\u200c\\u200d]?\\s*\\.?\\s*ق\\s*\\.?|هـ[\\u200c\\u200d]?\\s*\\.?\\s*ق\\s*\\.?|هجری\\s*قمری|A\\.?H\\.?)';
        const repeatedHijriSuffix = new RegExp(`(?:\\s*${hijriSuffix})+`, 'gi');
        const suffixOnlyPattern = new RegExp(`^(?:${hijriSuffix})(?:\\s*${hijriSuffix})*$`, 'i');
        const stripAdjacentHijriSuffixNodes = textNode => {
            let anchor = textNode;
            for (let depth = 0; depth < 4 && anchor?.parentNode && anchor.parentNode !== root; depth++) {
                const parent = anchor.parentNode;
                for (const direction of ['previousSibling', 'nextSibling']) {
                    let sibling = anchor[direction];
                    while (sibling) {
                        if (sibling.nodeType === Node.TEXT_NODE && !sibling.nodeValue.trim()) {
                            sibling = sibling[direction];
                            continue;
                        }
                        const text = (sibling.nodeType === Node.TEXT_NODE ? sibling.nodeValue :
                            sibling.nodeType === Node.ELEMENT_NODE && !sibling.matches('button,input,select,textarea') ? sibling.textContent : '').trim();
                        if (!text || !suffixOnlyPattern.test(text)) break;
                        const nextSibling = sibling[direction];
                        if (sibling.nodeType === Node.TEXT_NODE) sibling.nodeValue = '';
                        else sibling.textContent = '';
                        sibling = nextSibling;
                    }
                }
                anchor = parent;
            }
        };
        const dateToken = new RegExp(`(?:${digits}{1,4}\\s*[-/.]\\s*${digits}{1,2}(?:\\s*[-/.]\\s*${digits}{1,4})?|${digits}{1,2}\\s+${monthNames}(?:\\s+${digits}{2,4})?|${monthNames}\\s+${digits}{1,2}(?:,?\\s+${digits}{2,4})?)(?:\\s*${hijriSuffix})*`, 'gi');
        const singleDateToken = new RegExp(dateToken.source, 'i');
        const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        const dateLabelPattern = /(موعد|تاریخ|deadline|due\s*date|task\s*date|exam\s*date|تکلیف|امتحان)/i;
        const weekdayPattern = '(?:شنبه|یکشنبه|دوشنبه|سه\\u200cشنبه|سه شنبه|چهارشنبه|پنجشنبه|جمعه|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday)';
        textNodes.forEach(node => {
            const original = node.nodeValue || '';
            if (!original.trim()) return;
            let context = node.parentElement;
            let contextText = '';
            let isDateContext = false;
            let isDashboardDayHeading = false;
            for (let depth = 0; context && context !== root && depth < 8; depth++, context = context.parentElement) {
                const elementText = String(context.textContent || '').replace(/\s+/g, ' ').trim();
                const hint = `${context.id || ''} ${typeof context.className === 'string' ? context.className : ''} ${context.getAttribute?.('aria-label') || ''} ${elementText}`;
                contextText += ` ${hint}`;
                if (dateLabelPattern.test(hint)) isDateContext = true;
                // The dashboard heading's date is Gregorian ISO-style text, not a task's picked
                // calendar mode. Keep it as entered and remove any old duplicate Hijri suffixes.
                if (elementText.length < 2400 && new RegExp(`^کارهای\\s+${weekdayPattern}\\s+${digits}{4}\\s*[/.-]\\s*${digits}{1,2}\\s*[/.-]\\s*${digits}{1,2}`, 'i').test(elementText)) {
                    isDashboardDayHeading = true;
                    break;
                }
                if (context.matches?.('h1,h2,h3,h4,h5,[role="heading"]') && elementText.length < 2400) break;
                if (context.matches?.('article,tr,li,[role="listitem"],[class*="task" i],[class*="exam" i],[class*="assignment" i]')) break;
            }
            if (isDashboardDayHeading) {
                if (repeatedHijriSuffix.test(original)) {
                    const cleaned = original.replace(repeatedHijriSuffix, '').replace(/[ \t]+$/g, '');
                    if (cleaned !== original) node.nodeValue = cleaned;
                }
                repeatedHijriSuffix.lastIndex = 0;
                return;
            }
            if (!dateToken.test(original)) { dateToken.lastIndex = 0; return; }
            dateToken.lastIndex = 0;
            if (!isDateContext) return;
            // The title/subject metadata uniquely selects the saved calendar choice for this task.
            // Since dateToken consumes the full old suffix, replacing it is idempotent.
            const choice = findDateModeChoiceForContext(contextText);
            if (!choice || !isIsoDate(choice.iso)) return;
            const replacement = choice.mode === 'gregory' ? formatDateForMode(choice.iso, choice.mode) : (choice.label || formatDateForMode(choice.iso, choice.mode));
            if (!replacement) return;
            const next = original.replace(singleDateToken, replacement);
            if (next !== original) node.nodeValue = next;
            // Some versions render the calendar suffix in a separate sibling span/text node.
            // Remove only adjacent nodes containing nothing but a Hijri suffix to avoid doubles.
            stripAdjacentHijriSuffixNodes(node);
            dateToken.lastIndex = 0;
            repeatedHijriSuffix.lastIndex = 0;
        });
    }
    function plannerId() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`; }
    function openCalendarPicker(root, input) {
        if (!input) return;
        let overlay = root.querySelector('#mm-date-picker-overlay');
        const langNow = document.documentElement.lang === 'en' ? 'en' : 'fa';
        if (overlay && overlay.dataset.mmLang !== langNow) {
            overlay.remove();
            overlay = null;
        }
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mm-date-picker-overlay';
            overlay.className = 'mm-date-picker-overlay';
            overlay.dataset.mmLang = langNow;
            overlay.hidden = true;
            const isEn = langNow === 'en';
            const t = isEn ? {
                title: 'Pick a date', sub: 'Calendar follows the site language', close: 'Close',
                prev: 'Previous month', next: 'Next month', invalid: 'Invalid days cannot be selected.', today: 'Today'
            } : {
                title: 'انتخاب تاریخ', sub: 'تقویم بر اساس زبان سایت تنظیم می‌شود', close: 'بستن',
                prev: 'ماه قبل', next: 'ماه بعد', invalid: 'روزهای نامعتبر قابل انتخاب نیستند.', today: 'امروز'
            };
            overlay.innerHTML = `<div class="mm-date-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="mm-date-picker-title" tabindex="-1"><div class="mm-date-picker-top"><div><h3 id="mm-date-picker-title">${t.title}</h3><p>${t.sub}</p></div><button type="button" class="mm-date-close" data-mm-date-close aria-label="${t.close}"><img src="assets/icons/close.svg" alt="" width="20" height="20"></button></div><div class="mm-date-month-nav"><button type="button" data-mm-month-prev aria-label="${t.prev}">‹</button><strong data-mm-month-title></strong><button type="button" data-mm-month-next aria-label="${t.next}">›</button></div><div class="mm-date-weekdays" data-mm-weekdays></div><div class="mm-date-days" data-mm-days></div><button type="button" class="mm-date-today" data-mm-date-today>${t.today}</button></div>`;
            root.appendChild(overlay);
            overlay.addEventListener('click', event => {
                const state = root.__mmDatePickerState;
                if (!state) return;
                const target = event.target.closest('button');
                if (!target) { if (event.target === overlay) closeCalendarPicker(overlay); return; }
                if (target.hasAttribute('data-mm-date-close')) { closeCalendarPicker(overlay); return; }
                if (target.hasAttribute('data-mm-month-prev')) { state.cursor = addUtcDays(startCalendarMonth(state.cursor, state.mode), -1); renderCalendarPicker(root); return; }
                if (target.hasAttribute('data-mm-month-next')) { state.cursor = addUtcDays(startCalendarMonth(state.cursor, state.mode), 35); renderCalendarPicker(root); return; }
                if (target.hasAttribute('data-mm-date-today')) { commitCalendarDate(root, overlay, isoToday()); return; }
                if (target.dataset.mmDateValue) { commitCalendarDate(root, overlay, target.dataset.mmDateValue); }
            });
            overlay.addEventListener('keydown', event => { if (event.key === 'Escape') closeCalendarPicker(overlay); });
        }
        const seedIso = (input.dataset.mmIsoDate && isIsoDate(input.dataset.mmIsoDate)) ? input.dataset.mmIsoDate : (isIsoDate(input.value) ? input.value : isoToday());
        let chosen = parseIsoUtc(seedIso);
        const initialMode = document.documentElement.lang === 'en' ? 'gregory' : 'persian';
        input.dataset.mmDateMode = initialMode;
        input.dataset.mmDisplayDate = formatDateForMode(seedIso, initialMode);
        root.__mmDatePickerState = { input, mode: initialMode, cursor: chosen };
        renderCalendarPicker(root);
        overlay.hidden = false;
        overlay.classList.remove('is-open');
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        overlay.querySelector('.mm-date-picker-dialog')?.focus({ preventScroll: true });
    }
    function closeCalendarPicker(overlay) {
        if (!overlay || overlay.hidden) return;
        overlay.classList.remove('is-open');
        window.setTimeout(() => { if (!overlay.classList.contains('is-open')) overlay.hidden = true; }, 220);
    }
    function parseIsoUtc(value) {
        if (!isIsoDate(value)) return new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12));
        const [y,m,d] = value.split('-').map(Number);
        return new Date(Date.UTC(y,m-1,d,12));
    }
    function isoFromUtc(date) {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
    }
    function addUtcDays(date, amount) {
        const copy = new Date(date.getTime());
        copy.setUTCDate(copy.getUTCDate() + amount);
        return copy;
    }
    function dateFormatter(mode) {
        const calendar = mode === 'gregory' ? 'gregory' : mode;
        return new Intl.DateTimeFormat(`en-US-u-ca-${calendar}-nu-latn`, { year:'numeric', month:'numeric', day:'numeric', timeZone:'UTC' });
    }
    function partsForCalendar(date, mode) {
        try {
            const p = dateFormatter(mode).formatToParts(date);
            const get = type => Number(p.find(part => part.type === type)?.value || 0);
            return { year:get('year'), month:get('month'), day:get('day') };
        } catch (_) {
            return { year:date.getUTCFullYear(), month:date.getUTCMonth()+1, day:date.getUTCDate() };
        }
    }
    function startCalendarMonth(date, mode) {
        let cursor = new Date(date.getTime());
        for (let i = 0; i < 35; i++) {
            const part = partsForCalendar(cursor, mode);
            if (part.day <= 1) break;
            cursor = addUtcDays(cursor, -1);
        }
        return cursor;
    }
    function calendarMonthLabel(date, mode) {
        const calendar = mode === 'gregory' ? 'gregory' : mode;
        const locale = (document.documentElement.lang === 'en') ? 'en-US' : 'fa-IR';
        try { return new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}-nu-latn`, { year:'numeric', month:'long', timeZone:'UTC' }).format(date); }
        catch (_) { return new Intl.DateTimeFormat(locale, { year:'numeric', month:'long', timeZone:'UTC' }).format(date); }
    }
    function renderCalendarPicker(root) {
        const state = root.__mmDatePickerState;
        const overlay = root.querySelector('#mm-date-picker-overlay');
        if (!state || !overlay) return;
        state.mode = document.documentElement.lang === 'en' ? 'gregory' : 'persian';
        if (state.input?.dataset) state.input.dataset.mmDateMode = state.mode;
        const start = startCalendarMonth(state.cursor, state.mode);
        const first = partsForCalendar(start, state.mode);
        const days = [];
        for (let i = 0; i < 32; i++) {
            const d = addUtcDays(start, i);
            const p = partsForCalendar(d, state.mode);
            if (i > 0 && (p.year !== first.year || p.month !== first.month)) break;
            days.push({ date:d, day:p.day });
        }
        const selected = (state.input.dataset.mmIsoDate && isIsoDate(state.input.dataset.mmIsoDate)) ? state.input.dataset.mmIsoDate : (isIsoDate(state.input.value) ? state.input.value : '');
        const isEnUi = document.documentElement.lang === 'en';
        const weekdayNames = isEnUi
            ? (state.mode === 'persian' ? ['Sa','Su','Mo','Tu','We','Th','Fr'] : ['Su','Mo','Tu','We','Th','Fr','Sa'])
            : (state.mode === 'persian' ? ['ش','ی','د','س','چ','پ','ج'] : ['ی','د','س','چ','پ','ج','ش']);
        const weekdayOffset = state.mode === 'persian' ? (start.getUTCDay()+1)%7 : start.getUTCDay();
        overlay.querySelector('[data-mm-month-title]').textContent = calendarMonthLabel(start, state.mode);
        overlay.querySelector('[data-mm-weekdays]').innerHTML = weekdayNames.map(name => `<span>${name}</span>`).join('');
        const cells = Array(weekdayOffset).fill('<span class="mm-date-empty" aria-hidden="true"></span>');
        days.forEach(item => {
            const value = isoFromUtc(item.date);
            const today = value === isoToday();
            cells.push(`<button type="button" class="mm-date-day${value===selected?' selected':''}${today?' today':''}" data-mm-date-value="${value}" aria-label="روز ${item.day}">${item.day}</button>`);
        });
        overlay.querySelector('[data-mm-days]').innerHTML = cells.join('');
    }
    function formatDateForMode(iso, mode) {
        if (!isIsoDate(iso)) return iso;
        const isEnglish = document.documentElement.lang === 'en';
        const date = parseIsoUtc(iso);
        const calendar = isEnglish ? 'gregory' : 'persian';
        try {
            const parts = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}-nu-latn`, {
                year:'numeric', month:'2-digit', day:'2-digit', timeZone:'UTC'
            }).formatToParts(date);
            const part = type => String(parts.find(item => item.type === type)?.value || '');
            const year=part('year'), month=part('month').padStart(2,'0'), day=part('day').padStart(2,'0');
            if (!/^\d{1,4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) throw new Error('Invalid calendar parts');
            const formatted=`${year.padStart(4,'0')}/${month}/${day}`;
            return isEnglish ? formatted : formatted.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
        } catch (_) {
            const ordered=iso.replace(/-/g,'/');
            return isEnglish ? ordered : ordered.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
        }
    }
    function commitCalendarDate(root, overlay, iso) {
        const state = root.__mmDatePickerState;
        if (!state || !state.input || !isIsoDate(iso)) return;
        const input = state.input;
        const mode = state.mode || 'gregory';
        const display = formatDateForMode(iso, mode);
        input.dataset.mmIsoDate = iso;          // Canonical Gregorian ISO date for sorting/storage.
        input.dataset.mmDateMode = mode;       // Calendar chosen by the user.
        input.dataset.mmDisplayDate = display; // Visible label in the chosen calendar.
        addDateOverride(root, iso);
        // Notify the original app using ISO so its model remains valid, then restore the chosen display.
        input.value = iso;
        input.dispatchEvent(new Event('input', { bubbles:true, composed:true }));
        input.dispatchEvent(new Event('change', { bubbles:true, composed:true }));
        input.dispatchEvent(new Event('blur', { bubbles:true, composed:true }));
        input.value = display;
        requestAnimationFrame(() => { if (input.isConnected && input.dataset.mmIsoDate === iso) input.value = display; });
        closeCalendarPicker(overlay);
    }
    function wireDarsyarDateFields(root) {
        root.querySelectorAll('input[type="date"],input[type="text"],input:not([type])').forEach(input => {
            if (input.closest('#mm-study-planner') || input.dataset.mmDatePickerReady === '1') return;
            const label = input.labels ? [...input.labels].map(el => nodeText(el)).join(' ') : '';
            const clue = `${input.id} ${input.name} ${input.getAttribute('aria-label') || ''} ${input.placeholder || ''} ${label}`;
            if (!/(تاریخ|موعد|deadline|due.?date|date.?picker|exam.?date|task.?date)/i.test(clue) && input.type !== 'date') return;
            input.dataset.mmDatePickerReady = '1';
            if (input.type === 'date') {
                input.dataset.mmOriginalDateType = 'date';
                input.type = 'text';
            }
            if (isIsoDate(input.value)) input.dataset.mmIsoDate = input.value;
            input.readOnly = true;
            input.setAttribute('inputmode','none');
            input.placeholder = input.placeholder || 'برای انتخاب تاریخ کلیک کن';
            input.classList.add('mm-bridge-date-input');
            input.addEventListener('click', event => { event.preventDefault(); openCalendarPicker(root, input); });
            input.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCalendarPicker(root, input); } });
        });
    }
    function plannerPanelMarkup(data, view, editNoteId) {
        const nav = `<div class="mm-planner-head"><div><span class="mm-planner-kicker">درس‌یار</span><h2>برنامه‌ریز درس‌خواندن</h2><p>یادداشت‌ها، تکلیف‌ها و امتحان‌ها را یک‌جا مدیریت کن.</p></div><span class="mm-planner-mark">✦</span></div><div class="mm-planner-tabs"><button type="button" data-mm-tab="dashboard" class="${view==='dashboard'?'active':''}">پیشخوان</button><button type="button" data-mm-tab="tasks" class="${view==='tasks'?'active':''}">تکالیف</button><button type="button" data-mm-tab="exams" class="${view==='exams'?'active':''}">امتحان‌ها</button><button type="button" data-mm-tab="notes" class="${view==='notes'?'active':''}">یادداشت‌ها</button></div>`;
        const items = data.items.filter(item => item && item.id && (item.type === 'task' || item.type === 'exam'));
        const pending = items.filter(item => !item.done).sort((a,b) => `${a.date||'9999'}T${a.time||'23:59'}`.localeCompare(`${b.date||'9999'}T${b.time||'23:59'}`));
        const tasks = pending.filter(item => item.type === 'task');
        const exams = pending.filter(item => item.type === 'exam');
        const next7 = Array.from({length:7},(_,i)=>{
            const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+i);
            const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return { iso, label:d.toLocaleDateString('fa-IR',{weekday:'short'}), count:pending.filter(item=>item.date===iso).length };
        });
        const maxBar = Math.max(1,...next7.map(item=>item.count));
        const chart = `<div class="mm-planner-chart">${next7.map(item=>`<div class="mm-chart-column"><span class="mm-chart-count">${item.count}</span><div class="mm-chart-track"><i style="height:${Math.max(5,Math.round(item.count/maxBar*100))}%"></i></div><small>${escapeHtml(item.label)}</small></div>`).join('')}</div>`;
        const tableItems = pending.slice(0,8);
        const table = tableItems.length ? `<div class="mm-planner-table-wrap"><table class="mm-planner-table"><thead><tr><th>نوع</th><th>عنوان</th><th>تاریخ</th><th>زمان</th><th>وضعیت</th></tr></thead><tbody>${tableItems.map(item=>`<tr><td><span class="mm-type-pill ${item.type}">${item.type==='exam'?'امتحان':'تکلیف'}</span></td><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subject||'بدون درس')}</small></td><td>${escapeHtml(prettyDate(item.date))}</td><td>${escapeHtml(item.time||'—')}</td><td><button type="button" data-mm-done="${escapeHtml(item.id)}" class="mm-table-action">انجام شد</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="mm-planner-empty">هنوز تکلیف یا امتحانی ثبت نشده است. از برگه‌های «تکالیف» و «امتحان‌ها» مورد جدید اضافه کن.</p>';
        if (view === 'dashboard') return `${nav}<div class="mm-planner-stats"><article><span>تکلیف‌های باز</span><strong>${tasks.length}</strong></article><article><span>امتحان‌های آینده</span><strong>${exams.length}</strong></article><article><span>یادداشت‌ها</span><strong>${data.notes.length}</strong></article></div><section class="mm-planner-card"><div class="mm-planner-section-title"><h3>برنامهٔ هفت روز آینده</h3><span>تعداد موردها در هر روز</span></div>${chart}</section><section class="mm-planner-card"><div class="mm-planner-section-title"><h3>تکلیف‌ها و امتحان‌های نزدیک</h3><span>حداکثر ۸ مورد</span></div>${table}</section>`;
        if (view === 'notes') {
            const edit = data.notes.find(note=>note.id===editNoteId);
            return `${nav}<section class="mm-planner-card"><div class="mm-planner-section-title"><h3>${edit?'ویرایش یادداشت':'یادداشت جدید'}</h3><span>می‌توانی هر تعداد یادداشت اضافه کنی.</span></div><form data-mm-note-form class="mm-planner-form"><label>عنوان یادداشت<input name="title" maxlength="120" required value="${escapeHtml(edit?.title||'')}" placeholder="مثلاً نکته‌های فصل سوم"></label><label>متن یادداشت<textarea name="body" rows="4" required maxlength="12000" placeholder="یادداشتت را اینجا بنویس…">${escapeHtml(edit?.body||'')}</textarea></label><div class="mm-form-actions"><button class="mm-primary-btn" type="submit">${edit?'ذخیره تغییرات':'افزودن یادداشت'}</button>${edit?'<button type="button" data-mm-cancel-edit class="mm-secondary-btn">انصراف</button>':''}</div></form></section><section class="mm-planner-card"><div class="mm-planner-section-title"><h3>یادداشت‌های ذخیره‌شده</h3><span>${data.notes.length} یادداشت</span></div>${data.notes.length?`<div class="mm-notes-list">${data.notes.slice().sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)).map(note=>`<article class="mm-note-card"><div><h4>${escapeHtml(note.title||'بدون عنوان')}</h4><p>${escapeHtml(note.body||'')}</p><small>${escapeHtml(new Date(note.updatedAt||note.createdAt||Date.now()).toLocaleDateString('fa-IR'))}</small></div><div class="mm-note-actions"><button type="button" data-mm-edit-note="${escapeHtml(note.id)}"><img class="mm-site-icon" src="${typeof resolveSiteAsset==='function'?resolveSiteAsset('assets/icons/edit.svg'):'assets/icons/edit.svg'}" alt="" width="16" height="16"> ویرایش</button><button type="button" data-mm-delete-note="${escapeHtml(note.id)}" class="danger">حذف</button></div></article>`).join('')}</div>`:'<p class="mm-planner-empty">هنوز یادداشتی نداری. اولین یادداشتت را اضافه کن.</p>'}</section>`;
        }
        const type = view === 'exams' ? 'exam' : 'task';
        const filtered = pending.filter(item=>item.type===type);
        return `${nav}<section class="mm-planner-card"><div class="mm-planner-section-title"><h3>${type==='exam'?'ثبت امتحان جدید':'ثبت تکلیف جدید'}</h3><span>${type==='exam'?'نام، درس، تاریخ و زمان مطالعه را وارد کن.':'عنوان، درس و موعد انجام تکلیف را وارد کن.'}</span></div><form data-mm-item-form data-item-type="${type}" class="mm-planner-form"><label>عنوان ${type==='exam'?'امتحان':'تکلیف'}<input name="title" required maxlength="120" placeholder="${type==='exam'?'مثلاً امتحان ریاضی فصل ۴':'مثلاً تمرین صفحه ۳۲'}"></label><label>درس<input name="subject" maxlength="80" placeholder="مثلاً ریاضی"></label><div class="mm-form-two"><label>تاریخ<input name="date" type="text" readonly required value="${isoToday()}" data-mm-planner-date placeholder="انتخاب تاریخ"></label><label>ساعت (اختیاری)<input name="time" type="time" step="60"></label></div><label>زمان مطالعهٔ برنامه‌ریزی‌شده (دقیقه)<input name="duration" type="number" min="1" max="1440" step="1" inputmode="numeric" placeholder="هر مقداری از ۱ تا ۱۴۴۰ دقیقه"></label><label>توضیحات (اختیاری)<textarea name="details" rows="2" maxlength="3000" placeholder="سرفصل‌ها یا توضیحات بیشتر"></textarea></label><button class="mm-primary-btn" type="submit">${type==='exam'?'ثبت امتحان و برنامه‌ریزی':'ثبت تکلیف'}</button></form></section><section class="mm-planner-card"><div class="mm-planner-section-title"><h3>${type==='exam'?'امتحان‌های ثبت‌شده':'تکلیف‌های ثبت‌شده'}</h3><span>${data.items.filter(item=>item.type===type).length} مورد</span></div>${filtered.length?`<div class="mm-planner-item-list">${filtered.map(item=>`<article class="mm-planner-item ${item.done?'done':''}"><div class="mm-planner-item-main"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subject||'بدون درس')} · ${escapeHtml(prettyDate(item.date))}${item.time?' · '+escapeHtml(item.time):''}</span>${item.duration?`<small>زمان مطالعه: ${Number(item.duration)} دقیقه</small>`:''}${item.details?`<p>${escapeHtml(item.details)}</p>`:''}</div><div class="mm-item-actions"><button type="button" data-mm-done="${escapeHtml(item.id)}">${item.done?'بازگردانی':'انجام شد'}</button><button type="button" class="danger" data-mm-delete-item="${escapeHtml(item.id)}">حذف</button></div></article>`).join('')}</div>`:'<p class="mm-planner-empty">هنوز موردی ثبت نشده است.</p>'}</section>`;
    }
    function mountStudyPlanner(root) {
        if (root.querySelector('#mm-study-planner')) return;
        const host = document.createElement('section');
        host.id = 'mm-study-planner';
        host.className = 'mm-study-planner';
        host.dir = 'rtl';
        host.dataset.mmTab = 'dashboard';
        let data = loadPlannerData();
        let editingNoteId = null;
        const render = () => { host.dataset.mmTab = host.dataset.mmTab || 'dashboard'; host.innerHTML = plannerPanelMarkup(data, host.dataset.mmTab, editingNoteId); };
        host.addEventListener('click', event => {
            const tab = event.target.closest('[data-mm-tab]');
            if (tab) { host.dataset.mmTab = tab.dataset.mmTab; editingNoteId = null; render(); return; }
            const delNote = event.target.closest('[data-mm-delete-note]');
            if (delNote) { data.notes = data.notes.filter(note=>note.id!==delNote.dataset.mmDeleteNote); savePlannerData(data); editingNoteId=null; render(); return; }
            const editNote = event.target.closest('[data-mm-edit-note]');
            if (editNote) { editingNoteId=editNote.dataset.mmEditNote; host.dataset.mmTab='notes'; render(); return; }
            if (event.target.closest('[data-mm-cancel-edit]')) { editingNoteId=null; render(); return; }
            const done = event.target.closest('[data-mm-done]');
            if (done) { const item=data.items.find(x=>x.id===done.dataset.mmDone); if(item)item.done=!item.done; savePlannerData(data); render(); return; }
            const delItem = event.target.closest('[data-mm-delete-item]');
            if (delItem) { data.items=data.items.filter(x=>x.id!==delItem.dataset.mmDeleteItem); savePlannerData(data); render(); return; }
            const date = event.target.closest('[data-mm-planner-date]');
            if (date) { event.preventDefault(); openCalendarPicker(root, date); }
        });
        host.addEventListener('keydown', event => {
            const date = event.target.closest('[data-mm-planner-date]');
            if (date && (event.key==='Enter'||event.key===' ')) { event.preventDefault(); openCalendarPicker(root,date); }
        });
        host.addEventListener('submit', event => {
            const form = event.target;
            if (form.matches('[data-mm-note-form]')) {
                event.preventDefault();
                const fd = new FormData(form);
                const title=String(fd.get('title')||'').trim(), body=String(fd.get('body')||'').trim();
                if (!title || !body) return;
                const now=Date.now();
                if (editingNoteId) { const note=data.notes.find(item=>item.id===editingNoteId); if(note){note.title=title;note.body=body;note.updatedAt=now;} }
                else data.notes.push({id:plannerId(),title,body,createdAt:now,updatedAt:now});
                savePlannerData(data); editingNoteId=null; host.dataset.mmTab='notes'; render(); return;
            }
            if (form.matches('[data-mm-item-form]')) {
                event.preventDefault();
                const fd=new FormData(form), title=String(fd.get('title')||'').trim();
                const dateInput=form.querySelector('[name="date"]');
                const date= (dateInput && dateInput.dataset.mmIsoDate) || String(fd.get('date')||'');
                if (!title || !isIsoDate(date) || Number.isNaN(localDateFromIso(date).getTime())) return;
                const durationRaw=String(fd.get('duration')||'').trim();
                const duration=durationRaw ? Math.max(1,Math.min(1440,Math.floor(Number(durationRaw)||1))) : null;
                data.items.push({id:plannerId(),type:form.dataset.itemType==='exam'?'exam':'task',title,subject:String(fd.get('subject')||'').trim(),date,time:String(fd.get('time')||''),duration,details:String(fd.get('details')||'').trim(),done:false,createdAt:Date.now()});
                savePlannerData(data); host.dataset.mmTab=form.dataset.itemType==='exam'?'exams':'tasks'; render(); return;
            }
        });
        render();
        const preferred = root.querySelector('main,[role="main"],[class*="dashboard-content" i],[class*="dashboard-main" i],[class*="page-content" i],[class*="workspace" i]');
        const calendar = root.querySelector('.mm-calendar-feature') || findCalendar(root);
        let mountPoint = preferred || (calendar && calendar.parentElement) || root;
        if (mountPoint === host || host.contains(mountPoint)) mountPoint = root;
        mountPoint.appendChild(host);
    }
    function syncDarsyarDateLanguage(root) {
        if (!root?.querySelectorAll) return;
        const activeState=root.__mmDatePickerState;
        const activeInput=activeState?.input || null;
        const overlay=root.querySelector('#mm-date-picker-overlay');
        const wasOpen=Boolean(overlay && !overlay.hidden && activeInput);
        if (overlay) overlay.remove();
        root.__mmDatePickerState=null;
        root.querySelectorAll('input[data-mm-date-picker-ready]').forEach(input=>{
            const iso=isIsoDate(input.dataset.mmIsoDate) ? input.dataset.mmIsoDate : (isIsoDate(input.value) ? input.value : '');
            if (!iso) return;
            const mode=document.documentElement.lang==='en'?'gregory':'persian';
            input.dataset.mmIsoDate=iso;
            input.dataset.mmDateMode=mode;
            input.dataset.mmDisplayDate=formatDateForMode(iso,mode);
            input.value=input.dataset.mmDisplayDate;
            input.placeholder=document.documentElement.lang==='en'?'Choose a date':'برای انتخاب تاریخ کلیک کن';
        });
        if (wasOpen && activeInput?.isConnected) requestAnimationFrame(()=>openCalendarPicker(root,activeInput));
    }
    function enhanceWorkspace(root) {
        replaceDarsyarIcons(root);
        hideDuplicateDarsyarControls(root);
        useHomeIconForDashboard(root);
        setupFlexibleStudyTime(root);
        wireDarsyarDateFields(root);
        syncSelectedDateDisplays(root);
        wireCanonicalDateSubmission(root);
        // برنامه‌ریز درس‌خواندن حذف شد — در صورت وجود از DOM برداشته شود
        root.querySelectorAll('#mm-study-planner').forEach(el => el.remove());
    }

    function syncTimeBasedDarsyarGreeting(root) {
        const app = root?.querySelector?.('.darsyar-app');
        const title = root?.querySelector?.('#dsGreetingTitle');
        if (!app || !title) return;

        const lang = app.lang === 'en' ? 'en' : app.lang === 'fa' ? 'fa' : (document.documentElement.lang === 'en' ? 'en' : 'fa');
        const hour = new Date().getHours();
        const greeting = lang === 'en'
            ? (hour >= 4 && hour < 11 ? 'Good morning' : hour >= 11 && hour < 16 ? 'Good afternoon' : hour >= 16 && hour < 19 ? 'Good evening' : 'Good night')
            : (hour >= 4 && hour < 11 ? 'صبح بخیر' : hour >= 11 && hour < 16 ? 'ظهر بخیر' : hour >= 16 && hour < 19 ? 'عصر بخیر' : 'شب بخیر');

        // Retain the existing profile name when the controller rewrites its greeting.
        const current = String(title.textContent || '').trim();
        const nameFromTitle = current
            .replace(/^(?:صبح بخیر|ظهر بخیر|عصر بخیر|شب بخیر|Good morning|Good afternoon|Good evening|Good night)[،,]\s*/i, '')
            .replace(/[!！]\s*$/, '').trim();
        let savedName = '';
        try { savedName = String(localStorage.getItem('mathmateName') || '').trim(); } catch (_) {}
        const name = nameFromTitle || savedName || (lang === 'fa' ? 'دوست من' : 'friend');
        const nextText = lang === 'en' ? `${greeting}, ${name}!` : `${greeting}، ${name}!`;
        if (title.textContent !== nextText) title.textContent = nextText;
    }

    function enhanceRoot(root) {
        if (!root || currentRoot === root) return;
        currentRoot = root;
        const style = document.createElement('style');
        style.setAttribute('data-mathmate-darsyar-polish', 'true');
        style.textContent = bridgeStyles;
        root.prepend(style);
        const enhance = () => {
            markGreetingAndCalendar(root);
            syncTimeBasedDarsyarGreeting(root);
            setupMobileSearch(root);
            setupDarsyarSearch(root);
            enhanceWorkspace(root);
            if (!root.querySelector('.darsyar-app')) normalizeDueDateLabels(root);
        };
        enhance();
        if (!root.__mmGreetingClockTimer) {
            root.__mmGreetingClockTimer = window.setInterval(() => syncTimeBasedDarsyarGreeting(root), 60000);
        }
        if (root.querySelector('.darsyar-app')) syncDarsyarDateLanguage(root);
        if (!root.__mmDateLanguageSyncWired) {
            root.__mmDateLanguageSyncWired = true;
            window.addEventListener('mathmate:settings-changed', () => syncDarsyarDateLanguage(root));
            window.addEventListener('mathmate:host-settings', () => syncDarsyarDateLanguage(root));
        }
        if (rootObserver) rootObserver.disconnect();
        rootObserver = new MutationObserver(() => enhance());
        rootObserver.observe(root, { childList: true, subtree: true });
    }
    const connect = () => {
        if (mount.shadowRoot) enhanceRoot(mount.shadowRoot);
    };
    connect();
    document.addEventListener('DOMContentLoaded', connect, { once: true });
    window.addEventListener('load', connect, { once: true });
    window.addEventListener('mathmate:settings-changed', connect);
})();

/* Replace legacy design-system trash icons across the outer MathMate document. */
(function replaceOuterSiteTrashIcons() {
    const replace = (scope) => {
        if (!scope || !scope.querySelectorAll) return;
        const icons = [];
        if (scope.nodeType === Node.ELEMENT_NODE && scope.matches('.ds-icon.ds-icon-trash')) icons.push(scope);
        scope.querySelectorAll('.ds-icon.ds-icon-trash').forEach(icon => icons.push(icon));
        icons.forEach(icon => {
            if (icon.matches('img[data-mm-asset-icon="trash"]')) return;
            const image = document.createElement('img');
            image.src = 'assets/icons/trash.svg';
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            image.dataset.mmAssetIcon = 'trash';
            image.className = 'mm-site-icon mm-site-icon-trash';
            icon.replaceWith(image);
        });
    };
    const scanOpenShadows = (scope) => {
        replace(scope);
        if (!scope || !scope.querySelectorAll) return;
        scope.querySelectorAll('*').forEach(el => { if (el.shadowRoot) scanOpenShadows(el.shadowRoot); });
    };
    scanOpenShadows(document);
    const observer = new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) scanOpenShadows(node);
        }));
    });
    if (document.documentElement) observer.observe(document.documentElement, { childList:true, subtree:true });
})();


/* ================= SPA HASH ROUTING (#/darsyar, #/tools, ...) ================= */
(function mathMateRouter(){
  const ROUTE_BY_PAGE = {
    home: 'home',
    toolsPage: 'tools', tools: 'tools',
    calculatorPage: 'calculator',
    multiplesPage: 'multiples',
    geometryPage: 'geometry',
    gcdLcmPage: 'gcd-lcm',
    learningPage: 'learning',
    factorsPage: 'factors',
    datePage: 'date',
    unitPage: 'unit',
    percentagePage: 'percentage',
    timePage: 'time',
    paintPage: 'paint',
    shoppingPage: 'shopping',
    discountPage: 'discount',
    measurementPage: 'measurement',
    schoolPage: 'school',
    videosPage: 'videos',
    settingsPage: 'settings',
    aboutPage: 'about',
    gamesPage: 'games',
    darsyarPage: 'darsyar'
  };
  const PAGE_BY_ROUTE = {};
  Object.keys(ROUTE_BY_PAGE).forEach((k) => {
    const r = ROUTE_BY_PAGE[k];
    if (!PAGE_BY_ROUTE[r]) PAGE_BY_ROUTE[r] = k.endsWith('Page') || k === 'home' || k === 'tools' ? k : k;
  });
  // normalize map route -> pageId
  const ROUTE_TO_PAGE = {
    home: null,
    tools: 'toolsPage',
    calculator: 'calculatorPage',
    multiples: 'multiplesPage',
    geometry: 'geometryPage',
    'gcd-lcm': 'gcdLcmPage',
    learning: 'learningPage',
    factors: 'factorsPage',
    date: 'datePage',
    unit: 'unitPage',
    percentage: 'percentagePage',
    time: 'timePage',
    paint: 'paintPage',
    shopping: 'shoppingPage',
    discount: 'discountPage',
    measurement: 'measurementPage',
    school: 'schoolPage',
    videos: 'videosPage',
    settings: 'settingsPage',
    about: 'aboutPage',
    games: 'gamesPage',
    darsyar: 'darsyarPage'
  };
  const ROUTE_TO_NAV = {
    home: 'home', tools: 'tools', calculator: 'tools', multiples: 'tools', geometry: 'tools',
    'gcd-lcm': 'tools', learning: 'tools', factors: 'tools', date: 'tools', unit: 'tools',
    percentage: 'tools', time: 'tools', paint: 'paint', shopping: 'shopping', discount: 'discount',
    measurement: 'measurement', school: 'school', videos: 'tools', settings: 'settings',
    about: 'about', games: 'games', darsyar: 'darsyar'
  };

  let suppressHash = false;

  function currentRouteFromHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
    return raw || 'home';
  }

  function setRoute(route, { replace = false } = {}) {
    const path = '#/' + (route || 'home');
    if ((location.hash || '#/home') === path || (route === 'home' && (!location.hash || location.hash === '#' || location.hash === '#/'))) {
      // still update if empty
    }
    suppressHash = true;
    if (replace) history.replaceState({ mmRoute: route }, '', path);
    else {
      if (location.hash !== path) history.pushState({ mmRoute: route }, '', path);
      else history.replaceState({ mmRoute: route }, '', path);
    }
    setTimeout(() => { suppressHash = false; }, 0);
  }

  window.__mmSetRoute = function(pageIdOrRoute, opts) {
    let route = pageIdOrRoute;
    if (ROUTE_BY_PAGE[pageIdOrRoute]) route = ROUTE_BY_PAGE[pageIdOrRoute];
    if (pageIdOrRoute === 'home' || pageIdOrRoute == null) route = 'home';
    setRoute(route, opts || {});
  };

  function navigateToRoute(route, { fromPop = false } = {}) {
    const r = (route || 'home').toLowerCase();
    // Prevent goHome/openTools from writing another history entry while handling back/forward
    const prev = window.__mmSetRoute;
    if (fromPop) window.__mmSetRoute = function(){};
    try {
      if (r === 'home') {
        if (typeof goHome === 'function') goHome();
        return;
      }
      if (r === 'tools') {
        if (typeof openToolsFromSidebar === 'function') openToolsFromSidebar();
        return;
      }
      const pageId = ROUTE_TO_PAGE[r];
      const navKey = ROUTE_TO_NAV[r] || r;
      if (pageId && typeof openPageFromSidebar === 'function') {
        openPageFromSidebar(pageId, navKey, { skipRoute: true });
      }
    } finally {
      if (fromPop) window.__mmSetRoute = prev;
    }
  }

  window.addEventListener('popstate', () => {
    navigateToRoute(currentRouteFromHash(), { fromPop: true });
  });
  window.addEventListener('hashchange', () => {
    if (suppressHash) return;
    navigateToRoute(currentRouteFromHash(), { fromPop: true });
  });

  // Initial route after DOM ready
  function bootRoute() {
    const r = currentRouteFromHash();
    if (r && r !== 'home') navigateToRoute(r, { fromPop: true });
    else if (!location.hash) setRoute('home', { replace: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(bootRoute, 50));
  else setTimeout(bootRoute, 50);
})();
